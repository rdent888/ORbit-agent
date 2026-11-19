# Project Context & AI Handoff

Dokumen ini adalah "memori eksternal" resmi untuk **Orbit Agent**. Sesi AI mana pun yang melanjutkan project ini wajib membaca dan mematuhi seluruh konteks, arsitektur, dan konvensi di bawah ini.

> **Catatan verifikasi:** Dokumen ini ditulis ulang dari cuplikan isi folder `backenda` yang saya baca langsung (`backend/main.py`, `models/all_models.py`, `services/*.py`, `tools/*.py`, `frontend/package.json`). Beberapa catatan di dokumen lama (seperti `backend/routers/*.py`, daftar file `services/`) sudah tidak akurat — setiap hal yang berbeda dari kenyataan saya tandai sebagai **KUFRI** (perlu verifikasi).

---

## 1. Ringkasan Project (Overview)

- **Nama Project:** Orbit Agent (Autonomous Coding IDE) / *AGY Local* / *Replica Clone Antigravity*
- **Repository:** https://github.com/rdent888/ORbit-agent (root `E:\.VSCODE\ORbit-Agent (byRd)`)
- **Lisensi:** Apache License 2.0 — © 2026 rdent888
- **Tujuan & Fungsi Utama:**
  Orbit Agent adalah *Integrated Development Environment* otonom berbasis AI yang dirancang untuk berjalan **100% lokal** di mesin PC, dengan fleksibilitas model AI tanpa batas (Cloud AI + Local AI Engine). Memecahkan masalah biaya token cloud yang mahal dan risiko kebocoran data pribadi, dengan menggabungkan:

  1. **Multi-Model Routing & Cloud Pooling** — Mendukung Google Gemini, Claude, GPT-4o, DeepSeek, Qwen, OpenRouter, Ollama, *custom OpenAI-compatible* proxy (BansosAI), dan Hermes Local Engine.
  2. **Local Engine (Nous Hermes Autonomous Agent)** — Eksekusi kode otonom, CLI loop, dan code review langsung di mesin pengguna dengan biaya token cloud **Rp 0 / Zero Cost**.
  3. **Persistent Memory & Context Compression** — Riwayat percakapan dan target proyek tidak hilang saat berpindah model di tengah sesi; memori dikompresi agar hemat token API.
  4. **Integrated Workspace** — Chat Canvas + Monaco Code Viewer + Terminal simulator (xterm.js/WebSocket) + File Explorer + Task Checkpoint/Resume + Skills & Plugins ecosystem.
  5. **Auto-Fallback & Smart Router** — Otomatis beralih/berputar ke Hermes lokal bila seluruh akun cloud habis atau terkena rate limit (`429`).

- **Status Project Saat Ini:** **MVP Fungsional & Aktif Digunakan** — sistem memory compression, perbaikan formatting output Hermes, enforcement policy tool execution, dan audio completion notification sudah berjalan.

---

## 2. Tech Stack & Lingkungan Pengembangan

- **Sistem Operasi Host:** Windows 10 Pro (x64)
- **Runtime & Environment:**
  - Backend: **Python 3.12** (didalam `backend/venv`), FastAPI (`main:app`), Uvicorn (port `8000`, reload)
  - Frontend: **Node.js + npm**, React 19.3.1, TypeScript `~7.0.2`, Vite `^8.3.6`
  - Database: **SQLite** (`data/agy_local.db`, WAL mode) — via SQLAlchemy ORM
  - AI Router: LiteLLM (multi-provider abstraction)
- **Database & ORM/Driver:**
  - **Database:** SQLite file `data/agy_local.db` dengan `PRAGMA journal_mode=WAL`, `foreign_keys=ON`.
  - **ORM:** SQLAlchemy 2.x `DeclarativeBase` (14 model class). Koneksi via `database.get_db()` dependency.
- **Library & API Eksternal (dependency aktif):**
  - *Backend:* `fastapi`, `uvicorn`, `sqlalchemy`, `litellm`, `cryptography` (Fernet), `python-dotenv`, `websockets`, `aiofiles`, `tiktoken`, `httpx`, `pydantic`.
  - *Frontend:* `@monaco-editor/react`, `@radix-ui/*` (dialog/dropdown-menu/scroll-area/separator/tooltip), `@tanstack/react-query`, `@xterm/xterm` + `addon-fit` + `addon-web-links`, `axios`, `eventsource-parser`, `react-markdown`, `remark-gfm`, `zustand`, `tailwindcss`, `postcss`, `autoprefixer`, `oxlint`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.
  - *Runtime lokal:* `C:\Users\rdent\AppData\Local\hermes\bin\hermes.exe` (Nous Hermes Agent CLI).
- **Cara Menjalankan Project:**
  - **Satu-klik (rekomendasi Windows):** eksekusi `start.bat` — menyalakan backend (`uvicorn main:app --port 8000`) + frontend (`npm run dev`, port `5173`) + membuka browser.
  - **Install otomatis:** eksekusi `install.bat` — cek Python & Node, buat `backend/venv`, install `backend/requirements.txt`, `npm install` di `frontend`, siapkan `.env` dari `.env.example`.
  - **Manual Backend:** `cd backend && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
  - **Manual Frontend:** `cd frontend && npm run dev` (port `5173`)

---

## 3. Struktur Direktori & File Kunci

```text
ORbit-agent/                       # root: E:\.VSCODE\ORbit-Agent (byRd)
├── backend/                       # FastAPI app (folder kerja saat ini)
│   ├── main.py                    # Entry point FastAPI — SEMUA route inline (982 baris)
│   ├── database.py                # engine SQLite + SessionLocal + Base
│   ├── crypto.py                  # Fernet encrypt/decrypt untuk API keys
│   ├── requirements.txt
│   ├── models/                    # SQLAlchemy ORM models (14 tabel)
│   │   └── all_models.py
│   ├── services/                  # Business logic (5 file)
│   │   ├── agent.py               # Core agent loop
│   │   ├── litellm_router.py      # Multi-account + fallback + local Hermes
│   │   ├── memory_compressor.py
│   │   ├── skill_manager.py
│   │   └── task_analyzer.py
│   ├── tools/                     # 19 modul tools bawaan
│   ├── skills/                    # 13 persona skill folder (SKILL.md per folder)
│   ├── routers/                   # 🚫 KURANG: folder kosong (tidak ada .py)
│   └── venv/
├── frontend/                      # React 19 + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── lib/api.ts
│   │   ├── stores/chatStore.ts
│   │   └── components/
│   │       ├── chat/ (ChatCanvas, ChatInput, MessageBubble, ToolCallCard, ...)
│   │       ├── auxiliary/ (AuxiliaryPane, TerminalPane)
│   │       ├── editor/EditorPane
│   │       ├── projects/ProjectModal
│   │       ├── settings/ModelAccountManager
│   │       ├── sidebar/Sidebar
│   │       ├── skills/SkillsModal
│   │       └── common/ResizeDivider
│   ├── package.json
│   └── vite.config.ts
├── data/                          # SQLite DB (diabaikan .gitignore)
├── replica/                       # Dokumen recon/arsitektur (non-code)
│   ├── schema.sql, features.csv, architecture.md, recon.md
│   └── screens/                   # (folder kosong)
├── install.bat                    # Setup otomatis
├── start.bat                      # Launcher frontend+backend
├── .env.example / .gitignore / README.md / LICENSE
└── CONTEXT.md                     # Dokumen ini (memori eksternal handoff)
```

**File kunci yang harus AI kenal lokasinya:**
- `backend/main.py:1` — entry, lifespans, seed defaults, **dan semua route** (tidak ada package `routers/` yang berisi route).
- `backend/models/all_models.py:10-175` — definisi schema (lihat bagian 4).
- `backend/services/agent.py` — loop agent, checkpoint, eksekusi tool.
- `backend/services/litellm_router.py` — router, fallback, Hermes direct provider.
- `backend/services/memory_compressor.py` — compressor memory.
- `backend/tools/*.py` — implementation 19 tools (lihat bagian Status Fitur).
- `frontend/src/lib/api.ts` — axios client ke `API_BASE_URL = http://localhost:8000`.

---

## 4. Arsitektur & Skema Database

### Alur Data / Request

1. **User Input:** Pengguna mengetik prompt/menggunakan slash command di `ChatInput.tsx` (frontend).
2. **REST / SSE:** Frontend mem-POST ke `/api/conversations/{id}/messages` dan membuka EventSource ke `/api/conversations/{id}/stream`.
3. **Agent Loop (`backend/services/agent.py`):**
   - Ambil histori dari DB lewat `get_messages_with_memory()` (memory_compressor): ringkasan `conversation.memory_summary` + 6 pesan terkini.
   - Resolve model: `resolve_model_for_task()` (litellm_router) — auto router atau manual.
   - Stream token via SSE queue (`type: token`).
   - Balasan model berisi blok ```tool_call``` → `_extract_tool_calls()` mem-parsenya.
   - Validasi kebijakan: `tool_execution_policy == "request-review"` + turbo off → `on_tool_call()` (user approve/deny). Tool dieksekusi lewat `TOOLS` registry (`backend/tools/`).
   - Result feed-back ke loop sebagai pesan `role: tool`.
   - Saat tidak ada tool_call → `conv.status = "completed"`, `compress_memory()` (zero-cost).
   - Auto-checkpoint: `_context_pct(messages, context_window) >= checkpoint_threshold` (bawaan `0.75`) → `_save_checkpoint()`.
4. **Sistem Memory Compression:** Setiap 6 pasang turn terbaru, `compress_memory()` (rule-based, zero LLM) mereferensikan goal, findings, file, status ke `conversation.memory_summary`.
5. **Local Hermes Engine:** Ketika model `provider="hermes"` di input, `litellm_router._stream_hermes()` menjalankan `hermes.exe chat --query-file <tmp> -Q` (quiet mode, ANSI sanitized) dan stream hasilnya.
6. **Audio Chime:** Frontend `playCompletionChime()` (Web Audio API) dipicu saat stream selesai — terdengar lintas tab.

### Skema Database / Model (14 tabel)

> Sumber: `backend/models/all_models.py` (SQLAlchemy ORM + `replica/schema.sql`).

| Tabel | Kolom utama | Relasi |
|---|---|---|
| `projects` | `id, name, path, settings, is_active, created_at, updated_at` | `conversations.project_id → projects.id` |
| `model_accounts` | `id, provider, account_label, api_key_encrypted, base_url, is_active, priority, token_limit_per_day, tokens_used_today, last_used_at, last_reset_at, created_at` | auth per provider |
| `model_configs` | `id, display_name, provider, model_id, context_window, is_enabled, sort_order, created_at` | `conversations.model_config_id`, `messages.model_account_id` |
| `conversations` | `id, project_id, title, model_config_id, goal, memory_summary, memory_turn_count, status, token_count, is_pinned, created_at, updated_at` | 1:n `messages`, `checkpoints`, `artifacts`, `subagents` |
| `messages` | `id, conversation_id, role(user\|assistant\|tool\|system), content, model_account_id, model_id, token_count, sequence_index, created_at` | 1:1 `tool_calls` |
| `tool_calls` | `id, message_id, tool_name, arguments, result, status(pending\|approved\|denied\|running\|done\|error), approved_by_user, error_message, started_at, completed_at, created_at` | 1:1 `messages` |
| `artifacts` | `id, conversation_id, type(plan\|report\|code\|generative-ui\|file-list\|markdown), title, content, version, created_at, updated_at` | 1:n `conversations` |
| `checkpoints` | `id, conversation_id, message_index, goal_snapshot, progress_summary, context_snapshot, pending_tool_calls, model_id_at_stop, stop_reason(token_limit\|rate_limit\|error\|user_pause\|model_switch), is_resumed, resumed_at, created_at` | 1:n `conversations` |
| `settings` | `key, value, updated_at` | key-value global |
| `permission_rules` | `id, scope(global\|project), project_id, type(command\|file\|url), pattern, action(allow\|deny), created_at` | aturan allow/deny |
| `scheduled_tasks` | `id, project_id, name, cron_expression, delay_seconds, conversation_template, status(active\|paused\|failed), last_run_at, next_run_at, last_error, created_at` | cron background |
| `skills` | `id, name, source(builtin\|local), folder_path, enabled, config, created_at` | katalog persona |
| `subagents` | `id, parent_conv_id, name, model_config_id, status(running\|done\|error\|killed), brief, result, started_at, completed_at, created_at` | 1:n `conversations` |

### Endpoint API / Route Penting

> Semua route didefinisikan **inline dalam `backend/main.py`** (folder `routers/` memang kosong). Method & fungsinya:

**Konversations / Chat**
- `GET /api/conversations` — daftar konversasi
- `POST /api/conversations` — buat konversasi baru
- `GET /api/conversations/{conv_id}` — detail 1 konversasi
- `PATCH /api/conversations/{conv_id}` — update (misal: title/status)
- `DELETE /api/conversations/{conv_id}` — hapus konversasi
- `POST /api/conversations/{conv_id}/messages` — kirim pesan baru (parsing `/goal`)
- `GET /api/conversations/{conv_id}/stream` — SSE streaming token + approve
- `POST /api/conversations/{conv_id}/cancel` — batalkan stream
- `POST /api/conversations/{conv_id}/resume` — lanjut dari checkpoint

**Workspace / Files**
- `GET /api/workspace` — tree workspace
- `POST /api/workspace/open` — buka/fokus folder
- `POST /api/workspace/create-folder`
- `POST /api/workspace/create-file`
- `GET /api/workspace/file` — baca konten file
- `POST /api/workspace/file` — tulis file
- `GET /api/workspace/download` — unduh file

**Tool Call Approval**
- `POST /api/tool-calls/{tc_id}/approve`
- `POST /api/tool-calls/{tc_id}/deny`
- `DELETE /api/messages/{message_id}`

**Model Accounts / Configs**
- `GET /api/model-accounts` / `POST /api/model-accounts` / `DELETE /api/model-accounts/{id}` / `POST /api/model-accounts/{id}/test`
- `GET /api/model-configs` / `POST /api/model-configs` / `DELETE /api/model-configs/{id}`
- `POST /api/model-accounts/fetch-models` — auto-import model dari provider

**Settings / Project**
- `GET /api/settings` / `PATCH /api/settings`
- `GET /api/projects` / `POST /api/projects` / `POST /api/projects/{id}/activate` / `POST /api/projects/deactivate` / `PATCH /api/projects/{id}` / `DELETE /api/projects/{id}`

**Skills**
- `GET /api/skills` / `POST /api/skills/install` / `POST /api/skills/import-local` / `POST /api/skills/create`
- `PATCH /api/skills/{id}/toggle` / `DELETE /api/skills/{id}`

---

## 5. Status Fitur

### Sudah Selesai & Berjalan (Completed)
- [x] IDE split layout integral: Chat Canvas + Monaco Editor + Terminal (xterm.js) + File Tree.
- [x] Router multi-provider via LiteLLM (Gemini, Claude, OpenAI, OpenRouter, Ollama, BansosAI/custom).
- [x] Integrasi **Local Autonomous Agent** via Nous Hermes CLI (`hermes.exe`).
- [x] Perbaikan formatting output Hermes: flag `-Q` + sanitasi ANSI → newline `\n\n`, markdown heading, bullet rapi setara Gemini/Claude.
- [x] *Persistent Conversation Memory* antar model (histori sesi yang sama dapat dibaca setiap model).
- [x] *Memory Compression System* (`backend/services/memory_compressor.py`, zero-cost rule-based, `COMPRESS_EVERY_N_TURNS=6`).
- [x] *Audio completion chime* (Web Audio API, terdengar lintas tab).
- [x] Parsing otomatis perintah `/goal` → `conversation.goal`.
- [x] Enforcment: system prompt memaksa model frontier menulis ```tool_call alih-alih menolak.
- [x] Auto-Checkpoint & Resume: snapshot setiap `checkpoint_threshold` (0.75) konteks; lanjut dengan model berbeda via `/resume`.

### Sedang Dikerjakan / Belum Selesai (In Progress & TODO)
- [ ] Penggabungan output *Native Function Calling API* dengan *Text-based tool calling* agar kompatibel 100% dengan model yang butuh skema JSON tools resmi.
- [ ] *Terminal interactivity dua arah* (PTY WebSocket nyata untuk CLI interaktif seperti `npm init`, `git commit`).
- [ ] *Git visual staging panel* di sidebar untuk melihat diff per file interaktif.

### Diketahui Masih Bug / Catatan Teknis (Known Issues)
- **Zombie Process Windows:** Saat restart backend, child Python/uvicorn kadang tertangguh di background memegang port 8000. Saran kerja: hentikan seluruh python (`Stop-Process -Name python -Force` / `taskkill`) sebelum restart.
- **KUFI path junction:** Dokumen lama menyebut `E:\.VSCODE\project clone antigravity` adalah symlink/junction ke `E:\.VSCODE\ORbit-Agent (byRd)`. Ini **perlu diverifikasi ulang** — workspace root yang saya amati adalah `E:\.VSCODE\ORbit-Agent (byRd)` (file `README.md`, `.git`, `install.bat`, `start.bat` ada di root). Jangan anggap junction sebagai fakta yang sudah pasti.
- **KUFI `backend/routers/`:** Dokumen lama menyatakan `routers/*.py` berisi route, padahal folder `routers/` **kosong**; semua route ada di `main.py`.
- **KUFI `replica/architecture.md` / `recon.md`:** Dokumen rencana dini (contoh: `services/checkpoint_service.py`, `terminal_service.py`, `file_service.py`, `permission_service.py`, folder `frontend/src/hooks`, `frontend/src/utils`) sudah **tidak sesuai** dengan kode aktual. Hanya gunakan sebagai sejarah, bukan referensi kode.
- **Placeholder umum:** `replica/schema.sql` dan `replica/features.csv` adalah rencana asli (*Clone Antigravity*), masih mencantumkan fitur `BansosAI`, `Custom OpenAI Proxy` yang **belum ada** di file layar `features.csv` (di luar `backend/` — jadi tidak ada di repo). Artinya: fitur ini ada di kode/UI, tapi dokumentasi terpisah masih mencampurkan rencana vs implementasi.

---

## 6. Aturan & Konvensi Kode untuk AI (Strict Rules)

### Gaya Penulisan & Pola Desain
- **Backend:** Python 3.12, `async`/`await` untuk I/O + route FastAPI, SQLAlchemy ORM dengan sesi `db.commit()` yang rapi, modularasi service di `backend/services/`.
- **Frontend:** TypeScript murni, React functional component + hooks, Zustand (`frontend/src/stores/chatStore.ts`) sebagai single source of truth untuk chat + workspace.
- **Styling:** Dark "Obsidian" theme, Tailwind CSS, `prose prose-invert` untuk rendering Markdown.
- **AI Tool format:** Agent menulis blok ```tool_call ``` (bukan `function_call` native) — sistem menangkap via regex ```_extract_tool_calls```.
- **Tool policy:** `tool_execution_policy` (bawaan `"request-review"`) — jika request-review + turbo off, setiap tool meminta approval dari user lewat `on_tool_call()`.

### Konvensi Task Router (`backend/services/task_analyzer.py`)
- `analyze_task_complexity(prompt, message_count)` → `("heavy", ...)` atau `("light", ...)`.
- **Heavy keywords:** clone, build, architect, database, schema, migration, refactor, optimize, concurrency, stack trace, exception, memory leak, segfault, deadlock, analyze, review, compare, algorithm, security, vulnerability, e2e, test suite, deep dive, system design, performance, benchmark.
- **Light keywords:** hi/halo/hello/ping/tes/test, apa itu, jelaskan, explain, format, translate, terjemahkan, typo, rename, syntax, contoh, example.
- Penggunaan: model dipilih otomatis berdasarkan kompleksitas (heavy → pro/sonnet/GPT-4o/deepseek-R1; light → flash lite).

### Batasan Penting
- **Jangan ubah skema database atau file konfigurasi inti** tanpa konfirmasi eksplisit dari pengguna. Skema di `backend/models/all_models.py` + `replica/schema.sql` harus konsisten.
- **Pertahankan konsistensi tech stack & styling** yang sudah ada (Python 3.12 + FastAPI + SQLite + React 19 + Vite 8 + Tailwind).
- **Implementasi utuh:** saat memodifikasi kode, berikan implementasi yang lengkap siap pakai. **Jangan memotong kode** dengan placeholder seperti `// ... existing code ...` atau `# ... kode lainnya ...`.
- **Tidak ada `routers/` package** — semua route ada di `backend/main.py`. Jangan ciptakan folder `routers/` dengan asumsi route ada di situ.
- **Hindari inventarisasi yang tidak akurat:** dokumen `replica/architecture.md`, `replica/recon.md`, `features.csv` bersifat *history planning* dan sudah ketinggalan; gunakan `backend/` + `frontend/` sebagai sumber kebenaran.
- **Secrets:** jangan hardcode API key/credential di file `.py`/`.ts`/commit. Kunci disimpan terenkripsi lewat `crypto.py` (Fernet) di tabel `model_accounts`, master key di `.env` (`AGY_MASTER_KEY`).
- **Tool access control:** `nonworkspace_file_access` setting (`"allow"` default, `"ask"`, `"deny"`) + Turbo Mode mengatur akses file di luar workspace.
- **Context budget:** `_context_pct()` perkiraan token (1 token ≈ 4 chars); auto-checkpoint di `checkpoint_threshold` (0.75). Jangan ubah logika ini tanpa alasan kuat.

---

*Generated from direct inspection of `E:\.VSCODE\ORbit-Agent (byRd)` (backend + frontend + data + replica) via read_file / terminal. Last verified: build indexes, route decorators, ORM model columns, tool registry, skills catalog, package.json versions.*
