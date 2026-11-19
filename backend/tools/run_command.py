"""Tool: run_command — robust shell execution across Windows and Linux."""
import asyncio, os, subprocess

SCHEMA = {
    "type": "function",
    "function": {
        "name": "run_command",
        "description": "Run a shell command and return stdout + stderr. Use with caution.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to run"},
                "cwd": {"type": "string", "description": "Working directory (optional)"},
                "timeout": {"type": "integer", "description": "Timeout in seconds (default 30)"},
            },
            "required": ["command"],
        },
    },
}

def _run_shell_sync(cmd: str, cwd: str | None, timeout: int) -> tuple[int, str, str]:
    """Execute shell command synchronously using subprocess.run (works across all Windows event loops)."""
    res = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=cwd if cwd and os.path.isdir(cwd) else None,
        timeout=timeout,
    )
    return res.returncode, res.stdout, res.stderr

async def execute(args: dict, turbo: bool = False) -> str:
    cmd = args.get("command", "")
    if not cmd:
        return "Error: No command provided."
    cwd = args.get("cwd")
    timeout = args.get("timeout", 30)

    try:
        # Use asyncio.to_thread to avoid Windows SelectorEventLoop NotImplementedError
        returncode, stdout, stderr = await asyncio.to_thread(_run_shell_sync, cmd, cwd, timeout)
        result = stdout or ""
        if stderr:
            if result:
                result += f"\nSTDERR:\n{stderr}"
            else:
                result = f"STDERR:\n{stderr}"
        if returncode != 0:
            result += f"\n[Exit code: {returncode}]"
        return result.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return f"Error: Command timed out after {timeout}s."
    except Exception as ex:
        return f"Error executing command: {type(ex).__name__} - {ex}"
