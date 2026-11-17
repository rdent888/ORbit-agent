"""Tool: create_skill — buat skill atau arsitek baru kustom dengan instruksi khusus."""
import services.skill_manager as sm
from database import engine
from sqlalchemy.orm import Session

SCHEMA = {
    "type": "function",
    "function": {
        "name": "create_skill",
        "description": "Create a new custom skill or expert persona with specialized instructions and guidelines.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Short name for the skill (e.g. 'flutter-architect', 'postgres-optimizer')"},
                "description": {"type": "string", "description": "One-line summary of what this skill does and when to use it"},
                "instructions": {"type": "string", "description": "Detailed guidelines, rules, patterns, or workflows for this skill"},
            },
            "required": ["name", "description", "instructions"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    name = args["name"]
    desc = args["description"]
    inst = args["instructions"]

    try:
        with Session(engine) as db:
            res = sm.create_skill(name, desc, inst, db=db)
        return (
            f"✅ Custom skill '{res['name']}' created successfully!\n"
            f"Location: {res['path']}\n"
            f"Description: {desc}\n"
            f"The AI can now use this skill whenever relevant."
        )
    except Exception as ex:
        return f"Error creating skill: {ex}"
