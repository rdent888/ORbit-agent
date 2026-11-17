"""Tool: create_directory — buat folder baru di filesystem lokal."""
import pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "create_directory",
        "description": "Create a directory (and any missing parent directories) on the local filesystem.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Absolute or relative path of the directory to create"},
            },
            "required": ["path"],
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    path = args["path"]
    try:
        pathlib.Path(path).mkdir(parents=True, exist_ok=True)
        return f"Created directory: {path}"
    except Exception as ex:
        return f"Error: {ex}"
