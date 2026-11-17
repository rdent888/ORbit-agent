"""Tool: write_file"""
import aiofiles, os, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "write_file",
        "description": "Write content to a file, creating parent directories if needed.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
                "overwrite": {"type": "boolean", "default": True},
            },
            "required": ["path", "content"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    content = args["content"]
    overwrite = args.get("overwrite", True)
    if not overwrite and os.path.exists(path):
        return f"Error: file exists and overwrite=false: {path}"
    try:
        pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(path, "w", encoding="utf-8") as f:
            await f.write(content)
        return f"Written {len(content)} chars to {path}"
    except Exception as ex:
        return f"Error: {ex}"
