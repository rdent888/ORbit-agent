# Replica Recon Map — Clone Antigravity
**Target:** Google Antigravity (AGY) → versi Web App lokal
**Platform:** Web App (browser, localhost) — Windows host
**Tanggal recon:** 2026-11-17
**Scope:** Core loop — chat agent + multi-model/multi-akun + terminal + file explorer + resume progress
**Tujuan:** Personal tool, pakai sendiri

---

## Sources

| Sumber | URL / Lokasi | Nilai |
|--------|-------------|-------|
| Antigravity app.md reference | `~/.gemini/antigravity/builtin/skills/antigravity_guide/references/app.md` | ⭐⭐⭐ |
| Antigravity ide.md reference | `~/.gemini/antigravity/builtin/skills/antigravity_guide/references/ide.md` | ⭐⭐⭐ |
| Antigravity cli.md reference | `~/.gemini/antigravity/builtin/skills/antigravity_guide/references/cli.md` | ⭐⭐ |
| Public docs | `https://antigravity.google/docs` | ⭐⭐⭐ |
| Web search hasil | Riset 2025 | ⭐⭐ |
| Live observation | Pakai langsung (user sedang pakai app) | ⭐⭐⭐ |

---

## Screen Inventory

| ID | Screen | Route / Cara buka | Tujuan | Komponen utama | States |
|----|--------|-------------------|--------|---------------|--------|
| S01 | **New Conversation / Home** | Default saat buka app | Mulai chat baru dengan agent | Input box, slash command hint, model selector | Empty, typing |
| S02 | **Chat Canvas** | Saat user kirim pesan | Interaksi utama dengan agent | Message bubbles, tool call cards, artifact cards, progress indicator | Loading, streaming, done, error, waiting-approval |
| S03 | **Left Sidebar — Conversation List** | Selalu terlihat | Navigasi antar sesi chat | List conversation, search, new chat button | Empty, populated, hovered |
| S04 | **Left Sidebar — Projects** | Klik "Projects" di sidebar | Kelola workspace/repo | Project list, add project, active indicator | Empty, active project |
| S05 | **Left Sidebar — Scheduled Tasks** | Klik "Scheduled Tasks" | Kelola task terjadwal | Task list, cron editor, timer, status badge | Empty, running, paused |
| S06 | **Left Sidebar — Skills & Customizations** | Klik "Skills" | Lihat & kelola skills/plugins/rules | Skills list, toggle, install from marketplace | Empty, installed list |
| S07 | **Settings — Global** | Klik Settings icon | Konfigurasi global app | Model selector, permission toggles, theme, sandbox toggle | Default, modified |
| S08 | **Settings — Project Level** | Settings dalam konteks project aktif | Override setting per project | File access policy, internet policy, sandbox, auto-exec | Inheriting global, overridden |
| S09 | **Artifact Panel** | Muncul saat agent buat artifact | Lihat artifact (plan, report, dll) | Markdown render, tabs (Files Changed, Subagents, etc), download | Empty, populated |
| S10 | **Auxiliary Pane — Subagents** | Tab di dalam Auxiliary Pane | Monitor subagent yang berjalan | Subagent list, status badge, logs | Empty, running, done, killed |
| S11 | **Auxiliary Pane — Background Tasks** | Tab di dalam Auxiliary Pane | Monitor background tasks | Task list, progress, cancel button | Empty, running |
| S12 | **Auxiliary Pane — Files Changed** | Tab di dalam Auxiliary Pane | Lihat diff file yang diubah agent | File tree diff, +/- lines, accept/reject | Empty, has changes |
| S13 | **Auxiliary Pane — Terminals** | Tab di dalam Auxiliary Pane | Terminal terintegrasi | xterm.js terminal, multiple tabs, shell selector | Empty, active session |
| S14 | **Model Selector Dropdown** | Klik nama model di chat | Ganti model AI aktif | Model list (Gemini, Claude, dll), thinking level selector | Default, switching |
| S15 | **@ Mention Menu** | Ketik `@` di input | Attach konteks ke pesan | Category list: files, conversations, terminals, rules, MCP | Empty, search |
| S16 | **Slash Command Menu** | Ketik `/` di input | Trigger slash commands | Command list, description, autocomplete | Filtered list |
| S17 | **Permission Approval Dialog** | Saat agent mau jalankan cmd | User review & approve tool call | Command preview, Allow/Deny button, "always allow" option | Pending approval |
| S18 | **Marketplace / Plugin Browser** | Dari Skills panel | Browse & install plugins/skills | Search, categories, plugin cards, install button | Browsing, installing |

---

## User Flows

```
F01  Mulai chat dan jalankan task
     S01 → S02 (kirim pesan) → S09 (artifact muncul) → S17 (approval jika perlu) → S02 (streaming response)
     Edge: token habis di tengah, error API, permission denied

F02  Ganti model AI di tengah percakapan
     S02 → S14 (klik model selector) → pilih model → S02 (lanjut dari titik yang sama)
     Edge: model tidak tersedia, rate limit

F03  Kelola & switch project/workspace
     S03 → S04 → pilih/tambah project → S01 (new conversation di project baru)
     Edge: project folder tidak ditemukan

F04  Pakai terminal terintegrasi
     S02 → S13 (buka terminal tab) → jalankan command → output di terminal
     Edge: command gagal, permission denied, sandbox block

F05  Review & approve tool call
     S02 (agent mau jalankan tool) → S17 (dialog approval) → Allow/Deny → S02 (lanjut)
     Edge: user deny → agent berhenti atau cari alternatif

F06  Attach konteks dengan @mention
     S02 (ketik @) → S15 (mention menu) → pilih file/conversation/terminal → konteks ter-attach → kirim
     Edge: file tidak ditemukan, conversation terlalu lama

F07  Jalankan scheduled task
     S05 → tambah task → set cron/timer → konfirmasi → task jalan di background → S11 (monitor)
     Edge: task gagal, token habis saat jalan

F08  Install skill / plugin
     S06 → S18 (marketplace) → search → install → aktif di sidebar
     Edge: install gagal, konflik plugin

F09  Resume task yang terhenti (FITUR UNIK)
     S02 (task terhenti karena token habis) → notifikasi checkpoint → S14 (ganti model opsional)
     → tombol "Resume from checkpoint" → agent lanjut dari titik terakhir
     Edge: checkpoint tidak ditemukan, model berbeda tidak bisa baca konteks lama

F10  Lihat & kelola subagents
     S02 → S10 (auxiliary pane subagents) → lihat status → kill/message subagent
     Edge: subagent stuck, dead
```

---

## Component List

| Komponen | Variants | States | Dipakai di |
|---------|---------|--------|------------|
| ChatInput | default, with-attachment | empty, typing, sending, disabled | S01, S02 |
| MessageBubble | user, assistant, tool-call, tool-result | default, streaming, error | S02 |
| ToolCallCard | pending, approved, denied, running, done | collapsed, expanded | S02 |
| ArtifactCard | plan, report, code, generative-ui | default, loading, done | S02, S09 |
| ModelSelector | dropdown | default, open, switching | S14 |
| ThinkingLevelSelector | Low/Med/High/Extra | default | S14 |
| SidebarNav | default | collapsed, expanded | S03-S08 |
| ConversationItem | default, active, pinned | hover, selected | S03 |
| ProjectItem | default, active | hover, selected | S04 |
| TerminalPane | default | empty, active, multiple-tabs | S13 |
| DiffViewer | add, remove, modify | collapsed, expanded | S12 |
| SlashCommandMenu | filtered list | open, search | S16 |
| MentionMenu | files, conversations, terminals, rules | open, filtered | S15 |
| PermissionDialog | allow, deny, always-allow | pending | S17 |
| SettingsToggle | on/off, 3-way (allow/ask/deny) | default | S07, S08 |
| StatusBadge | running, done, error, waiting | — | S10, S11 |
| PluginCard | installed, not-installed | default, hover | S18 |
| ProgressIndicator | thinking, streaming, tool-running | animated | S02 |
| CheckpointBanner | resume-available | visible/hidden | S02 (FITUR UNIK) |
| MultiAccountManager | account list, add form | default | S07 (FITUR UNIK) |
| TokenUsageBar | per-account, per-day | normal, warning, limit | S07/S14 (FITUR UNIK) |

---

## Inferred Data Model

```
Conversation
  id, project_id, title, created_at, updated_at,
  model_id (active model), checkpoint_data (json — untuk resume),
  goal (string — goal utama yang harus dicapai)
  evidence: S01 new chat, S03 conversation list, F09 resume flow
  confidence: high

Message
  id, conversation_id, role (user|assistant|tool), content (text/json),
  tool_calls (json array), created_at, token_count,
  model_id (model yang generate pesan ini)
  evidence: S02 chat canvas, message bubbles
  confidence: high

ToolCall
  id, message_id, tool_name, arguments (json), result (json),
  status (pending|approved|denied|done|error), approved_by_user (bool)
  evidence: S17 permission dialog, S02 tool call cards
  confidence: high

Artifact
  id, conversation_id, type (plan|report|code|generative-ui),
  content (markdown/html/json), created_at, version
  evidence: S09 artifact panel
  confidence: high

Project
  id, name, path (local folder path), settings (json — override global),
  created_at
  evidence: S04 projects panel, S08 project settings
  confidence: high

ModelAccount  [FITUR UNIK — tidak ada di original]
  id, provider (gemini|claude|openai|openrouter|custom),
  account_label (string — misal "Akun Gemini 1"),
  api_key (encrypted AES),
  is_active (bool), priority (int — urutan fallback),
  token_limit_per_day (int), tokens_used_today (int),
  last_used_at, last_reset_at
  evidence: dirancang sendiri
  confidence: designed

ModelConfig
  id, name (display name), provider, model_id (string misal "gemini-2.0-flash"),
  context_window, is_enabled
  evidence: S14 model selector
  confidence: high

ScheduledTask
  id, project_id, name, cron_expression, last_run_at, next_run_at,
  status (active|paused|failed), conversation_template (json)
  evidence: S05 scheduled tasks
  confidence: high

Checkpoint  [FITUR UNIK — resume progress]
  id, conversation_id, message_index,
  context_snapshot (json — full context untuk dikirim ke model baru),
  goal_snapshot (string — goal yang harus dicapai),
  progress_summary (string — ringkasan apa yang sudah selesai),
  model_id_at_checkpoint, created_at
  evidence: dirancang sendiri
  confidence: designed

Skill
  id, name, source (builtin|local), enabled (bool), config (json)
  evidence: S06 skills panel
  confidence: medium
```

---

## Yang TIDAK Bisa Di-clone

| Item | Alasan | Alternatif |
|------|--------|-----------|
| Gemini model weights | Closed-source | Pakai API |
| Antigravity Marketplace | Platform Google | Local folder / JSON registry |
| Browser subagent (full CDP) | Sangat kompleks | Playwright basic |
| Swarm realtime message board | Kompleks | Polling / SSE sederhana |
| `agy` CLI exact behavior | IP Google | Buat CLI sendiri (opsional) |
| Telemetry Google | Tidak butuh | — |

---

## Ukuran Project: **L — estimasi 4-8 minggu build solo**

| Area | Prioritas | Kesulitan |
|------|-----------|-----------|
| Chat UI + streaming | must | Medium |
| Multi-model/multi-akun + token rotation | must | Medium (pakai LiteLLM) |
| Integrated terminal | must | Medium-Hard |
| Resume/checkpoint system | must | Hard ⭐ |
| Turbo Mode (local FS access) | must | Medium |
| Artifact rendering | must | Medium |
| File explorer + Monaco editor | must | Medium |
| Settings + permissions UI | must | Easy |
| Subagents monitor | should | Medium |
| Scheduled tasks | could | Easy-Medium |
| Swarm | could | Hard — Fase 2 |

---

## Stack Final

```
Frontend : React 18 + Vite + TailwindCSS + shadcn/ui
Editor   : Monaco Editor
Terminal : xterm.js + node-pty (via backend WebSocket)
Backend  : Python 3.11 + FastAPI + WebSocket
AI Router: LiteLLM (handle multi-provider + key rotation + fallback)
Database : SQLite (via SQLAlchemy) — file lokal, no server
Launch   : start.bat → uvicorn + vite → auto buka browser
```

---

## 5-Line Summary

**Core loop:** User chat → agent jalankan tools (file/terminal/web) → streaming response + artifacts
**Counts:** 18 screens, 10 user flows, 9 entities data model
**3 Bagian Paling Sulit:** (1) Resume/checkpoint system dengan goal-tracking lintas model, (2) xterm.js + node-pty WebSocket bridge, (3) Multi-akun token rotation logic
**Out of scope (fase 1):** Swarm realtime, full browser subagent, marketplace online
**Step berikutnya:** `replica-architect` — desain database schema + API routes + build order
