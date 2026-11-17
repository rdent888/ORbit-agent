"""Tool: delete_file — hapus file atau folder kosong dari filesystem lokal."""
import os, shutil, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "delete_file",
        "description": "Delete a file or empty directory from the local filesystem.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative path to delete"},
                "recursive": {"type": "boolean", "default": False,
                              "description": "If true, delete directory and all its contents (rm -rf)"},
            },
            "required": ["path"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    recursive = args.get("recursive", False)
    p = pathlib.Path(path)
    if not p.exists():
        return f"Error: path not found: {path}"
    try:
        if p.is_dir():
            if recursive:
                shutil.rmtree(p)
                return f"Deleted directory (recursive): {path}"
            else:
                p.rmdir()
                return f"Deleted empty directory: {path}"
        else:
            p.unlink()
            return f"Deleted file: {path}"
    except Exception as ex:
        return f"Error: {ex}"
