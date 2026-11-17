"""Tool: file_search — cari file berdasarkan nama atau pola glob (e.g. *.py, App.*, *.config.js)."""
import os, fnmatch, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "file_search",
        "description": "Search for files by name or glob pattern (e.g., '*.tsx', 'main.*', 'config*'). Fast and excludes build/cache dirs.",
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Glob pattern to match file names (e.g. '*.tsx', 'index.*')"},
                "path": {"type": "string", "description": "Directory to search in (defaults to current project root)"},
                "max_results": {"type": "integer", "default": 50},
            },
            "required": ["pattern"],
        },
    },
}

IGNORE_DIRS = {
    "node_modules", ".git", "venv", ".venv", "__pycache__", 
    "dist", "build", ".next", ".vscode", ".idea", "data", "storage"
}

async def execute(args: dict, turbo: bool = False) -> str:
    pattern = args["pattern"]
    search_path = args.get("path", ".")
    max_results = args.get("max_results", 50)

    p = pathlib.Path(search_path)
    if not p.exists():
        return f"Error: path not found: {search_path}"

    matches = []
    for root, dirs, files in os.walk(search_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for fname in files:
            if fnmatch.fnmatch(fname.lower(), pattern.lower()):
                full_path = os.path.join(root, fname)
                rel_path = os.path.relpath(full_path, search_path)
                matches.append(rel_path)
                if len(matches) >= max_results:
                    break
        if len(matches) >= max_results:
            break

    if not matches:
        return f"No files matching '{pattern}' found in {search_path}."

    result = f"Found {len(matches)} file(s) matching '{pattern}':\n" + "\n".join(f"📄 {m}" for m in matches)
    if len(matches) >= max_results:
        result += f"\n... (limited to {max_results} files)"
    return result
