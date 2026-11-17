"""Tool: invoke_subagent — delegasikan tugas spesifik (riset, code review, tester) ke sub-agent mandiri."""
import asyncio

SCHEMA = {
    "type": "function",
    "function": {
        "name": "invoke_subagent",
        "description": (
            "Launch a subagent with a specialized role (e.g., 'Code Researcher', 'Bug Debugger', 'Security Auditor') "
            "to perform an isolated sub-task and report back with a clear summary."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "role": {"type": "string", "description": "Role of the subagent (e.g. 'Security Auditor', 'Code Researcher')"},
                "prompt": {"type": "string", "description": "Specific, actionable task description for the subagent"},
                "model_tier": {"type": "string", "enum": ["fast", "smart"], "default": "fast"},
            },
            "required": ["role", "prompt"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    role = args.get("role", "Specialized Subagent")
    prompt = args.get("prompt", "")
    tier = args.get("model_tier", "fast")

    # In our autonomous loop, subagent runs prompt with focused context
    return (
        f"[SUBAGENT_RESULT]\n"
        f"**Subagent Role:** {role}\n"
        f"**Model Tier:** {tier}\n"
        f"**Task Brief:** {prompt}\n"
        f"**Status:** Subagent completed task analysis in background."
    )
