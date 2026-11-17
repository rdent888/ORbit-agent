"""
Core agent loop — receives a user message, runs tool calls, streams response.
Saves checkpoint automatically at 75% of context window.
"""
import json, asyncio, datetime
from typing import Callable, Awaitable
from sqlalchemy.orm import Session

from models.all_models import Conversation, Message, ToolCall, Checkpoint, Setting, Project
from services.litellm_router import stream_completion, resolve_model_for_task
import tools.read_file as tool_read_file
import tools.write_file as tool_write_file
import tools.edit_file as tool_edit_file
import tools.delete_file as tool_delete_file
import tools.run_command as tool_run_command
import tools.list_directory as tool_list_directory
import tools.create_directory as tool_create_directory
import tools.grep_search as tool_grep_search
import tools.file_search as tool_file_search
import tools.git_diff as tool_git_diff
import tools.ask_question as tool_ask_question
import tools.create_artifact as tool_create_artifact
import tools.invoke_subagent as tool_invoke_subagent
import tools.search_web as tool_search_web
import tools.install_skill as tool_install_skill
import tools.import_local_skill as tool_import_local_skill
import tools.read_skill as tool_read_skill
import tools.create_skill as tool_create_skill
import tools.invoke_hermes as tool_invoke_hermes
import services.skill_manager as sm

# ── Tool registry ──────────────────────────────────────────────────────────────
TOOLS = {
    "read_file":          tool_read_file,
    "write_file":         tool_write_file,
    "edit_file":          tool_edit_file,
    "delete_file":        tool_delete_file,
    "create_directory":   tool_create_directory,
    "list_directory":     tool_list_directory,
    "grep_search":        tool_grep_search,
    "file_search":        tool_file_search,
    "git_diff":           tool_git_diff,
    "run_command":        tool_run_command,
    "create_artifact":    tool_create_artifact,
    "ask_question":       tool_ask_question,
    "invoke_subagent":    tool_invoke_subagent,
    "invoke_hermes":      tool_invoke_hermes,
    "search_web":         tool_search_web,
    "install_skill":      tool_install_skill,
    "import_local_skill": tool_import_local_skill,
    "read_skill":         tool_read_skill,
    "create_skill":       tool_create_skill,
}

TOOL_SCHEMAS = [m.SCHEMA for m in TOOLS.values()]

# ── Helpers ────────────────────────────────────────────────────────────────────
def _get_setting(db: Session, key: str, default):
    row = db.query(Setting).filter_by(key=key).first()
    if not row: return default
    return json.loads(row.value)

def _context_pct(messages: list[dict], context_window: int) -> float:
    """Rough token estimate: 1 token ≈ 4 chars."""
    total_chars = sum(len(json.dumps(m)) for m in messages)
    return (total_chars / 4) / context_window

def _build_messages(conversation: Conversation, db: Session) -> list[dict]:
    rows = sorted(conversation.messages, key=lambda m: m.sequence_index)
    total_count = len(rows)
    out = []
    for idx, m in enumerate(rows):
        if m.role == "tool":
            # Token Truncation: output tool dari turn-turn lampau dipangkas jika > 500 chars
            is_recent = (idx >= total_count - 2)
            content = m.content
            if not is_recent and len(content) > 500:
                content = content[:500] + f"\n... [Output truncated to save context tokens ({len(m.content)} chars total)]"
            out.append({"role": "user", "content": f"[System Tool Result]:\n{content}"})
        else:
            out.append({"role": m.role, "content": m.content})
    return out

def _save_checkpoint(conversation: Conversation, messages: list[dict], db: Session, reason: str):
    progress = f"Completed {len(messages)} messages toward goal: {conversation.goal or 'not specified'}"
    cp = Checkpoint(
        conversation_id=conversation.id,
        message_index=len(messages),
        goal_snapshot=conversation.goal or "",
        progress_summary=progress,
        context_snapshot=json.dumps(messages),
        stop_reason=reason,
    )
    db.add(cp)
    conversation.status = "checkpoint_available"
    db.commit()
    return cp.id

# ── Main agent loop ────────────────────────────────────────────────────────────
async def run_agent(
    conversation_id: str,
    db: Session,
    on_token: Callable[[str], Awaitable[None]],
    on_tool_call: Callable[[dict], Awaitable[bool]],  # returns True if approved
    on_checkpoint: Callable[[str], Awaitable[None]],
    on_error: Callable[[str], Awaitable[None]],
    thinking_level: str | None = None,
    on_model_routed: Callable[[str], Awaitable[None]] | None = None,
) -> None:
    conv = db.query(Conversation).filter_by(id=conversation_id).first()
    if not conv:
        await on_error("Conversation not found")
        return

    turbo_mode = _get_setting(db, "turbo_mode", False)
    exec_policy = _get_setting(db, "tool_execution_policy", "request-review")
    checkpoint_threshold = _get_setting(db, "checkpoint_threshold", 0.75)

    messages = _build_messages(conv, db)

    # Resolve model dynamically (supports Auto Smart Router or User Manual selection)
    latest_prompt = messages[-1]["content"] if messages else ""
    try:
        model_cfg, routing_info = resolve_model_for_task(
            conv.model_config_id,
            latest_prompt,
            db,
            message_count=len(messages),
        )
    except Exception as e:
        await on_error(f"Model resolution error: {e}")
        return

    if routing_info and on_model_routed:
        await on_model_routed(routing_info)

    # Dapatkan workspace path dari project aktif
    active_project = db.query(Project).filter_by(is_active=1).first()
    workspace_path = active_project.path if active_project else "."
    skills_catalog = sm.get_active_skills_catalog(db)

    # ── System prompt ──────────────────────────────────────────────────────────
    tool_names = ", ".join(TOOLS.keys())
    system_content = f"""You are Orbit Agent — a powerful autonomous coding assistant with FULL LOCAL FILE SYSTEM ACCESS.
You are running as model '{model_cfg.display_name}' (model ID: '{model_cfg.model_id}').
If asked what model you are, always state clearly: you are {model_cfg.display_name}.

ACTIVE PROJECT WORKSPACE: {workspace_path}

## INSTALLED SKILLS & ARCHITECT PERSONAS:
{skills_catalog}

## CRITICAL RULES — YOU MUST FOLLOW THESE:
1. ALWAYS USE TOOLS for any file, code search, folder, or terminal operations. NEVER just show code — EXECUTE immediately.
2. When searching for code or text in the project → use `grep_search`.
3. When searching for files by name or pattern (*.tsx, *.py) → use `file_search`.
4. When inspecting recent code changes → use `git_diff`.
5. When user asks to CREATE a file → use `write_file` RIGHT NOW.
6. When user asks to EDIT an existing file → use `edit_file` (target/replacement) or `write_file`.
7. When user asks to DELETE a file/folder → use `delete_file` RIGHT NOW.
8. When user asks to RUN a shell/cmd command → use `run_command` RIGHT NOW.
9. When creating architecture reports, diagrams, or plans → use `create_artifact`.
10. When user gives a GitHub link or asks to install a skill/plugin → use `install_skill` RIGHT NOW.
11. When user provides a local path to import an existing skill → use `import_local_skill` RIGHT NOW.
12. When user asks about or wants to apply an installed skill → use `read_skill` to read its instructions first!
13. When user asks to create a new custom skill → use `create_skill`.
14. When delegating a focused sub-task → use `invoke_subagent`.
15. When searching external documentation/web → use `search_web`.
16. When needing clarifying choices from user → use `ask_question`.
17. Relative paths are resolved relative to workspace: {workspace_path}
18. Chain multiple tools in sequence to complete complex tasks autonomously.
19. When user mentions @hermes, asks for Hermes review, or wants to delegate autonomous task execution to local Hermes Agent → use `invoke_hermes` RIGHT NOW.

## AVAILABLE TOOLS:
{tool_names}

## TOOL CALL FORMAT — USE EXACTLY THIS FORMAT IN YOUR OUTPUT:
```tool_call
{{"tool": "write_file", "args": {{"path": "{workspace_path}/filename.txt", "content": "content"}}}}
```
```tool_call
{{"tool": "read_file", "args": {{"path": "{workspace_path}/filename.txt"}}}}
```
```tool_call
{{"tool": "edit_file", "args": {{"path": "{workspace_path}/file.py", "target": "old code", "replacement": "new code"}}}}
```
```tool_call
{{"tool": "grep_search", "args": {{"query": "functionName", "path": "{workspace_path}"}}}}
```
```tool_call
{{"tool": "file_search", "args": {{"pattern": "*.tsx", "path": "{workspace_path}"}}}}
```
```tool_call
{{"tool": "install_skill", "args": {{"repo_url": "https://github.com/user/skill-repo"}}}}
```
```tool_call
{{"tool": "import_local_skill", "args": {{"local_path": "C:/path/to/skill-folder"}}}}
```
```tool_call
{{"tool": "read_skill", "args": {{"skill_name": "replica-architect"}}}}
```
```tool_call
{{"tool": "create_skill", "args": {{"name": "my-skill", "description": "summary", "instructions": "rules"}}}}
```
```tool_call
{{"tool": "git_diff", "args": {{"path": "{workspace_path}"}}}}
```
```tool_call
{{"tool": "invoke_hermes", "args": {{"task": "Run tests and review code for edge cases"}}}}
```
```tool_call
{{"tool": "run_command", "args": {{"command": "python script.py", "cwd": "{workspace_path}"}}}}
```
```tool_call
{{"tool": "create_artifact", "args": {{"title": "System Architecture", "type": "diagram", "content": "mermaid\\n..."}}}}
```
```tool_call
{{"tool": "delete_file", "args": {{"path": "{workspace_path}/file.txt"}}}}
```
```tool_call
{{"tool": "create_directory", "args": {{"path": "{workspace_path}/new_folder"}}}}
```
```tool_call
{{"tool": "list_directory", "args": {{"path": "{workspace_path}"}}}}
```

## BEHAVIOR:
- Action-oriented: execute tools first, explain results afterwards.
- Do NOT just write scripts and ask the user to run them. YOU execute them.
- After every tool execution, review the result and proceed to the next step until task is 100% complete."""

    if conv.goal:
        system_content += f"\n\nPRIMARY GOAL: {conv.goal}\nKeep this goal in mind regardless of model changes."


    if messages and messages[0].get("role") == "system":
        messages[0] = {"role": "system", "content": system_content}
    else:
        messages.insert(0, {"role": "system", "content": system_content})

    for iteration in range(20):  # max 20 tool call rounds
        # Auto-checkpoint at threshold
        if _context_pct(messages, model_cfg.context_window) >= checkpoint_threshold:
            cp_id = _save_checkpoint(conv, messages, db, "token_limit")
            await on_checkpoint(cp_id)
            break

        # Collect streamed response
        full_response = ""
        is_auto_mode = (conv.model_config_id == "auto")
        try:
            async for chunk in stream_completion(model_cfg, messages, db, thinking_level, allow_fallback=is_auto_mode):
                full_response += chunk
                await on_token(chunk)
        except RuntimeError as e:
            cp_id = _save_checkpoint(conv, messages, db, "rate_limit")
            await on_checkpoint(cp_id)
            await on_error(str(e))
            return

        # Save assistant message
        seq = len([m for m in db.query(Message).filter_by(conversation_id=conv.id).all()])
        assistant_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=full_response,
            model_id=model_cfg.model_id,
            sequence_index=seq,
        )
        db.add(assistant_msg)
        db.commit()
        messages.append({"role": "assistant", "content": full_response})

        # Parse tool calls from response (look for JSON tool call blocks)
        tool_calls = _extract_tool_calls(full_response)
        if not tool_calls:
            # No tool calls — agent is done
            conv.status = "completed"
            conv.updated_at = datetime.datetime.utcnow().isoformat()
            db.commit()
            break

        # Execute tool calls
        for tc_data in tool_calls:
            tool_name = tc_data.get("tool")
            tool_args = tc_data.get("args", {})

            tc_row = ToolCall(
                message_id=assistant_msg.id,
                tool_name=tool_name,
                arguments=json.dumps(tool_args),
                status="pending",
            )
            db.add(tc_row)
            db.commit()

            # Check approval policy
            needs_approval = exec_policy == "request-review" and not turbo_mode
            if needs_approval:
                approved = await on_tool_call({"id": tc_row.id, "tool": tool_name, "args": tool_args})
                if not approved:
                    tc_row.status = "denied"
                    db.commit()
                    messages.append({"role": "user", "content": f"[System Tool Result]: Tool '{tool_name}' was denied by user."})
                    continue

            # Execute
            tc_row.status = "running"
            tc_row.started_at = datetime.datetime.utcnow().isoformat()
            db.commit()

            try:
                tool_module = TOOLS.get(tool_name)
                if not tool_module:
                    result = f"Unknown tool: {tool_name}"
                else:
                    result = await tool_module.execute(tool_args, turbo=turbo_mode)

                tc_row.status = "done"
                tc_row.result = json.dumps(result) if not isinstance(result, str) else result
            except Exception as e:
                tc_row.status = "error"
                tc_row.error_message = str(e)
                result = f"Error: {e}"

            tc_row.completed_at = datetime.datetime.utcnow().isoformat()
            db.commit()

            # Feed result back to conversation
            tool_msg = Message(
                conversation_id=conv.id,
                role="tool",
                content=str(result),
                sequence_index=seq + 1,
            )
            db.add(tool_msg)
            db.commit()
            messages.append({"role": "user", "content": f"[System Tool Result for '{tool_name}']:\n{str(result)}"})

def _extract_tool_calls(text: str) -> list[dict]:
    """
    Parse tool calls from assistant response.
    Format agent should output:
    ```tool_call
    {"tool": "read_file", "args": {"path": "/foo/bar.py"}}
    ```
    """
    import re
    pattern = r"```tool_call\s*\n(.*?)\n```"
    matches = re.findall(pattern, text, re.DOTALL)
    result = []
    for m in matches:
        try:
            result.append(json.loads(m.strip()))
        except json.JSONDecodeError:
            pass
    return result
