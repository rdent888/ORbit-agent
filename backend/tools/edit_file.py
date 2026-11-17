"""Tool: edit_file — cari dan ganti teks di dalam file yang sudah ada."""
import aiofiles, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "edit_file",
        "description": (
            "Edit an existing file by replacing a specific string (target) with a new string (replacement). "
            "Use this for targeted edits instead of rewriting the whole file. "
            "If target is not found, returns an error."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "path":        {"type": "string", "description": "Path to the file"},
                "target":      {"type": "string", "description": "Exact string to find and replace"},
                "replacement": {"type": "string", "description": "String to replace the target with"},
            },
            "required": ["path", "target", "replacement"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    target = args["target"]
    replacement = args["replacement"]
    p = pathlib.Path(path)
    if not p.exists():
        return f"Error: file not found: {path}"
    try:
        async with aiofiles.open(path, "r", encoding="utf-8", errors="replace") as f:
            content = await f.read()
        if target not in content:
            return f"Error: target string not found in {path}. No changes made."
        new_content = content.replace(target, replacement)
        count = content.count(target)
        async with aiofiles.open(path, "w", encoding="utf-8") as f:
            await f.write(new_content)
        return f"Edited {path}: replaced {count} occurrence(s) of target string."
    except Exception as ex:
        return f"Error: {ex}"
