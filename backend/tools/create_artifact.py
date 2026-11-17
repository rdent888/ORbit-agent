"""Tool: create_artifact — buat dokumen laporan arsitektur, diagram Mermaid, atau rencana kerja."""
import os, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "create_artifact",
        "description": "Create a persistent structured artifact (e.g., architecture report, design doc, mermaid diagram, or task checklist).",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Title of the artifact (e.g. 'Database Architecture Plan')"},
                "type": {
                    "type": "string", 
                    "enum": ["document", "diagram", "plan", "code_snippet"],
                    "description": "Type of the artifact"
                },
                "content": {"type": "string", "description": "Markdown content (supports KaTeX, tables, and ```mermaid diagrams)"},
                "filename": {"type": "string", "description": "Optional filename (e.g., 'architecture.md')"},
            },
            "required": ["title", "content"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    title = args["title"]
    art_type = args.get("type", "document")
    content = args["content"]
    fname = args.get("filename") or f"{title.lower().replace(' ', '_')[:30]}.md"

    # Save to artifacts directory in project
    artifacts_dir = pathlib.Path(".artifacts")
    try:
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        art_path = artifacts_dir / fname
        with open(art_path, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n*Type: {art_type}*\n\n{content}")
        return f"Artifact '{title}' ({art_type}) created and saved to {art_path}"
    except Exception as ex:
        return f"Created artifact '{title}' in memory (File error: {ex})"
