"""Tool: run_command"""
import asyncio, shlex

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

async def execute(args: dict, turbo: bool = False) -> str:
    cmd = args["command"]
    cwd = args.get("cwd")
    timeout = args.get("timeout", 30)
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        out = stdout.decode("utf-8", errors="replace")
        err = stderr.decode("utf-8", errors="replace")
        result = out
        if err:
            result += f"\nSTDERR:\n{err}"
        if proc.returncode != 0:
            result += f"\n[Exit code: {proc.returncode}]"
        return result or "(no output)"
    except asyncio.TimeoutError:
        return f"Error: command timed out after {timeout}s"
    except Exception as ex:
        return f"Error: {ex}"
