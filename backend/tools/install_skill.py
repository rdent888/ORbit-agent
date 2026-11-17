"""Tool: install_skill — install skill/plugin baru langsung dari link repo GitHub atau URL git."""
import services.skill_manager as sm
from database import engine
from sqlalchemy.orm import Session

SCHEMA = {
    "type": "function",
    "function": {
        "name": "install_skill",
        "description": "Install a new skill, architect persona, or plugin from a GitHub repository link or git URL.",
        "parameters": {
            "type": "object",
            "properties": {
                "repo_url": {"type": "string", "description": "GitHub repository URL or git link (e.g. 'https://github.com/user/my-skill')"},
                "skill_name": {"type": "string", "description": "Optional custom name for the skill"},
            },
            "required": ["repo_url"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    repo_url = args["repo_url"]
    skill_name = args.get("skill_name")

    try:
        with Session(engine) as db:
            res = await sm.install_from_git(repo_url, skill_name=skill_name, db=db)
        return (
            f"✅ Skill '{res['name']}' successfully installed from {repo_url}!\n"
            f"Directory: {res['path']}\n"
            f"Description: {res.get('description', 'No description')}\n"
            f"The AI can now use this skill automatically."
        )
    except Exception as ex:
        return f"❌ Failed to install skill from {repo_url}: {ex}"
