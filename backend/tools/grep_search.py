"""Tool: grep_search — cari teks atau regex di seluruh file proyek secara cerdas dan hemat token."""
import os, re, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "grep_search",
        "description": (
            "Search for a text pattern or regex across all files in a directory. "
            "Automatically ignores node_modules, .git, venv, and binary files. "
            "Returns file paths, line numbers, and matching lines."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Text or regex pattern to search for"},
                "path": {"type": "string", "description": "Directory to search in (defaults to current project root)"},
                "case_sensitive": {"type": "boolean", "default": False},
                "max_results": {"type": "integer", "default": 30, "description": "Max matching lines to return"},
            },
            "required": ["query"],
        },
    },
}

IGNORE_DIRS = {
    "node_modules", ".git", "venv", ".venv", "__pycache__", 
    "dist", "build", ".next", ".vscode", ".idea", "data", "storage"
}

IGNORE_EXTENSIONS = {
    ".pyc", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", 
    ".exe", ".dll", ".so", ".bin", ".db", ".sqlite", ".zip", ".tar", ".gz"
}

async def execute(args: dict, turbo: bool = False) -> str:
    query = args["query"]
    search_path = args.get("path", ".")
    case_sensitive = args.get("case_sensitive", False)
    max_results = args.get("max_results", 30)

    p = pathlib.Path(search_path)
    if not p.exists():
        return f"Error: path not found: {search_path}"

    flags = 0 if case_sensitive else re.IGNORECASE
    try:
        pattern = re.compile(query, flags)
    except re.error as e:
        return f"Invalid regex pattern: {e}"

    matches = []
    count = 0

    for root, dirs, files in os.walk(search_path):
        # Filter ignore dirs in-place to prevent os.walk from entering them
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext in IGNORE_EXTENSIONS:
                continue

            file_path = os.path.join(root, fname)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, 1):
                        if pattern.search(line):
                            rel_path = os.path.relpath(file_path, search_path)
                            matches.append(f"{rel_path}:{line_num}: {line.strip()[:150]}")
                            count += 1
                            if count >= max_results:
                                break
            except Exception:
                continue

            if count >= max_results:
                break
        if count >= max_results:
            break

    if not matches:
        return f"No matches found for query '{query}' in {search_path}."

    res = f"Found {len(matches)} match(es) for '{query}':\n" + "\n".join(matches)
    if count >= max_results:
        res += f"\n... (truncated at {max_results} results)"
    return res
