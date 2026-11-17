"""Tool: read_file"""
import aiofiles, os

SCHEMA = {
    "type": "function",
    "function": {
        "name": "read_file",
        "description": "Read the contents of a file at the given path.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative file path"},
                "start_line": {"type": "integer", "description": "Start line (1-indexed, optional)"},
                "end_line": {"type": "integer", "description": "End line inclusive (optional)"},
            },
            "required": ["path"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    if not turbo and not _is_safe_path(path):
        return f"Access denied: '{path}' is outside workspace. Enable Turbo Mode for full access."
    try:
        async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
            lines = await f.readlines()
        s = args.get("start_line", 1) - 1
        e = args.get("end_line", len(lines))
        return "".join(lines[s:e])
    except FileNotFoundError:
        return f"Error: file not found: {path}"
    except Exception as ex:
        return f"Error: {ex}"

def _is_safe_path(path: str) -> bool:
    # Allow access within common project dirs; Turbo bypasses this
    blocked = ["C:\\Windows", "C:\\System32", "/etc", "/sys", "/proc"]
    return not any(path.startswith(b) for b in blocked)
