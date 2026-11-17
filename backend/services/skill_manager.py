"""
Skill Manager Service — Antigravity-compatible Skill & Plugin Management.
Supports:
- Git repo cloning (GitHub/GitLab)
- Direct URL download (zip or markdown)
- Local folder import (from user's PC)
- Skill discovery & SKILL.md parsing
"""
import os, sys, shutil, pathlib, asyncio, json, re
import httpx
from sqlalchemy.orm import Session
from models.all_models import Skill

SKILLS_DIR = pathlib.Path("skills").resolve()
SKILLS_DIR.mkdir(parents=True, exist_ok=True)

def _parse_skill_md(file_path: pathlib.Path) -> dict:
    """Parse YAML frontmatter and markdown body from SKILL.md."""
    if not file_path.exists():
        return {"name": file_path.parent.name, "description": "", "instructions": ""}
    
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        # Check for YAML frontmatter between --- and ---
        fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
        if fm_match:
            frontmatter_raw = fm_match.group(1)
            body = fm_match.group(2).strip()
            
            # Simple line-by-line YAML parser
            name = ""
            desc = ""
            for line in frontmatter_raw.splitlines():
                if line.startswith("name:"):
                    name = line.split("name:", 1)[1].strip().strip('"\'')
                elif line.startswith("description:"):
                    desc = line.split("description:", 1)[1].strip().strip('"\'')
            
            return {
                "name": name or file_path.parent.name,
                "description": desc,
                "instructions": body,
            }
        else:
            # First line as title/name
            lines = content.splitlines()
            first_line = lines[0].replace("#", "").strip() if lines else file_path.parent.name
            desc = lines[1].strip() if len(lines) > 1 else ""
            return {
                "name": first_line or file_path.parent.name,
                "description": desc,
                "instructions": content,
            }
    except Exception as e:
        return {"name": file_path.parent.name, "description": f"Error parsing: {e}", "instructions": ""}

def sync_skills_to_db(db: Session) -> list[dict]:
    """Scan skills directory and ensure all folders are in DB."""
    results = []
    if not SKILLS_DIR.exists():
        return results

    for item in SKILLS_DIR.iterdir():
        if item.is_dir():
            skill_md = item / "SKILL.md"
            meta = _parse_skill_md(skill_md)
            skill_name = item.name

            existing = db.query(Skill).filter_by(name=skill_name).first()
            if not existing:
                existing = Skill(
                    name=skill_name,
                    source="local",
                    folder_path=str(item),
                    enabled=1,
                    config=json.dumps({"description": meta["description"], "display_name": meta["name"]}),
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)

            cfg = json.loads(existing.config or "{}")
            results.append({
                "id": existing.id,
                "name": existing.name,
                "display_name": cfg.get("display_name", meta["name"]),
                "description": cfg.get("description", meta["description"]),
                "source": existing.source,
                "folder_path": existing.folder_path,
                "enabled": bool(existing.enabled),
                "created_at": existing.created_at,
            })
    return results

async def install_from_git(repo_url: str, skill_name: str | None = None, db: Session | None = None) -> dict:
    """Clone a git repository containing a skill or plugin."""
    # Sanitize name from URL if not given
    clean_url = repo_url.strip().rstrip("/")
    if not skill_name:
        skill_name = clean_url.split("/")[-1].replace(".git", "")
        # Remove invalid chars
        skill_name = re.sub(r"[^a-zA-Z0-9_\-]", "", skill_name) or "installed-skill"

    target_dir = SKILLS_DIR / skill_name
    if target_dir.exists():
        shutil.rmtree(target_dir, ignore_errors=True)

    # Git clone
    cmd = f'git clone --depth 1 "{clean_url}" "{target_dir}"'
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        err = stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"Git clone failed: {err}")

    # Check or generate SKILL.md
    skill_md = target_dir / "SKILL.md"
    if not skill_md.exists():
        # Check README.md as fallback
        readme = target_dir / "README.md"
        content = ""
        if readme.exists():
            with open(readme, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        else:
            content = f"# Skill: {skill_name}\nInstalled from {clean_url}"
        with open(skill_md, "w", encoding="utf-8") as f:
            f.write(content)

    meta = _parse_skill_md(skill_md)
    if db:
        existing = db.query(Skill).filter_by(name=skill_name).first()
        cfg_data = json.dumps({"description": meta["description"], "display_name": meta["name"], "repo_url": clean_url})
        if existing:
            existing.folder_path = str(target_dir)
            existing.source = "git"
            existing.config = cfg_data
            existing.enabled = 1
        else:
            db.add(Skill(
                name=skill_name,
                source="git",
                folder_path=str(target_dir),
                enabled=1,
                config=cfg_data,
            ))
        db.commit()

    return {"ok": True, "name": skill_name, "path": str(target_dir), "description": meta["description"]}

def import_local_skill(local_path: str, custom_name: str | None = None, db: Session | None = None) -> dict:
    """Import an existing skill folder from user's hard drive."""
    src = pathlib.Path(local_path).resolve()
    if not src.exists():
        raise FileNotFoundError(f"Local path not found: {local_path}")

    skill_name = custom_name or src.name
    skill_name = re.sub(r"[^a-zA-Z0-9_\-]", "", skill_name)

    target_dir = SKILLS_DIR / skill_name

    # Copy folder to our skills directory
    if target_dir.exists():
        shutil.rmtree(target_dir, ignore_errors=True)

    if src.is_dir():
        shutil.copytree(src, target_dir)
    else:
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, target_dir / "SKILL.md")

    skill_md = target_dir / "SKILL.md"
    if not skill_md.exists():
        with open(skill_md, "w", encoding="utf-8") as f:
            f.write(f"# Skill: {skill_name}\nImported from {local_path}")

    meta = _parse_skill_md(skill_md)

    if db:
        existing = db.query(Skill).filter_by(name=skill_name).first()
        cfg_data = json.dumps({"description": meta["description"], "display_name": meta["name"], "original_path": str(src)})
        if existing:
            existing.folder_path = str(target_dir)
            existing.source = "imported_local"
            existing.config = cfg_data
            existing.enabled = 1
        else:
            db.add(Skill(
                name=skill_name,
                source="imported_local",
                folder_path=str(target_dir),
                enabled=1,
                config=cfg_data,
            ))
        db.commit()

    return {"ok": True, "name": skill_name, "path": str(target_dir), "description": meta["description"]}

def create_skill(name: str, description: str, instructions: str, db: Session | None = None) -> dict:
    """Create a new custom skill locally."""
    clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "", name.lower().replace(" ", "-"))
    target_dir = SKILLS_DIR / clean_name
    target_dir.mkdir(parents=True, exist_ok=True)

    content = f"""---
name: "{name}"
description: "{description}"
---

# {name}

{instructions}
"""
    skill_md = target_dir / "SKILL.md"
    with open(skill_md, "w", encoding="utf-8") as f:
        f.write(content)

    if db:
        existing = db.query(Skill).filter_by(name=clean_name).first()
        cfg_data = json.dumps({"description": description, "display_name": name})
        if existing:
            existing.folder_path = str(target_dir)
            existing.config = cfg_data
            existing.enabled = 1
        else:
            db.add(Skill(
                name=clean_name,
                source="created",
                folder_path=str(target_dir),
                enabled=1,
                config=cfg_data,
            ))
        db.commit()

    return {"ok": True, "name": clean_name, "path": str(target_dir), "description": description}

def get_skill_instructions(skill_name: str) -> str:
    """Read the full instructions from SKILL.md of a skill."""
    target_dir = SKILLS_DIR / skill_name
    if not target_dir.exists():
        # Try finding by loose name
        for sub in SKILLS_DIR.iterdir():
            if sub.is_dir() and skill_name.lower() in sub.name.lower():
                target_dir = sub
                break

    skill_md = target_dir / "SKILL.md"
    if not skill_md.exists():
        return f"Skill '{skill_name}' instructions not found (missing SKILL.md)."

    try:
        with open(skill_md, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        return f"Error reading skill '{skill_name}': {e}"

def get_active_skills_catalog(db: Session) -> str:
    """Format active skills for the agent system prompt."""
    skills = db.query(Skill).filter_by(enabled=1).all()
    if not skills:
        return "No external skills installed."

    lines = []
    for s in skills:
        cfg = json.loads(s.config or "{}")
        desc = cfg.get("description") or f"Specialized skill for {s.name}"
        lines.append(f"- **{s.name}**: {desc}")
    return "\n".join(lines)
