"""Tool: git_diff — cek perubahan kode, file baru, atau status repositori git."""
import asyncio, os, pathlib

SCHEMA = {
    "type": "function",
    "function": {
        "name": "git_diff",
        "description": "View git status or diff of changes in the repository. Useful to inspect what code was modified.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Repository path (defaults to current project root)"},
                "staged_only": {"type": "boolean", "default": False, "description": "Only show staged diff"},
                "file_path": {"type": "string", "description": "Specific file to diff (optional)"},
            },
        },
    },
}

async def execute(args: dict, turbo: bool = False) -> str:
    repo_path = args.get("path", ".")
    file_path = args.get("file_path", "")
    staged = args.get("staged_only", False)

    try:
        # Check git status first
        cmd_status = "git status -s"
        proc_status = await asyncio.create_subprocess_shell(
            cmd_status,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=repo_path,
        )
        out_status, err_status = await proc_status.communicate()
        status_text = out_status.decode("utf-8", errors="replace").strip()

        if not status_text:
            return "Git working directory is clean. No modifications detected."

        # Run git diff
        staged_flag = "--staged" if staged else ""
        file_arg = f'-- "{file_path}"' if file_path else ""
        cmd_diff = f"git diff {staged_flag} {file_arg}"
        proc_diff = await asyncio.create_subprocess_shell(
            cmd_diff,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=repo_path,
        )
        out_diff, _ = await proc_diff.communicate()
        diff_text = out_diff.decode("utf-8", errors="replace").strip()

        res = f"### Git Status:\n```\n{status_text}\n```\n"
        if diff_text:
            # Batasi diff maksimal 2500 karakter agar tidak memakan token berlebihan
            if len(diff_text) > 2500:
                diff_text = diff_text[:2500] + "\n... [diff truncated for length]"
            res += f"\n### Git Diff:\n```diff\n{diff_text}\n```"
        return res
    except Exception as ex:
        return f"Git error: {ex} (Make sure git is installed and directory is a git repo)"
