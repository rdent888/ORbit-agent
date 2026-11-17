"""
LiteLLM-based multi-account and multi-model router.
Supports:
1. Multi-account pooling per provider (Gemini, Claude, OpenAI, OpenRouter, BansosAI, Custom)
2. Custom OpenAI-compatible providers (BansosAI, OneAPI, Ollama) with custom Base URLs
3. Smart Task Complexity routing ('auto' mode):
   - Heavy tasks -> Pro/Sonnet/GPT-4o/DeepSeek R1
   - Light tasks -> Flash Lite/Mini/Fast models
4. Auto-fallback across accounts and alternative models on 503 high demand or 429 rate limit.
"""
import os, json, datetime, asyncio, re
from typing import AsyncIterator, Tuple
import litellm
from sqlalchemy.orm import Session
from models.all_models import ModelAccount, ModelConfig
from crypto import decrypt
from services.task_analyzer import analyze_task_complexity

HERMES_BIN = r"C:\Users\rdent\AppData\Local\hermes\bin\hermes.exe"

def _start_hermes_process(user_prompt: str):
    import subprocess
    return subprocess.Popen(
        [HERMES_BIN, "chat", "-q", user_prompt],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

async def _stream_hermes(messages: list[dict]) -> AsyncIterator[str]:
    """Execute local Hermes Agent and stream output chunks."""
    if not os.path.exists(HERMES_BIN):
        yield "\n[Error: Hermes binary not found at C:\\Users\\rdent\\AppData\\Local\\hermes\\bin\\hermes.exe]"
        return

    user_prompt = messages[-1]["content"] if messages else "Hello"
    ansi_escape = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]|\x1b\([B0]')

    try:
        proc = await asyncio.to_thread(_start_hermes_process, user_prompt)
        started_output = False

        while True:
            line = await asyncio.to_thread(proc.stdout.readline)
            if not line:
                break
            if "☤ Hermes" in line:
                started_output = True
                continue
            if started_output:
                if "Resume this session with:" in line:
                    break
                clean = ansi_escape.sub('', line)
                clean = re.sub(r'38;2;\d+;\d+;\d+m?', '', clean)
                if clean:
                    yield clean

        proc.kill()
    except Exception as ex:
        yield f"\n[Hermes Error: {type(ex).__name__} - {ex}]"

litellm.drop_params = True          # ignore unsupported params per model
litellm.set_verbose = False

MODEL_FALLBACKS = {
    "gemini/gemini-3.8-flash": ["gemini/gemini-3.5-flash-lite", "gemini/gemini-3.1-flash-lite"],
    "openai/gpt-4o": ["openai/gpt-4o-mini"],
    "anthropic/claude-sonnet-4-5": ["anthropic/claude-3-5-haiku-latest"],
}

def _reset_if_needed(account: ModelAccount, db: Session) -> None:
    today = datetime.datetime.utcnow().date().isoformat()
    if account.last_reset_at[:10] != today:
        account.tokens_used_today = 0
        account.last_reset_at = datetime.datetime.utcnow().isoformat()
        db.commit()

def _is_over_limit(account: ModelAccount) -> bool:
    if account.token_limit_per_day == 0:
        return False
    return account.tokens_used_today >= account.token_limit_per_day

def get_ordered_accounts(provider: str, db: Session) -> list[ModelAccount]:
    """Return active accounts for provider, ordered by priority (asc = highest)."""
    accounts = (
        db.query(ModelAccount)
        .filter_by(provider=provider, is_active=1)
        .order_by(ModelAccount.priority)
        .all()
    )
    for a in accounts:
        _reset_if_needed(a, db)
    return [a for a in accounts if not _is_over_limit(a)]

def resolve_model_for_task(
    requested_model_id: str | None,
    prompt: str,
    db: Session,
    message_count: int = 0
) -> Tuple[ModelConfig, str | None]:
    """
    Resolves the actual model to use.
    If requested_model_id is 'auto' (or None), automatically analyzes task complexity
    and selects the best available enabled model.
    Returns (ModelConfig, routing_reason).
    """
    enabled_configs = db.query(ModelConfig).filter_by(is_enabled=1).order_by(ModelConfig.sort_order).all()
    if not enabled_configs:
        raise RuntimeError("No models configured or enabled.")

    # If user explicitly requested a specific model (not 'auto')
    if requested_model_id and requested_model_id != "auto":
        cfg = db.query(ModelConfig).filter_by(id=requested_model_id, is_enabled=1).first()
        if cfg:
            return cfg, None

    # AUTO MODE: Analyze task complexity
    complexity, reason = analyze_task_complexity(prompt, message_count)

    # Find active providers that actually have accounts configured
    active_accounts = db.query(ModelAccount).filter_by(is_active=1).all()
    active_providers = {a.provider for a in active_accounts if not _is_over_limit(a)}

    # Categorize available models by complexity tier
    heavy_candidates = []
    light_candidates = []

    for cfg in enabled_configs:
        # Check if provider has active accounts (or custom/bansosai)
        if cfg.provider not in active_providers and cfg.provider not in ("custom", "bansosai"):
            continue

        model_name = cfg.model_id.lower()
        if any(h in model_name for h in ["pro", "sonnet", "opus", "gpt-4o", "r1", "deepseek", "max"]):
            heavy_candidates.append(cfg)
        else:
            light_candidates.append(cfg)

    chosen: ModelConfig | None = None
    if complexity == "heavy":
        chosen = heavy_candidates[0] if heavy_candidates else (light_candidates[0] if light_candidates else enabled_configs[0])
        routing_info = f"Auto-Routed [Tugas Berat]: Dialihkan ke {chosen.display_name} ({reason})"
    else:
        chosen = light_candidates[0] if light_candidates else (heavy_candidates[0] if heavy_candidates else enabled_configs[0])
        routing_info = f"Auto-Routed [Tugas Ringan]: Dialihkan ke {chosen.display_name} ({reason})"

    return chosen, routing_info

async def stream_completion(
    model_config: ModelConfig,
    messages: list[dict],
    db: Session,
    thinking_level: str | None = None,
    allow_fallback: bool = False,
) -> AsyncIterator[str]:
    """
    Stream completion from the best available account and model.
    Handles standard providers and custom OpenAI-compatible proxies (like BansosAI).
    If allow_fallback is False (manual user model selection), strictly calls that exact model.
    """
    # ── Hermes Local Agent Direct Provider ────────────────────────────
    if model_config.provider == "hermes":
        async for chunk in _stream_hermes(messages):
            yield chunk
        return

    accounts = get_ordered_accounts(model_config.provider, db)
    if not accounts:
        # Fallback check: if provider is 'bansosai' or 'custom', maybe listed under 'custom'
        if model_config.provider in ("bansosai", "custom"):
            accounts = (
                db.query(ModelAccount)
                .filter(ModelAccount.provider.in_(["bansosai", "custom"]), ModelAccount.is_active == 1)
                .order_by(ModelAccount.priority)
                .all()
            )

    if not accounts:
        raise RuntimeError(f"No active accounts found for provider '{model_config.provider}'. Add one in Settings.")

    # Build model candidate chain
    model_candidates = [model_config.model_id]
    if allow_fallback and model_config.model_id in MODEL_FALLBACKS:
        model_candidates.extend(MODEL_FALLBACKS[model_config.model_id])

    last_error = None

    for target_model in model_candidates:
        extra_kwargs: dict = {}
        if thinking_level and model_config.provider == "gemini" and "lite" not in target_model:
            budget_map = {"Low": 1024, "Medium": 8192, "High": 32768, "Extra": 65536}
            extra_kwargs["thinking"] = {"type": "enabled", "budget_tokens": budget_map.get(thinking_level, 8192)}

        for account in accounts:
            api_key = decrypt(account.api_key_encrypted)
            call_model = target_model
            base_url = account.base_url or None

            # Custom / BansosAI provider format for LiteLLM
            if account.provider in ("bansosai", "custom"):
                if not call_model.startswith("openai/"):
                    call_model = f"openai/{call_model}"

            try:
                response = await litellm.acompletion(
                    model=call_model,
                    messages=messages,
                    api_key=api_key,
                    base_url=base_url,
                    stream=True,
                    **extra_kwargs,
                )
                total_tokens = 0
                async for chunk in response:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield delta.content
                    if hasattr(chunk, "usage") and chunk.usage:
                        total_tokens = chunk.usage.total_tokens or 0

                account.tokens_used_today += total_tokens or 0
                account.last_used_at = datetime.datetime.utcnow().isoformat()
                db.commit()
                return

            except (litellm.RateLimitError, litellm.ServiceUnavailableError) as e:
                last_error = f"{e.__class__.__name__} on {target_model} ({account.account_label})"
                await asyncio.sleep(0.5)
                continue
            except litellm.AuthenticationError as e:
                last_error = f"Auth error on '{account.account_label}': {e}"
                continue
            except Exception as e:
                last_error = str(e)
                if "503" in str(e) or "high demand" in str(e).lower():
                    await asyncio.sleep(0.5)
                    continue
                continue

    # Ultimate Fallback: jika semua akun cloud habis dan allow_fallback aktif
    if allow_fallback and os.path.exists(HERMES_BIN):
        yield f"\n\n> ⚠️ *[Auto-Fallback]: Semua akun model cloud sedang limit/exhausted. Beralih otomatis ke ☤ Hermes Agent (Local Engine - Zero Cost)...*\n\n"
        async for chunk in _stream_hermes(messages):
            yield chunk
        return

    raise RuntimeError(f"All accounts and fallback models exhausted. Last error: {last_error}")
