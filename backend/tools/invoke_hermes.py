"""Tool: invoke_hermes — delegasikan eksekusi atau analisa ke local Hermes Autonomous Agent."""
import asyncio, os, re, subprocess

HERMES_BIN = r"C:\Users\rdent\AppData\Local\hermes\bin\hermes.exe"

SCHEMA = {
    "type": "function",
    "function": {
        "name": "invoke_hermes",
        "description": (
            "Delegate an autonomous task, terminal loop, or code review to the local Hermes Autonomous Agent (Nous Research). "
            "Hermes executes locally on this machine with direct terminal and project file access (Zero Cloud Token Cost)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "task": {
                    "type": "string",
                    "description": "Clear, actionable prompt or task for Hermes Agent (e.g. 'Audit query.sql for performance bottlenecks', 'Run git diff and summarize changes')",
                },
                "cwd": {
                    "type": "string",
                    "description": "Directory to run Hermes in (optional, defaults to current active project folder)",
                },
                "timeout": {
                    "type": "integer",
                    "description": "Max execution time in seconds (default 120)",
                },
            },
            "required": ["task"],
        },
    },
}

def _clean_output(raw: str) -> str:
    """Strip ANSI escape sequences and format Hermes output cleanly."""
    ansi_escape = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]|\x1b\([B0]')
    cleaned = ansi_escape.sub('', raw)
    cleaned = re.sub(r'38;2;\d+;\d+;\d+m?', '', cleaned)
    return cleaned.strip()

def _run_hermes_sync(cmd_args: list[str], cwd: str | None, timeout: int) -> tuple[int, str, str]:
    """Execute Hermes synchronously via subprocess.run (works across all Windows event loops)."""
    res = subprocess.run(
        cmd_args,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=cwd if cwd and os.path.isdir(cwd) else None,
        timeout=timeout,
    )
    return res.returncode, res.stdout, res.stderr

async def execute(args: dict, turbo: bool = False) -> str:
    task = args.get("task", "")
    cwd = args.get("cwd")
    timeout = args.get("timeout", 120)

    if not os.path.exists(HERMES_BIN):
        return f"Error: Hermes binary not found at '{HERMES_BIN}'."

    cmd_args = [HERMES_BIN, "chat", "-q", task]
    if cwd and os.path.isdir(cwd):
        cmd_args.extend(["--in", cwd])

    try:
        # Use asyncio.to_thread to avoid Windows SelectorEventLoop NotImplementedError
        returncode, stdout, stderr = await asyncio.to_thread(_run_hermes_sync, cmd_args, cwd, timeout)

        cleaned_out = _clean_output(stdout)
        cleaned_err = _clean_output(stderr)

        result_content = cleaned_out
        if "☤ Hermes" in cleaned_out:
            parts = cleaned_out.split("☤ Hermes", 1)
            result_content = parts[1].strip()
            if "Resume this session with:" in result_content:
                result_content = result_content.split("Resume this session with:")[0].strip()

        header = (
            f"☤ **[Hermes Autonomous Agent — Local Execution Report]**\n"
            f"> **Task:** {task}\n"
            f"> **Engine:** Nous Research Local Runtime (Zero Cloud Cost)\n\n"
        )

        output = header + result_content
        if returncode != 0 and cleaned_err:
            output += f"\n\n*Notice/Stderr:*\n```\n{cleaned_err[:400]}\n```"

        return output or "(Hermes completed task with empty response)"

    except subprocess.TimeoutExpired:
        return f"Hermes Agent timed out after {timeout} seconds."
    except Exception as ex:
        return f"Error executing Hermes Agent: {type(ex).__name__} - {ex}"
