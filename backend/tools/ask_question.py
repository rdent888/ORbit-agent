"""Tool: ask_question — minta klarifikasi atau pilihan dari user sebelum mengeksekusi langkah krusial."""
import json

SCHEMA = {
    "type": "function",
    "function": {
        "name": "ask_question",
        "description": "Ask the user one or more multiple-choice questions to clarify requirements, tech stack choices, or design decisions.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "description": "The question to ask the user"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of options for user to select from",
                },
                "multi_select": {"type": "boolean", "default": False},
            },
            "required": ["question", "options"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    question = args.get("question", "")
    options = args.get("options", [])
    
    opts_formatted = "\n".join(f"- [ ] {opt}" for opt in options)
    return (
        f"[USER_QUESTION_PROMPT]\n"
        f"**Question:** {question}\n\n"
        f"**Options:**\n{opts_formatted}\n\n"
        f"(Waiting for user response or default selection)"
    )
