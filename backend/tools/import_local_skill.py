"""Tool: import_local_skill — impor skill/plugin yang sudah dimiliki user dari folder harddisk lokal ke dalam app."""
import services.skill_manager as sm
from database import engine
from sqlalchemy.orm import Session

SCHEMA = {
    "type": "function",
    "function": {
        "name": "import_local_skill",
        "description": "Import an existing skill, architect, or plugin folder from the user's local PC/hard drive into the app.",
        "parameters": {
            "type": "object",
            "properties": {
                "local_path": {"type": "string", "description": "Absolute or relative path to the local skill folder or SKILL.md file"},
                "skill_name": {"type": "string", "description": "Optional custom name for the imported skill"},
            },
            "required": ["local_path"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    local_path = args["local_path"]
    skill_name = args.get("skill_name")

    try:
        with Session(engine) as db:
            res = sm.import_local_skill(local_path, custom_name=skill_name, db=db)
        return (
            f"✅ Local skill '{res['name']}' successfully imported!\n"
            f"Source path: {local_path}\n"
            f"App skill directory: {res['path']}\n"
            f"Description: {res.get('description', 'Imported skill')}\n"
            f"You can now ask the AI to apply this skill anytime."
        )
    except Exception as ex:
        return f"❌ Failed to import local skill from '{local_path}': {ex}"
