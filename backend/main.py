"""FastAPI main entry point — AGY Local."""
import json, asyncio, datetime, os, pathlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, get_db, Base
from models.all_models import (
    Conversation, Message, ModelAccount, ModelConfig,
    Setting, ToolCall, Artifact, Checkpoint, Project
)
from services.litellm_router import stream_completion, get_ordered_accounts
from services.agent import run_agent
from crypto import encrypt, decrypt

# ── App init ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_defaults()
    yield

app = FastAPI(title="AGY Local", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _seed_defaults():
    db = next(get_db())
    # Migrate: add is_pinned column to conversations if missing
    try:
        db.execute(__import__("sqlalchemy").text("ALTER TABLE conversations ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0"))
        db.commit()
    except Exception:
        pass  # Column already exists
    # Seed settings if empty
    defaults = {
        "tool_execution_policy": '"request-review"',
        "turbo_mode": "false",
        "nonworkspace_file_access": '"ask"',
        "internet_access": '"allow"',
        "theme": '"dark"',
        "default_model_config_id": "null",
        "command_allowlist": "[]",
        "command_denylist": "[]",
        "context_compaction_threshold": "0.8",
        "checkpoint_threshold": "0.75",
    }
    for k, v in defaults.items():
        if not db.query(Setting).filter_by(key=k).first():
            db.add(Setting(key=k, value=v))

    # Seed auto router model
    if not db.query(ModelConfig).filter_by(id="auto").first():
        db.add(ModelConfig(id="auto", display_name="🤖 Auto (Smart Task Router)", provider="auto", model_id="auto", context_window=1000000, sort_order=-1))

    # Seed Hermes Local Agent if not present
    if not db.query(ModelConfig).filter_by(id="mc-hermes-local").first():
        db.add(ModelConfig(
            id="mc-hermes-local",
            display_name="☤ Hermes Agent (Local Engine)",
            provider="hermes",
            model_id="hermes/local",
            context_window=128000,
            sort_order=7
        ))

    # Seed default model configs if empty
    if db.query(ModelConfig).count() <= 1:
        default_models = [
            ModelConfig(id="mc-gemini-flash-lite", display_name="Gemini Flash Lite (Stable)", provider="gemini", model_id="gemini/gemini-flash-lite-latest", context_window=1000000, sort_order=0),
            ModelConfig(id="mc-gemini-flash",  display_name="Gemini 3.8 Flash",  provider="gemini",   model_id="gemini/gemini-3.8-flash",         context_window=1000000, sort_order=1),
            ModelConfig(id="mc-gemini-35-flash-lite", display_name="Gemini 3.5 Flash Lite", provider="gemini", model_id="gemini/gemini-3.5-flash-lite", context_window=1000000, sort_order=2),
            ModelConfig(id="mc-gemini-pro",    display_name="Gemini 2.5 Pro",    provider="gemini",   model_id="gemini/gemini-2.5-pro",           context_window=1000000, sort_order=3),
            ModelConfig(id="mc-claude-sonnet", display_name="Claude Sonnet 4.5", provider="claude",   model_id="anthropic/claude-sonnet-4-5",     context_window=200000,  sort_order=4),
            ModelConfig(id="mc-gpt4o",         display_name="GPT-4o",            provider="openai",   model_id="openai/gpt-4o",                   context_window=128000,  sort_order=5),
            ModelConfig(id="mc-deepseek",      display_name="DeepSeek R1",       provider="openrouter",model_id="openrouter/deepseek/deepseek-r1",context_window=64000,   sort_order=6),
        ]
        for m in default_models:
            db.add(m)
    db.commit()

# ══════════════════════════════════════════════════════════════════════════════
# CONVERSATIONS
# ══════════════════════════════════════════════════════════════════════════════
class ConvCreate(BaseModel):
    title: str = "New Conversation"
    project_id: str | None = None
    model_config_id: str | None = None
    goal: str | None = None

class MessageCreate(BaseModel):
    content: str
    thinking_level: str | None = None   # Low | Medium | High | Extra
    model_config_id: str | None = None
    attachments: list[dict] | None = None

@app.get("/api/conversations")
def list_conversations(project_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Conversation)
    if project_id in ("general", "none", "null"):
        q = q.filter(Conversation.project_id.is_(None))
    elif project_id == "all":
        pass
    elif project_id:
        q = q.filter_by(project_id=project_id)
    else:
        active_proj = db.query(Project).filter_by(is_active=1).first()
        if active_proj:
            q = q.filter_by(project_id=active_proj.id)
        else:
            q = q.filter(Conversation.project_id.is_(None))
    # Pinned conversations first, then by updated_at desc
    convs = q.order_by(Conversation.is_pinned.desc(), Conversation.updated_at.desc()).all()
    return [{"id": c.id, "title": c.title, "status": c.status,
             "model_config_id": c.model_config_id, "project_id": c.project_id,
             "is_pinned": c.is_pinned or 0, "updated_at": c.updated_at} for c in convs]

@app.post("/api/conversations")
def create_conversation(body: ConvCreate, db: Session = Depends(get_db)):
    # Use default model if none specified
    model_id = body.model_config_id
    if not model_id:
        setting = db.query(Setting).filter_by(key="default_model_config_id").first()
        if setting:
            model_id = json.loads(setting.value)
        if not model_id:
            first = db.query(ModelConfig).filter_by(is_enabled=1).order_by(ModelConfig.sort_order).first()
            model_id = first.id if first else None

    # Handle general chat (no project)
    p_id = body.project_id
    if p_id in ("general", "none", "null", ""):
        p_id = None
    elif not p_id:
        active_proj = db.query(Project).filter_by(is_active=1).first()
        if active_proj:
            p_id = active_proj.id

    conv = Conversation(
        title=body.title,
        project_id=p_id,
        model_config_id=model_id,
        goal=body.goal,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": conv.id, "title": conv.title, "model_config_id": conv.model_config_id, "project_id": conv.project_id, "is_pinned": conv.is_pinned or 0}

@app.get("/api/conversations/{conv_id}")
def get_conversation(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    messages = sorted(conv.messages, key=lambda m: m.sequence_index)
    checkpoints = [
        {"id": cp.id, "created_at": cp.created_at, "stop_reason": cp.stop_reason,
         "is_resumed": cp.is_resumed, "progress_summary": cp.progress_summary}
        for cp in conv.checkpoints if not cp.is_resumed
    ]
    return {
        "id": conv.id, "title": conv.title, "status": conv.status,
        "goal": conv.goal, "model_config_id": conv.model_config_id,
        "messages": [{"id": m.id, "role": m.role, "content": m.content,
                      "model_id": m.model_id, "created_at": m.created_at} for m in messages],
        "checkpoints": checkpoints,
    }

@app.patch("/api/conversations/{conv_id}")
def update_conversation(conv_id: str, body: dict, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(404)
    for k in ("title", "goal", "model_config_id", "is_pinned"):
        if k in body:
            setattr(conv, k, body[k])
    conv.updated_at = datetime.datetime.utcnow().isoformat()
    db.commit()
    return {"ok": True}

@app.delete("/api/conversations/{conv_id}")
def delete_conversation(conv_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(404)
    db.delete(conv)
    db.commit()
    return {"ok": True}

# ── Streaming agent endpoint ──────────────────────────────────────────────────
# Active agent tasks: conv_id → asyncio.Task
_active_agents: dict[str, asyncio.Task] = {}
# Pending tool approval queues: conv_id → {tc_id: Future}
_pending_approvals: dict[str, dict[str, asyncio.Future]] = {}
# SSE event queues: conv_id → asyncio.Queue
_sse_queues: dict[str, asyncio.Queue] = {}

@app.post("/api/conversations/{conv_id}/messages")
async def send_message(conv_id: str, body: MessageCreate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(404)

    if body.model_config_id:
        conv.model_config_id = body.model_config_id

    # Save user message
    message_content = body.content
    
    # Handle /goal command: set conversation goal
    if message_content.strip().startswith("/goal"):
        goal_text = message_content.strip()[5:].strip()
        if goal_text:
            conv.goal = goal_text
            conv.updated_at = datetime.datetime.utcnow().isoformat()
            db.commit()

    if body.attachments:
        import base64
        uploads_dir = pathlib.Path(__file__).parent.parent / "data" / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        att_text = []
        for att in body.attachments:
            name = att.get("name", "file")
            att_type = att.get("type", "")
            data_url = att.get("data_url", "")
            if "image" in att_type and data_url:
                try:
                    header, b64data = data_url.split(",", 1) if "," in data_url else ("", data_url)
                    img_bytes = base64.b64decode(b64data)
                    safe_name = "".join(c for c in name if c.isalnum() or c in "._-") or "upload.png"
                    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                    saved_file = uploads_dir / f"{timestamp}_{safe_name}"
                    saved_file.write_bytes(img_bytes)
                    rel_path = str(saved_file).replace("\\", "/")
                    att_text.append(f"### [Lampiran Gambar: {name}]\n- Lokasi File: `{rel_path}`\n- Ukuran: {len(img_bytes)} bytes\n*(Gambar tersimpan di disk lokal untuk mencegah pemborosan token)*")
                except Exception as ex:
                    att_text.append(f"[Lampiran Gambar: {name} (Gagal disimpan: {ex})]")
            elif att.get("text_content"):
                att_text.append(f"### Lampiran File: {name}\n```\n{att['text_content'][:1500]}\n```")
        if att_text:
            message_content = (message_content + "\n\n" + "\n\n".join(att_text)).strip()

    seq = db.query(Message).filter_by(conversation_id=conv_id).count()
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=message_content,
        sequence_index=seq,
    )
    db.add(user_msg)
    conv.status = "active"
    conv.updated_at = datetime.datetime.utcnow().isoformat()
    db.commit()

    # Create SSE queue
    q: asyncio.Queue = asyncio.Queue()
    _sse_queues[conv_id] = q
    _pending_approvals[conv_id] = {}

    async def on_token(chunk: str):
        await q.put({"type": "token", "data": chunk})

    async def on_tool_call(tc: dict) -> bool:
        policy = db.query(Setting).filter_by(key="tool_execution_policy").first()
        exec_policy = json.loads(policy.value) if policy else "request-review"
        turbo = json.loads((db.query(Setting).filter_by(key="turbo_mode").first() or Setting(value="false")).value)
        if exec_policy == "always-proceed" or turbo:
            return True
        # Push approval request to SSE and wait
        fut = asyncio.get_event_loop().create_future()
        _pending_approvals[conv_id][tc["id"]] = fut
        await q.put({"type": "tool_approval", "data": tc})
        return await fut  # waits until /approve or /deny called

    async def on_checkpoint(cp_id: str):
        await q.put({"type": "checkpoint", "data": {"checkpoint_id": cp_id}})

    async def on_error(msg: str):
        await q.put({"type": "error", "data": msg})

    async def on_model_routed(info: str):
        await q.put({"type": "model_routed", "data": info})

    async def run_and_close():
        try:
            await run_agent(
                conv_id,
                db,
                on_token,
                on_tool_call,
                on_checkpoint,
                on_error,
                thinking_level=body.thinking_level,
                on_model_routed=on_model_routed,
            )
        finally:
            await q.put({"type": "done", "data": None})

    task = asyncio.create_task(run_and_close())
    _active_agents[conv_id] = task
    return {"ok": True, "message_id": user_msg.id}

@app.get("/api/conversations/{conv_id}/stream")
async def stream_events(conv_id: str):
    """SSE endpoint: client connects here to receive agent tokens."""
    q = _sse_queues.get(conv_id)
    if not q:
        raise HTTPException(404, "No active stream for this conversation")

    async def event_generator():
        while True:
            event = await q.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] in ("done", "error"):
                _sse_queues.pop(conv_id, None)
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.post("/api/conversations/{conv_id}/cancel")
async def cancel_agent(conv_id: str):
    task = _active_agents.pop(conv_id, None)
    if task:
        task.cancel()
    return {"ok": True}

# ── Tool call approval ────────────────────────────────────────────────────────
@app.post("/api/tool-calls/{tc_id}/approve")
async def approve_tool_call(tc_id: str, conv_id: str):
    pend = _pending_approvals.get(conv_id, {})
    fut = pend.pop(tc_id, None)
    if fut and not fut.done():
        fut.set_result(True)
    return {"ok": True}

@app.post("/api/tool-calls/{tc_id}/deny")
async def deny_tool_call(tc_id: str, conv_id: str):
    pend = _pending_approvals.get(conv_id, {})
    fut = pend.pop(tc_id, None)
    if fut and not fut.done():
        fut.set_result(False)
    return {"ok": True}

@app.delete("/api/messages/{message_id}")
def delete_message(message_id: str, db: Session = Depends(get_db)):
    m = db.query(Message).filter_by(id=message_id).first()
    if not m:
        raise HTTPException(404, "Message not found")
    conv_id = m.conversation_id
    db.delete(m)
    db.commit()
    return {"ok": True, "conversation_id": conv_id}

# ── Workspace & File Management ───────────────────────────────────────────────
class WorkspaceOpenRequest(BaseModel):
    path: str

class WorkspaceCreateFolderRequest(BaseModel):
    path: str

class WorkspaceCreateFileRequest(BaseModel):
    path: str
    content: str = ""

class WorkspaceSaveFileRequest(BaseModel):
    path: str
    content: str

def _get_workspace_path(db: Session) -> str:
    s = db.query(Setting).filter_by(key="workspace_path").first()
    if s and s.value:
        try:
            val = json.loads(s.value)
            if os.path.exists(val):
                return os.path.abspath(val)
        except Exception:
            pass
    # default to project root (e:\.VSCODE\project clone antigravity)
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return root

def _scan_directory(dir_path: str, max_depth: int = 3, current_depth: int = 0):
    if current_depth > max_depth or not os.path.exists(dir_path):
        return []
    items = []
    try:
        with os.scandir(dir_path) as it:
            entries = sorted(list(it), key=lambda e: (not e.is_dir(), e.name.lower()))
            for entry in entries:
                if entry.name.startswith(".") and entry.name not in (".env",):
                    continue
                if entry.name in ("venv", "node_modules", "__pycache__", "dist", "build", ".git"):
                    continue
                item_info = {
                    "name": entry.name,
                    "path": os.path.abspath(entry.path),
                    "is_dir": entry.is_dir(),
                }
                if entry.is_dir() and current_depth < max_depth:
                    item_info["children"] = _scan_directory(entry.path, max_depth, current_depth + 1)
                elif not entry.is_dir():
                    try:
                        item_info["size"] = entry.stat().st_size
                    except Exception:
                        item_info["size"] = 0
                items.append(item_info)
    except PermissionError:
        pass
    return items

@app.get("/api/workspace")
def get_workspace(db: Session = Depends(get_db)):
    ws_path = _get_workspace_path(db)
    tree = _scan_directory(ws_path, max_depth=3)
    return {
        "workspace_path": ws_path,
        "name": os.path.basename(ws_path) or ws_path,
        "tree": tree,
    }

@app.post("/api/workspace/open")
def open_workspace(body: WorkspaceOpenRequest, db: Session = Depends(get_db)):
    target = os.path.abspath(body.path)
    os.makedirs(target, exist_ok=True)
    s = db.query(Setting).filter_by(key="workspace_path").first()
    if not s:
        s = Setting(key="workspace_path", value=json.dumps(target))
        db.add(s)
    else:
        s.value = json.dumps(target)
    db.commit()
    tree = _scan_directory(target, max_depth=3)
    return {
        "ok": True,
        "workspace_path": target,
        "name": os.path.basename(target) or target,
        "tree": tree,
    }

@app.post("/api/workspace/create-folder")
def create_workspace_folder(body: WorkspaceCreateFolderRequest, db: Session = Depends(get_db)):
    ws_path = _get_workspace_path(db)
    target = body.path if os.path.isabs(body.path) else os.path.join(ws_path, body.path)
    os.makedirs(target, exist_ok=True)
    return {"ok": True, "path": target, "tree": _scan_directory(ws_path, max_depth=3)}

@app.post("/api/workspace/create-file")
def create_workspace_file(body: WorkspaceCreateFileRequest, db: Session = Depends(get_db)):
    ws_path = _get_workspace_path(db)
    target = body.path if os.path.isabs(body.path) else os.path.join(ws_path, body.path)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as f:
        f.write(body.content or "")
    return {"ok": True, "path": target, "tree": _scan_directory(ws_path, max_depth=3)}

@app.get("/api/workspace/file")
def read_workspace_file(path: str):
    if not os.path.exists(path) or os.path.isdir(path):
        raise HTTPException(404, f"File not found: {path}")
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return {
            "path": os.path.abspath(path),
            "name": os.path.basename(path),
            "content": content,
            "size": os.path.getsize(path),
        }
    except Exception as e:
        raise HTTPException(500, f"Cannot read file: {e}")

@app.post("/api/workspace/file")
def save_workspace_file(body: WorkspaceSaveFileRequest):
    target = os.path.abspath(body.path)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    try:
        with open(target, "w", encoding="utf-8") as f:
            f.write(body.content)
        return {"ok": True, "path": target, "size": len(body.content)}
    except Exception as e:
        raise HTTPException(500, f"Cannot save file: {e}")

@app.get("/api/workspace/download")
def download_workspace_file(path: str):
    if not os.path.exists(path) or os.path.isdir(path):
        raise HTTPException(404, f"File not found: {path}")
    filename = os.path.basename(path)
    return FileResponse(
        path=path,
        filename=filename,
        media_type="application/octet-stream"
    )

# ── Resume from checkpoint ────────────────────────────────────────────────────
class ResumeBody(BaseModel):
    model_config_id: str | None = None   # optional: switch model on resume

@app.post("/api/conversations/{conv_id}/resume")
async def resume_conversation(conv_id: str, body: ResumeBody, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(404)
    cp = (db.query(Checkpoint)
          .filter_by(conversation_id=conv_id, is_resumed=0)
          .order_by(Checkpoint.created_at.desc())
          .first())
    if not cp:
        raise HTTPException(400, "No checkpoint available to resume from")

    # Optionally switch model
    if body.model_config_id:
        conv.model_config_id = body.model_config_id

    # Restore context from snapshot + inject resume system message
    context = json.loads(cp.context_snapshot)
    resume_msg = {
        "role": "system",
        "content": (
            f"[RESUME] Session was paused. Reason: {cp.stop_reason}.\n"
            f"Goal: {cp.goal_snapshot}\n"
            f"Progress so far: {cp.progress_summary}\n"
            f"Continue exactly from where you left off, maintaining the same goal and approach."
        )
    }
    context.append(resume_msg)

    # Mark checkpoint as resumed
    cp.is_resumed = 1
    cp.resumed_at = datetime.datetime.utcnow().isoformat()
    conv.status = "active"
    db.commit()

    # Save resume system message to DB
    seq = db.query(Message).filter_by(conversation_id=conv_id).count()
    db.add(Message(conversation_id=conv_id, role="system",
                   content=resume_msg["content"], sequence_index=seq))
    db.commit()

    return {"ok": True, "resumed_from": cp.id, "model_config_id": conv.model_config_id}

# ══════════════════════════════════════════════════════════════════════════════
# MODEL ACCOUNTS
# ══════════════════════════════════════════════════════════════════════════════
class AccountCreate(BaseModel):
    provider: str
    account_label: str
    api_key: str
    base_url: str | None = None
    priority: int = 0
    token_limit_per_day: int = 0

@app.get("/api/model-accounts")
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(ModelAccount).order_by(ModelAccount.provider, ModelAccount.priority).all()
    return [{
        "id": a.id, "provider": a.provider, "account_label": a.account_label,
        "is_active": a.is_active, "priority": a.priority,
        "token_limit_per_day": a.token_limit_per_day,
        "tokens_used_today": a.tokens_used_today, "last_used_at": a.last_used_at,
        "api_key_masked": "••••" + decrypt(a.api_key_encrypted)[-4:],
    } for a in accounts]

@app.post("/api/model-accounts")
def add_account(body: AccountCreate, db: Session = Depends(get_db)):
    account = ModelAccount(
        provider=body.provider,
        account_label=body.account_label,
        api_key_encrypted=encrypt(body.api_key),
        base_url=body.base_url,
        priority=body.priority,
        token_limit_per_day=body.token_limit_per_day,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return {"id": account.id}

@app.delete("/api/model-accounts/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    a = db.query(ModelAccount).filter_by(id=account_id).first()
    if not a: raise HTTPException(404)
    db.delete(a)
    db.commit()
    return {"ok": True}

class AccountUpdate(BaseModel):
    account_label: str | None = None
    api_key: str | None = None
    base_url: str | None = None
    priority: int | None = None
    token_limit_per_day: int | None = None
    is_active: int | None = None

@app.patch("/api/model-accounts/{account_id}")
def update_account(account_id: str, body: AccountUpdate, db: Session = Depends(get_db)):
    a = db.query(ModelAccount).filter_by(id=account_id).first()
    if not a:
        raise HTTPException(404, "Account not found")
    if body.account_label is not None:
        a.account_label = body.account_label.strip()
    if body.api_key:
        a.api_key_encrypted = encrypt(body.api_key.strip())
    if body.base_url is not None:
        a.base_url = body.base_url.strip() or None
    if body.priority is not None:
        a.priority = body.priority
    if body.token_limit_per_day is not None:
        a.token_limit_per_day = body.token_limit_per_day
    if body.is_active is not None:
        a.is_active = body.is_active
    db.commit()
    return {
        "ok": True,
        "id": a.id,
        "account_label": a.account_label,
        "priority": a.priority,
        "token_limit_per_day": a.token_limit_per_day
    }

@app.post("/api/model-accounts/{account_id}/test")
async def test_account(account_id: str, db: Session = Depends(get_db)):
    a = db.query(ModelAccount).filter_by(id=account_id).first()
    if not a: raise HTTPException(404)
    mc = db.query(ModelConfig).filter_by(provider=a.provider, is_enabled=1).order_by(ModelConfig.sort_order).first()
    try:
        import litellm
        api_key = decrypt(a.api_key_encrypted)
        if a.provider == "bansosai":
            test_model = "openai/agnes-3.0-flash"
            resp = await litellm.acompletion(
                model=test_model,
                messages=[{"role": "user", "content": "Say OK"}],
                api_key=api_key,
                base_url=a.base_url or "https://api.bansosai.app/v1",
                max_tokens=5,
            )
        elif a.provider == "custom":
            test_model = f"openai/{mc.model_id}" if mc else "openai/gpt-4o"
            resp = await litellm.acompletion(
                model=test_model,
                messages=[{"role": "user", "content": "Say OK"}],
                api_key=api_key,
                base_url=a.base_url or "https://api.bansosai.app/v1",
                max_tokens=5,
            )
        elif a.provider == "gemini":
            test_model = "gemini/gemini-3.1-flash-lite"
            resp = await litellm.acompletion(
                model=test_model,
                messages=[{"role": "user", "content": "Say OK"}],
                api_key=api_key,
                max_tokens=5,
            )
        else:
            test_model = mc.model_id if mc else "openai/gpt-4o"
            resp = await litellm.acompletion(
                model=test_model,
                messages=[{"role": "user", "content": "Say OK"}],
                api_key=api_key,
                base_url=a.base_url or None,
                max_tokens=5,
            )
        return {"ok": True, "response": resp.choices[0].message.content}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# ══════════════════════════════════════════════════════════════════════════════
# MODEL MONITOR (Real-time Token Usage & Availability)
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/model-accounts/monitor")
def monitor_accounts(db: Session = Depends(get_db)):
    """Real-time token usage, limit, and availability status per account."""
    accounts = db.query(ModelAccount).order_by(ModelAccount.provider, ModelAccount.priority).all()
    result = []
    for a in accounts:
        # check over limit
        over = a.token_limit_per_day > 0 and a.tokens_used_today >= a.token_limit_per_day
        pct_used = (a.tokens_used_today / a.token_limit_per_day * 100) if a.token_limit_per_day > 0 else 0
        # current usable state
        usable = not over  # True if account can be used
        result.append({
            "id": a.id,
            "provider": a.provider,
            "account_label": a.account_label,
            "is_active": a.is_active,
            "priority": a.priority,
            "token_limit_per_day": a.token_limit_per_day,
            "tokens_used_today": a.tokens_used_today,
            "last_used_at": a.last_used_at,
            "pct_used": round(pct_used, 1),
            "over_limit": over,
            "usable": usable,
            "enabled_models": db.query(ModelConfig).filter_by(provider=a.provider, is_enabled=1).count(),
            "total_models": db.query(ModelConfig).filter_by(provider=a.provider).count(),
        })
    return result

@app.get("/api/model-configs/monitor")
def monitor_configs(db: Session = Depends(get_db)):
    """Real-time model availability with token usage context."""
    configs = db.query(ModelConfig).filter_by(is_enabled=1).order_by(ModelConfig.sort_order).all()
    result = []
    for c in configs:
        # check duplicate against account
        has_account = db.query(ModelAccount).filter_by(provider=c.provider, is_active=1).count() > 0
        result.append({
            "id": c.id,
            "display_name": c.display_name,
            "provider": c.provider,
            "model_id": c.model_id,
            "context_window": c.context_window,
            "is_enabled": True,
            "sort_order": c.sort_order,
            "has_active_account": has_account,
            "usable": has_account,
        })
    # also include disabled configs
    disabled_cfgs = db.query(ModelConfig).filter_by(is_enabled=0).order_by(ModelConfig.sort_order).all()
    for c in disabled_cfgs:
        result.append({
            "id": c.id,
            "display_name": c.display_name,
            "provider": c.provider,
            "model_id": c.model_id,
            "context_window": c.context_window,
            "is_enabled": False,
            "sort_order": c.sort_order,
            "has_active_account": False,
            "usable": False,
        })
    return result

@app.get("/api/monitor/realtime")
def monitor_realtime(db: Session = Depends(get_db)):
    """Comprehensive real-time token limits & model availability monitoring."""
    accounts = db.query(ModelAccount).order_by(ModelAccount.provider, ModelAccount.priority).all()
    accounts_data = []
    total_tokens_today = 0
    
    for a in accounts:
        today = datetime.datetime.utcnow().date().isoformat()
        if a.last_reset_at and a.last_reset_at[:10] != today:
            a.tokens_used_today = 0
            a.last_reset_at = datetime.datetime.utcnow().isoformat()
            db.commit()

        used = a.tokens_used_today or 0
        total_tokens_today += used
        limit = a.token_limit_per_day or 0
        over = limit > 0 and used >= limit
        pct = round((used / limit * 100), 1) if limit > 0 else 0
        
        status = "exhausted" if over else ("warning" if pct >= 85 else "healthy")
        if not a.is_active:
            status = "inactive"

        accounts_data.append({
            "id": a.id,
            "provider": a.provider,
            "account_label": a.account_label,
            "is_active": bool(a.is_active),
            "priority": a.priority,
            "tokens_used_today": used,
            "token_limit_per_day": limit,
            "pct_used": pct,
            "status": status,
            "last_used_at": a.last_used_at,
        })

    active_providers = {a.provider for a in accounts if a.is_active and (a.token_limit_per_day == 0 or a.tokens_used_today < a.token_limit_per_day)}
    active_providers.add("hermes")

    configs = db.query(ModelConfig).filter_by(is_enabled=1).order_by(ModelConfig.sort_order).all()
    models_data = []
    for c in configs:
        is_avail = c.provider == "auto" or c.provider in active_providers or c.provider in ("bansosai", "custom")
        models_data.append({
            "id": c.id,
            "display_name": c.display_name,
            "provider": c.provider,
            "model_id": c.model_id,
            "context_window": c.context_window,
            "is_available": is_avail,
            "status": "online" if is_avail else "offline",
        })

    online_count = sum(1 for m in models_data if m["is_available"] and m["id"] != "auto")
    total_count = len([m for m in models_data if m["id"] != "auto"])

    return {
        "summary": {
            "total_models": total_count,
            "online_models": online_count,
            "total_tokens_today": total_tokens_today,
            "active_accounts": len([a for a in accounts_data if a["is_active"]]),
            "timestamp": datetime.datetime.utcnow().isoformat(),
        },
        "accounts": accounts_data,
        "models": models_data,
    }

# ══════════════════════════════════════════════════════════════════════════════
# MODEL CONFIGS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/model-configs")
def list_model_configs(db: Session = Depends(get_db)):
    configs = db.query(ModelConfig).filter_by(is_enabled=1).order_by(ModelConfig.sort_order).all()
    return [{"id": c.id, "display_name": c.display_name, "provider": c.provider,
             "model_id": c.model_id, "context_window": c.context_window} for c in configs]

class FetchModelsBody(BaseModel):
    base_url: str
    api_key: str
    provider_label: str = "bansosai"

@app.post("/api/model-accounts/fetch-models")
async def fetch_provider_models(body: FetchModelsBody, db: Session = Depends(get_db)):
    base_url = body.base_url.rstrip("/")
    url = f"{base_url}/models" if not base_url.endswith("/models") else base_url
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {"Authorization": f"Bearer {body.api_key}"}
            r = await client.get(url, headers=headers)
            if r.status_code != 200:
                raise HTTPException(r.status_code, f"Provider returned error: {r.text}")
            data = r.json()
            model_items = data.get("data", [])
            imported = []
            skipped = []
            for item in model_items:
                m_id = item.get("id")
                if not m_id:
                    continue
                # Normalize cfg_id from full model_id (dots and slashes → dash)
                safe_id = m_id.replace("/", "-").replace(".", "-").lower()
                cfg_id = f"mc-{body.provider_label}-{safe_id}"
                # Double-guard: check both by id AND by (model_id, provider)
                existing_by_id = db.query(ModelConfig).filter_by(id=cfg_id).first()
                existing_by_model = (
                    db.query(ModelConfig)
                    .filter_by(model_id=m_id, provider=body.provider_label)
                    .first()
                )
                if existing_by_id or existing_by_model:
                    skipped.append(m_id)
                    continue
                new_mc = ModelConfig(
                    id=cfg_id,
                    display_name=f"{m_id} ({body.provider_label})",
                    provider=body.provider_label,
                    model_id=m_id,
                    context_window=128000,
                    sort_order=40,
                )
                db.add(new_mc)
                imported.append(m_id)
            db.commit()
            return {
                "ok": True,
                "imported_count": len(imported),
                "skipped_count": len(skipped),
                "models": imported,
                "skipped": skipped,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch models: {e}")

class CustomModelCreate(BaseModel):
    display_name: str
    provider: str
    model_id: str
    context_window: int = 128000

@app.post("/api/model-configs")
def create_model_config(body: CustomModelCreate, db: Session = Depends(get_db)):
    cfg_id = f"mc-{body.provider}-{body.model_id.replace('/', '-')}"
    existing = db.query(ModelConfig).filter_by(id=cfg_id).first()
    if existing:
        return {"id": existing.id, "display_name": existing.display_name}
    new_mc = ModelConfig(
        id=cfg_id,
        display_name=body.display_name,
        provider=body.provider,
        model_id=body.model_id,
        context_window=body.context_window,
        sort_order=40,
    )
    db.add(new_mc)
    db.commit()
    return {"id": new_mc.id, "display_name": new_mc.display_name}

@app.delete("/api/model-configs/{cfg_id}")
def delete_model_config(cfg_id: str, db: Session = Depends(get_db)):
    cfg = db.query(ModelConfig).filter_by(id=cfg_id).first()
    if not cfg: raise HTTPException(404)
    db.delete(cfg)
    db.commit()
    return {"ok": True}

# ══════════════════════════════════════════════════════════════════════════════
# SETTINGS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(Setting).all()
    return {r.key: json.loads(r.value) for r in rows}

@app.patch("/api/settings")
def update_settings(body: dict, db: Session = Depends(get_db)):
    for k, v in body.items():
        row = db.query(Setting).filter_by(key=k).first()
        if row:
            row.value = json.dumps(v)
            row.updated_at = datetime.datetime.utcnow().isoformat()
        else:
            db.add(Setting(key=k, value=json.dumps(v)))
    db.commit()
    return {"ok": True}

# ══════════════════════════════════════════════════════════════════════════════
# PROJECTS
# ══════════════════════════════════════════════════════════════════════════════
class ProjectCreate(BaseModel):
    name: str
    path: str
    turbo_mode: bool = False

@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    # Seed default project if empty
    if not projects:
        ws_path = _get_workspace_path(db)
        p = Project(
            name=os.path.basename(ws_path) or "Default Project",
            path=ws_path,
            is_active=1,
            settings=json.dumps({"turbo_mode": False})
        )
        db.add(p)
        db.commit()
        projects = [p]

    result = []
    for p in projects:
        settings_dict = json.loads(p.settings or "{}")
        result.append({
            "id": p.id,
            "name": p.name,
            "path": p.path,
            "is_active": p.is_active,
            "turbo_mode": settings_dict.get("turbo_mode", False),
            "created_at": p.created_at,
        })
    return result

@app.post("/api/projects")
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    target_path = os.path.abspath(body.path)
    os.makedirs(target_path, exist_ok=True)
    db.query(Project).update({"is_active": 0})
    p = Project(
        name=body.name,
        path=target_path,
        is_active=1,
        settings=json.dumps({"turbo_mode": body.turbo_mode})
    )
    db.add(p)
    # update global workspace_path setting
    s = db.query(Setting).filter_by(key="workspace_path").first()
    if s:
        s.value = json.dumps(target_path)
    else:
        db.add(Setting(key="workspace_path", value=json.dumps(target_path)))
    # update global turbo_mode setting
    t = db.query(Setting).filter_by(key="turbo_mode").first()
    if t:
        t.value = json.dumps(body.turbo_mode)
    else:
        db.add(Setting(key="turbo_mode", value=json.dumps(body.turbo_mode)))
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "name": p.name,
        "path": p.path,
        "turbo_mode": body.turbo_mode,
        "is_active": 1,
    }

@app.post("/api/projects/{project_id}/activate")
def activate_project(project_id: str, db: Session = Depends(get_db)):
    db.query(Project).update({"is_active": 0})
    p = db.query(Project).filter_by(id=project_id).first()
    if not p: raise HTTPException(404)
    p.is_active = 1
    # update global workspace_path setting to this project's path
    s = db.query(Setting).filter_by(key="workspace_path").first()
    if s:
        s.value = json.dumps(p.path)
    # update global turbo_mode setting
    settings_dict = json.loads(p.settings or "{}")
    turbo = settings_dict.get("turbo_mode", False)
    t = db.query(Setting).filter_by(key="turbo_mode").first()
    if t:
        t.value = json.dumps(turbo)
    db.commit()
    return {"ok": True, "path": p.path, "turbo_mode": turbo}

@app.post("/api/projects/deactivate")
def deactivate_all_projects(db: Session = Depends(get_db)):
    db.query(Project).update({"is_active": 0})
    db.commit()
    return {"ok": True}

@app.patch("/api/projects/{project_id}")
def update_project(project_id: str, body: dict, db: Session = Depends(get_db)):
    p = db.query(Project).filter_by(id=project_id).first()
    if not p: raise HTTPException(404)
    if "name" in body: p.name = body["name"]
    if "path" in body:
        p.path = os.path.abspath(body["path"])
        os.makedirs(p.path, exist_ok=True)
    settings_dict = json.loads(p.settings or "{}")
    if "turbo_mode" in body:
        settings_dict["turbo_mode"] = body["turbo_mode"]
        p.settings = json.dumps(settings_dict)
        if p.is_active:
            t = db.query(Setting).filter_by(key="turbo_mode").first()
            if t: t.value = json.dumps(body["turbo_mode"])
    db.commit()
    return {"ok": True}

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter_by(id=project_id).first()
    if not p: raise HTTPException(404)
    db.delete(p)
    db.commit()
    return {"ok": True}

# ══════════════════════════════════════════════════════════════════════════════
# TERMINAL (WebSocket) — Windows ConPTY via winpty
# ══════════════════════════════════════════════════════════════════════════════
@app.websocket("/ws/terminal/{session_id}")
async def terminal_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    db = next(get_db())
    ws_path = _get_workspace_path(db)
    if not os.path.exists(ws_path):
        ws_path = os.getcwd()

    try:
        from winpty import PtyProcess
        # Spawn native Windows pseudo-terminal running PowerShell in the project workspace
        proc = PtyProcess.spawn(
            ["powershell.exe", "-NoLogo"],
            cwd=ws_path,
            dimensions=(30, 100)
        )
        loop = asyncio.get_event_loop()

        async def pty_reader():
            while proc.isalive():
                try:
                    data = await loop.run_in_executor(None, lambda: proc.read(1024) if proc.isalive() else "")
                    if data:
                        await websocket.send_text(data)
                    else:
                        await asyncio.sleep(0.02)
                except Exception:
                    break

        reader_task = asyncio.create_task(pty_reader())

        async for msg in websocket.iter_text():
            if proc.isalive():
                proc.write(msg)

        reader_task.cancel()
        if proc.isalive():
            proc.close()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(f"\r\n[Terminal Error: {e}]\r\n")
        except Exception:
            pass

# ══════════════════════════════════════════════════════════════════════════════
# SKILLS & PLUGINS EXTENSION SYSTEM
# ══════════════════════════════════════════════════════════════════════════════
import services.skill_manager as sm

class SkillInstallBody(BaseModel):
    repo_url: str
    skill_name: str | None = None

class SkillImportLocalBody(BaseModel):
    local_path: str
    skill_name: str | None = None

class SkillCreateBody(BaseModel):
    name: str
    description: str
    instructions: str

@app.get("/api/skills")
def list_skills(db: Session = Depends(get_db)):
    """List all installed skills, synced with skills directory."""
    return sm.sync_skills_to_db(db)

@app.post("/api/skills/install")
async def install_skill_endpoint(body: SkillInstallBody, db: Session = Depends(get_db)):
    """Install skill from Git repository URL."""
    try:
        res = await sm.install_from_git(body.repo_url, skill_name=body.skill_name, db=db)
        return res
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/api/skills/import-local")
def import_local_skill_endpoint(body: SkillImportLocalBody, db: Session = Depends(get_db)):
    """Import skill from local PC directory."""
    try:
        res = sm.import_local_skill(body.local_path, custom_name=body.skill_name, db=db)
        return res
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/api/skills/create")
def create_skill_endpoint(body: SkillCreateBody, db: Session = Depends(get_db)):
    """Create a new custom skill locally."""
    try:
        res = sm.create_skill(body.name, body.description, body.instructions, db=db)
        return res
    except Exception as e:
        raise HTTPException(400, str(e))

@app.patch("/api/skills/{skill_id}/toggle")
def toggle_skill_endpoint(skill_id: str, db: Session = Depends(get_db)):
    """Enable or disable an installed skill."""
    s = db.query(Skill).filter_by(id=skill_id).first()
    if not s:
        raise HTTPException(404, "Skill not found")
    s.enabled = 0 if s.enabled == 1 else 1
    db.commit()
    return {"ok": True, "enabled": bool(s.enabled)}

@app.delete("/api/skills/{skill_id}")
def delete_skill_endpoint(skill_id: str, db: Session = Depends(get_db)):
    """Uninstall and remove a skill."""
    s = db.query(Skill).filter_by(id=skill_id).first()
    if not s:
        raise HTTPException(404, "Skill not found")
    # Delete folder if exists
    if s.folder_path and os.path.exists(s.folder_path):
        import shutil
        shutil.rmtree(s.folder_path, ignore_errors=True)
    db.delete(s)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
