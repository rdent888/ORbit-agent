# Architecture — Clone Antigravity (AGY Local)
**Dibuat:** 2026-11-17
**Stack:** React + Vite + FastAPI (Python) + LiteLLM + SQLite + xterm.js

---

## 1. Stack & Alasannya

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| **Frontend** | React 18 + Vite + TypeScript | Ecosystem terbesar, Vite cepat, TS menghindari bug runtime |
| **Styling** | TailwindCSS + shadcn/ui | Komponen siap pakai, dark mode mudah, tidak perlu design system dari nol |
| **Code Editor** | Monaco Editor | Sama persis dengan VS Code, support 100+ bahasa, diff view built-in |
| **Terminal UI** | xterm.js | Standard industri, dipakai VS Code web, support color + resize |
| **Backend** | Python 3.11 + FastAPI | LiteLLM butuh Python, FastAPI punya WebSocket native + async |
| **WebSocket** | FastAPI WebSocket | Satu server untuk REST + WebSocket + SSE, tidak perlu server tambahan |
| **AI Router** | LiteLLM | Handle 100+ model, key rotation, fallback, rate limit — tidak usah build dari nol |
| **Terminal Backend** | node-pty via subprocess | Spawn real PTY process, pipe ke WebSocket |
| **Database** | SQLite + SQLAlchemy | Zero config, satu file, cukup untuk personal tool, mudah backup |
| **Enkripsi API Key** | Python `cryptography` (Fernet) | Simpan API key terenkripsi di SQLite, key master dari env variable |
| **State Management** | Zustand (frontend) | Ringan, tidak boilerplate seperti Redux |
| **HTTP Client** | Axios + React Query | Cache, retry, loading state otomatis |
| **Launch** | `start.bat` / `start.sh` | Jalankan uvicorn + vite dev dalam satu klik |

---

## 2. Struktur Folder Project

```
agy-local/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # SQLAlchemy setup + SQLite
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── tool_call.py
│   │   ├── artifact.py
│   │   ├── project.py
│   │   ├── model_account.py     # FITUR UNIK
│   │   ├── model_config.py
│   │   ├── checkpoint.py        # FITUR UNIK
│   │   ├── scheduled_task.py
│   │   └── skill.py
│   ├── routers/
│   │   ├── conversations.py
│   │   ├── messages.py
│   │   ├── projects.py
│   │   ├── models.py
│   │   ├── terminal.py          # WebSocket terminal
│   │   ├── files.py             # File explorer + read/write
│   │   ├── settings.py
│   │   ├── checkpoints.py       # FITUR UNIK
│   │   └── skills.py
│   ├── services/
│   │   ├── agent.py             # Core agent loop
│   │   ├── litellm_router.py    # Multi-model + key rotation
│   │   ├── checkpoint_service.py # Simpan + restore checkpoint
│   │   ├── goal_tracker.py      # Track goal + progress
│   │   ├── terminal_service.py  # PTY management
│   │   ├── file_service.py      # Read/write files lokal
│   │   └── permission_service.py # Allow/deny logic
│   ├── tools/                   # Agent tools (dipanggil agent)
│   │   ├── read_file.py
│   │   ├── write_file.py
│   │   ├── run_command.py
│   │   ├── search_web.py
│   │   └── list_directory.py
│   ├── crypto.py                # Enkripsi/dekripsi API key
│   ├── config.py                # Settings dari env + SQLite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatCanvas.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ToolCallCard.tsx
│   │   │   │   ├── ArtifactCard.tsx
│   │   │   │   ├── CheckpointBanner.tsx  # FITUR UNIK
│   │   │   │   ├── SlashCommandMenu.tsx
│   │   │   │   └── MentionMenu.tsx
│   │   │   ├── sidebar/
│   │   │   │   ├── SidebarNav.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── SkillsList.tsx
│   │   │   ├── auxiliary/
│   │   │   │   ├── AuxiliaryPane.tsx
│   │   │   │   ├── TerminalPane.tsx      # xterm.js
│   │   │   │   ├── FilesChangedPane.tsx
│   │   │   │   ├── SubagentsPane.tsx
│   │   │   │   └── BackgroundTasksPane.tsx
│   │   │   ├── settings/
│   │   │   │   ├── GlobalSettings.tsx
│   │   │   │   ├── ModelAccountManager.tsx # FITUR UNIK
│   │   │   │   └── TokenUsageBar.tsx       # FITUR UNIK
│   │   │   └── ui/                         # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Settings.tsx
│   │   ├── stores/              # Zustand stores
│   │   │   ├── chatStore.ts
│   │   │   ├── projectStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── hooks/
│   │   │   ├── useSSE.ts        # Server-Sent Events streaming
│   │   │   ├── useTerminal.ts   # xterm.js WebSocket
│   │   │   └── useCheckpoint.ts # FITUR UNIK
│   │   └── lib/
│   │       ├── api.ts           # Axios client
│   │       └── utils.ts
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── agy_local.db             # SQLite database (auto-created)
├── .env                         # MASTER_KEY untuk enkripsi
├── start.bat                    # Windows launcher
└── start.sh                     # Linux/Mac launcher
```

---

## 3. Database Schema (SQLite)

```sql
-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  path        TEXT NOT NULL,          -- absolute path ke folder
  settings    TEXT NOT NULL DEFAULT '{}',  -- JSON override settings
  is_active   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_projects_active ON projects(is_active);

-- ============================================================
-- MODEL ACCOUNTS  [FITUR UNIK — multi-akun per provider]
-- ============================================================
CREATE TABLE model_accounts (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  provider            TEXT NOT NULL
    CHECK (provider IN ('gemini','claude','openai','openrouter','ollama','custom')),
  account_label       TEXT NOT NULL,          -- "Akun Gemini 1"
  api_key_encrypted   TEXT NOT NULL,          -- Fernet encrypted
  base_url            TEXT,                   -- untuk custom/ollama
  is_active           INTEGER NOT NULL DEFAULT 1,
  priority            INTEGER NOT NULL DEFAULT 0,  -- 0 = highest
  token_limit_per_day INTEGER NOT NULL DEFAULT 0,  -- 0 = unlimited
  tokens_used_today   INTEGER NOT NULL DEFAULT 0,
  last_used_at        TEXT,
  last_reset_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_model_accounts_provider ON model_accounts(provider, is_active, priority);

-- ============================================================
-- MODEL CONFIGS — daftar model yang tersedia
-- ============================================================
CREATE TABLE model_configs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  display_name    TEXT NOT NULL,          -- "Gemini 2.0 Flash"
  provider        TEXT NOT NULL,
  model_id        TEXT NOT NULL,          -- "gemini/gemini-2.0-flash"
  context_window  INTEGER NOT NULL DEFAULT 128000,
  is_enabled      INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT 'New Conversation',
  model_config_id TEXT REFERENCES model_configs(id) ON DELETE SET NULL,
  goal            TEXT,                   -- goal utama yang harus dicapai
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','error','checkpoint_available')),
  token_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_conversations_project ON conversations(project_id, updated_at);
CREATE INDEX idx_conversations_status  ON conversations(status);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id   TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL
    CHECK (role IN ('user','assistant','tool','system')),
  content           TEXT NOT NULL,        -- text atau JSON
  model_account_id  TEXT REFERENCES model_accounts(id) ON DELETE SET NULL,
  model_id          TEXT,                 -- snapshot model saat pesan dibuat
  token_count       INTEGER NOT NULL DEFAULT 0,
  sequence_index    INTEGER NOT NULL,     -- urutan pesan di conversation
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sequence_index);

-- ============================================================
-- TOOL CALLS
-- ============================================================
CREATE TABLE tool_calls (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  message_id      TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,
  arguments       TEXT NOT NULL DEFAULT '{}',   -- JSON
  result          TEXT,                          -- JSON result
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','denied','running','done','error')),
  approved_by_user INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  started_at      TEXT,
  completed_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tool_calls_message  ON tool_calls(message_id);
CREATE INDEX idx_tool_calls_status   ON tool_calls(status);

-- ============================================================
-- ARTIFACTS
-- ============================================================
CREATE TABLE artifacts (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
    CHECK (type IN ('plan','report','code','generative-ui','file-list','markdown')),
  title           TEXT NOT NULL DEFAULT 'Artifact',
  content         TEXT NOT NULL,          -- Markdown / HTML / JSON
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_artifacts_conversation ON artifacts(conversation_id);

-- ============================================================
-- CHECKPOINTS  [FITUR UNIK — resume progress]
-- ============================================================
CREATE TABLE checkpoints (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id     TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_index       INTEGER NOT NULL,         -- posisi terakhir sebelum berhenti
  goal_snapshot       TEXT NOT NULL,            -- goal saat ini
  progress_summary    TEXT NOT NULL,            -- ringkasan: apa yang sudah selesai
  context_snapshot    TEXT NOT NULL,            -- JSON: messages untuk dikirim ke model baru
  pending_tool_calls  TEXT NOT NULL DEFAULT '[]', -- JSON: tool calls yang belum selesai
  model_id_at_stop    TEXT,
  stop_reason         TEXT NOT NULL DEFAULT 'token_limit'
    CHECK (stop_reason IN ('token_limit','rate_limit','error','user_pause','model_switch')),
  is_resumed          INTEGER NOT NULL DEFAULT 0,
  resumed_at          TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_checkpoints_conversation ON checkpoints(conversation_id, is_resumed);

-- ============================================================
-- SETTINGS — key-value global config
-- ============================================================
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,              -- JSON value
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('tool_execution_policy', '"request-review"'),  -- always-proceed | request-review | strict
  ('turbo_mode', 'false'),                         -- FITUR UNIK: bypass sandbox
  ('nonworkspace_file_access', '"ask"'),           -- allow | ask | deny
  ('internet_access', '"allow"'),
  ('theme', '"dark"'),
  ('default_model_config_id', 'null'),
  ('command_allowlist', '[]'),
  ('command_denylist', '[]'),
  ('keep_awake', 'false'),
  ('context_compaction_threshold', '0.8');         -- kompres saat 80% context window penuh

-- ============================================================
-- PERMISSION RULES — allow/deny spesifik
-- ============================================================
CREATE TABLE permission_rules (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  scope       TEXT NOT NULL
    CHECK (scope IN ('global','project')),
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
    CHECK (type IN ('command','file','url')),
  pattern     TEXT NOT NULL,              -- glob pattern atau regex
  action      TEXT NOT NULL
    CHECK (action IN ('allow','deny')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SCHEDULED TASKS
-- ============================================================
CREATE TABLE scheduled_tasks (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id            TEXT REFERENCES projects(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  cron_expression       TEXT,              -- NULL jika one-shot timer
  delay_seconds         INTEGER,           -- untuk one-shot timer
  conversation_template TEXT NOT NULL DEFAULT '{}',  -- JSON: initial prompt dll
  status                TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','failed')),
  last_run_at           TEXT,
  next_run_at           TEXT,
  last_error            TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE skills (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  source      TEXT NOT NULL
    CHECK (source IN ('builtin','local')),
  folder_path TEXT,                       -- path ke folder skill
  enabled     INTEGER NOT NULL DEFAULT 1,
  config      TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SUBAGENTS
-- ============================================================
CREATE TABLE subagents (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  parent_conv_id    TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  model_config_id   TEXT REFERENCES model_configs(id),
  status            TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','done','error','killed')),
  brief             TEXT NOT NULL,
  result            TEXT,
  started_at        TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at      TEXT
);
CREATE INDEX idx_subagents_parent ON subagents(parent_conv_id, status);
```

---

## 4. API Routes

### Conversations — F01, F02, F09
```
POST   /api/conversations                    Buat conversation baru
GET    /api/conversations                    List semua (dengan project filter)
GET    /api/conversations/{id}               Detail + messages
DELETE /api/conversations/{id}              Hapus conversation
PATCH  /api/conversations/{id}              Update title, goal, model
POST   /api/conversations/{id}/messages     Kirim pesan → mulai agent loop
GET    /api/conversations/{id}/stream       SSE: streaming response agent
POST   /api/conversations/{id}/cancel       Stop agent yang sedang jalan
POST   /api/conversations/{id}/resume       FITUR UNIK: resume dari checkpoint
PATCH  /api/conversations/{id}/model        Ganti model di tengah conversation
```

### Tool Call Approvals — F05
```
GET    /api/tool-calls/pending              List tool calls yang menunggu approval
POST   /api/tool-calls/{id}/approve        Approve + jalankan
POST   /api/tool-calls/{id}/deny           Deny → agent notified
POST   /api/tool-calls/{id}/approve-always Approve + tambah ke allowlist
```

### Checkpoints — F09 (FITUR UNIK)
```
GET    /api/conversations/{id}/checkpoints  List checkpoints conversation ini
GET    /api/checkpoints/{id}               Detail checkpoint
POST   /api/checkpoints/{id}/resume        Resume dari checkpoint (dengan model baru opsional)
DELETE /api/checkpoints/{id}               Hapus checkpoint
```

### Projects — F03
```
GET    /api/projects                        List projects
POST   /api/projects                        Tambah project (nama + path folder)
GET    /api/projects/{id}                   Detail + settings
PATCH  /api/projects/{id}                   Update nama / settings
DELETE /api/projects/{id}                   Hapus
POST   /api/projects/{id}/activate         Set sebagai active project
```

### Model Accounts — FITUR UNIK
```
GET    /api/model-accounts                  List semua akun (key di-mask)
POST   /api/model-accounts                  Tambah akun baru
PATCH  /api/model-accounts/{id}             Update label/priority/limit
DELETE /api/model-accounts/{id}             Hapus akun
POST   /api/model-accounts/{id}/test        Test API key (kirim request minimal)
GET    /api/model-accounts/{id}/usage       Token usage hari ini
POST   /api/model-accounts/reset-daily      Reset tokens_used_today semua akun
```

### Model Configs
```
GET    /api/model-configs                   List model yang tersedia
POST   /api/model-configs                   Tambah custom model
PATCH  /api/model-configs/{id}              Enable/disable model
DELETE /api/model-configs/{id}              Hapus
```

### Terminal — F04
```
WS     /ws/terminal/{session_id}            WebSocket: bidirectional PTY
POST   /api/terminal/sessions               Buat sesi terminal baru
GET    /api/terminal/sessions               List sesi aktif
DELETE /api/terminal/sessions/{id}          Kill sesi terminal
```

### File Explorer — Turbo Mode
```
GET    /api/files/tree?path=...             Directory tree
GET    /api/files/read?path=...             Baca file
POST   /api/files/write                     Tulis file (body: path + content)
DELETE /api/files/delete                    Hapus file/folder
POST   /api/files/mkdir                     Buat folder
GET    /api/files/diff?path=...&conv_id=... Diff file vs state di conversation
```

### Settings — S07, S08
```
GET    /api/settings                        Semua settings
PATCH  /api/settings                        Update satu atau banyak key
GET    /api/settings/permissions            List permission rules
POST   /api/settings/permissions            Tambah rule
DELETE /api/settings/permissions/{id}       Hapus rule
```

### Skills — F08
```
GET    /api/skills                          List skills
POST   /api/skills/scan                     Scan folder untuk load skills lokal
PATCH  /api/skills/{id}/toggle              Enable/disable
```

### Subagents — F10
```
GET    /api/conversations/{id}/subagents    List subagents conversation ini
POST   /api/conversations/{id}/subagents    Spawn subagent baru
DELETE /api/subagents/{id}                  Kill subagent
GET    /api/subagents/{id}/logs             Log stream subagent
WS     /ws/subagents/{id}                   WebSocket: pesan ke/dari subagent
```

### Scheduled Tasks — F07
```
GET    /api/scheduled-tasks                 List tasks
POST   /api/scheduled-tasks                 Buat task baru
PATCH  /api/scheduled-tasks/{id}            Update / pause / resume
DELETE /api/scheduled-tasks/{id}            Hapus
POST   /api/scheduled-tasks/{id}/run-now    Jalankan sekarang (manual trigger)
```

---

## 5. Bagian Yang Paling Berisiko

| Risiko | Mitigasi |
|--------|---------|
| **Context window overflow** | Hitung token sebelum kirim; auto-compact di 80%; simpan checkpoint sebelum limit |
| **API key plaintext** | Enkripsi Fernet, master key di `.env`, jangan commit `.env` |
| **Race condition tool approval** | Lock per-conversation saat ada pending approval; queue tool calls |
| **node-pty crash** | Restart otomatis, timeout per command, kill saat conversation selesai |
| **Resume dengan model berbeda** | Context snapshot harus model-agnostic (plain text, bukan binary); test cross-model resume |
| **File access Turbo Mode** | Konfirmasi untuk operasi destructive (delete, overwrite); denylist system paths |
| **LiteLLM rate limit 429** | Fallback ke account berikutnya, exponential backoff, log akun yang kena limit |
| **SQLite concurrent write** | WAL mode + satu writer thread; FastAPI async tapi SQLite sync via thread pool |

---

## 6. Build Order

### 🟢 Milestone 0 — Vertical Slice (1-2 hari)
> Prove the stack works end-to-end. Ugly is fine.

**Screens:** S01, S02 (minimal)
**Tables:** `conversations`, `messages`, `model_accounts`, `model_configs`, `settings`
**Routes:** `POST /conversations`, `POST /conversations/{id}/messages`, `GET /conversations/{id}/stream`

- [ ] Setup FastAPI + SQLite + SQLAlchemy
- [ ] Setup React + Vite + TailwindCSS
- [ ] Satu model account (manual input API key di `.env`)
- [ ] Kirim pesan → LiteLLM → streaming SSE ke browser
- [ ] Tampilkan response streaming di chat bubble

---

### 🔵 Milestone 1 — Core Chat (3-5 hari)
**Screens:** S01, S02, S03, S14, S16, S17
**Tables:** + `tool_calls`, `artifacts`
**Routes:** + tool calls, approval, model config

- [ ] Conversation list + history
- [ ] Model selector dropdown (multi-model)
- [ ] Tool call cards + approval dialog (S17)
- [ ] Agent tools: `read_file`, `write_file`, `run_command`, `search_web`
- [ ] Artifact panel (Markdown render)
- [ ] Slash command menu

---

### 🔵 Milestone 2 — Multi-Akun + Token Rotation (2-3 hari)
**Screens:** S07 (settings), S14
**Tables:** `model_accounts` (full), `permission_rules`
**Routes:** `/api/model-accounts/*`

- [ ] UI tambah/hapus API key per provider
- [ ] Enkripsi API key dengan Fernet
- [ ] LiteLLM router: priority-based fallback antar akun
- [ ] Token usage tracking per akun + reset harian
- [ ] Token usage bar di UI
- [ ] Test key button

---

### 🔵 Milestone 3 — Resume / Checkpoint (3-5 hari) ⭐ FITUR UNIK
**Screens:** S02 (checkpoint banner), S14
**Tables:** `checkpoints`
**Routes:** `/api/checkpoints/*`, `/api/conversations/{id}/resume`

- [ ] Auto-save checkpoint sebelum context 80% penuh
- [ ] Checkpoint saat token limit / rate limit hit
- [ ] CheckpointBanner component (muncul di chat)
- [ ] Goal tracker: simpan goal + progress summary
- [ ] Context snapshot: format yang bisa dibaca model apapun
- [ ] Resume dengan model yang sama ATAU model berbeda
- [ ] Test: mulai dengan Gemini, lanjut dengan Claude

---

### 🔵 Milestone 4 — Terminal + File Explorer (3-4 hari)
**Screens:** S12, S13
**Routes:** `/ws/terminal/*`, `/api/files/*`

- [ ] xterm.js di AuxiliaryPane
- [ ] node-pty backend + WebSocket bridge
- [ ] Multi-tab terminal
- [ ] File tree sidebar + Monaco editor
- [ ] Diff viewer (Files Changed tab)
- [ ] Turbo Mode toggle di settings

---

### 🟡 Milestone 5 — Projects + Settings (2-3 hari)
**Screens:** S04, S07, S08
**Tables:** `projects`, `permission_rules` (full)

- [ ] Projects panel (tambah/switch workspace)
- [ ] Project-level settings override
- [ ] Permission rules UI (allowlist/denylist)
- [ ] `@mention` menu (files + conversations)

---

### 🟡 Milestone 6 — Subagents + Background Tasks (3-4 hari)
**Screens:** S10, S11
**Tables:** `subagents`
**Routes:** `/api/subagents/*`

- [ ] Spawn subagent (conversation terpisah, context dari parent)
- [ ] Subagents monitor panel
- [ ] Background tasks panel

---

### ⚪ Milestone 7 — Skills + Scheduled Tasks (2-3 hari)
**Screens:** S05, S06
**Tables:** `skills`, `scheduled_tasks`

- [ ] Load skills dari folder lokal
- [ ] Skills panel (list + toggle)
- [ ] Scheduled tasks (cron + one-shot)
- [ ] `@mention` rules/skills

---

### ⚪ Milestone 8 — Polish (ongoing)
- [ ] Dark/light theme
- [ ] Keyboard shortcuts
- [ ] Context compaction otomatis
- [ ] `start.bat` launcher (satu klik buka semua)
- [ ] Error boundaries + loading states
- [ ] README + dokumentasi

---

## Summary

**Stack:** React + Vite + FastAPI + LiteLLM + SQLite — semua lokal, zero config server
**Tables:** 13 tabel
**Routes:** ~50 REST endpoints + 3 WebSocket endpoints
**3 Risiko Terbesar:** (1) Context snapshot cross-model untuk resume, (2) node-pty stability di Windows, (3) LiteLLM multi-account key rotation dengan proper fallback
**Estimasi total:** 4-6 minggu build solo (Milestone 0-5 = versi yang sudah bisa dipakai)

**Step berikutnya:** `replica-build` — build Milestone 0 (vertical slice)
