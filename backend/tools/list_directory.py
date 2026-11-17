"""Tool: list_directory"""
import os, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "list_directory",
        "description": "List files and folders in a directory.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "recursive": {"type": "boolean", "default": False},
            },
            "required": ["path"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    recursive = args.get("recursive", False)
    try:
        p = pathlib.Path(path)
        if not p.exists():
            return f"Error: path not found: {path}"
        entries = []
        if recursive:
            for item in sorted(p.rglob("*"))[:200]:
                prefix = "📁 " if item.is_dir() else "📄 "
                entries.append(prefix + str(item.relative_to(p)))
        else:
            for item in sorted(p.iterdir()):
                prefix = "📁 " if item.is_dir() else "📄 "
                entries.append(prefix + item.name)
        return "\n".join(entries) or "(empty directory)"
    except Exception as ex:
        return f"Error: {ex}"
