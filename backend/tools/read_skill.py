"""Tool: read_skill — membaca instruksi dan panduan spesialisasi dari skill yang terpasang."""
import services.skill_manager as sm

SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_skill",
        "description": "Read the detailed instructions and workflow rules from a registered skill's SKILL.md.",
        "parameters": {
            "type": "object",
            "properties": {
                "skill_name": {"type": "string", "description": "Name of the skill to read (e.g. 'replica-architect', 'python-expert')"},
            },
            "required": ["skill_name"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    skill_name = args["skill_name"]
    try:
        content = sm.get_skill_instructions(skill_name)
        # Batasi maksimal 3000 karakter agar hemat token
        if len(content) > 3000:
            content = content[:3000] + "\n\n... [Skill instructions truncated for context efficiency]"
        return f"### Skill Instructions: {skill_name}\n\n{content}"
    except Exception as ex:
        return f"Error loading skill '{skill_name}': {ex}"
