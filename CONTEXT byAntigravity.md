# Project Context & AI Handoff

Dokumen ini adalah "memori eksternal" resmi untuk **Orbit Agent**. Sesi AI mana pun yang melanjutkan project ini wajib membaca dan mematuhi seluruh konteks, arsitektur, dan konvensi di bawah ini.

---

## 1. Ringkasan Project (Overview)
- **Nama Project:** Orbit Agent (Local-First Autonomous Coding IDE)
- **Repository:** [rdent888/ORbit-agent](https://github.com/rdent888/ORbit-agent)
- **Lisensi:** Apache License 2.0
- **Tujuan & Fungsi Utama:** 
  Orbit Agent adalah Integrated Development Environment (IDE) otonom berbasis AI lokal pertama (*local-first*). Memecahkan masalah ketergantungan token cloud mahal dan hilangnya privasi data dengan menggabungkan:
  1. **Multi-Model Routing & Cloud Pooling:** Mendukung Google Gemini, Claude (via BansosAI), GPT-4o, DeepSeek, Qwen, dan custom OpenAI-compatible proxies.
  2. **Local Engine (Hermes Autonomous Agent):** Eksekusi kode otonom, CLI loop, dan code review langsung di mesin pengguna dengan biaya token cloud Rp 0 (Zero Cost).
  3. **Persistent Memory & State Compression:** Percakapan dan riwayat pengerjaan proyek tidak hilang saat berganti model AI di tengah percakapan, sekaligus mengompresi memori agar hemat token API.
  4. **Integrated Workspace:** Dilengkapi Code Viewer (Monaco Editor), Terminal simulator/XTerm, File Explorer, Task Checkpoint/Resume, serta Skills & Plugins ecosystem.
- **Status Project Saat Ini:** **MVP Fungsional & Aktif Digunakan** (telah terpasang sistem memory compression, perbaikan formatting respons lokal Hermes, tool execution enforcement, dan audio completion notification).

---

## 2. Tech Stack & Lingkungan Pengembangan
- **Sistem Operasi Host:** Windows 10 Pro (x64)
- **Backend:**
  - **Runtime & Framework:** Python 3.12, FastAPI, Uvicorn (port `8000`)
  - **ORM & Database:** SQLAlchemy dengan SQLite (`data/agy_local.db`)
  - **Model Orchestration:** LiteLLM (multi-provider abstraction)
  - **Security / Encryption:** Cryptography (Fernet) untuk enkripsi API keys lokal
  - **Lokal AI Runtime:** Hermes Agent CLI (`C:\Users\rdent\AppData\Local\hermes\bin\hermes.exe`)
- **Frontend:**
  - **Runtime & Bundler:** React 19, TypeScript (~7.0), Vite 8 (port `5173`)
  - **Styling:** Tailwind CSS 3.4, `@tailwindcss/typography` (prose styling)
  - **State Management:** Zustand 5
  - **Editor & UI Components:** Monaco Editor (`@monaco-editor/react`), Radix UI primitives, Lucide React icons
  - **Terminal & Markdown:** Xterm.js 6, React Markdown 10, Remark GFM 4
- **Perintah Menjalankan Project:**
  - **Install Dependencies:** `.\install.bat`
  - **Menjalankan Seluruh App (One-Click):** `.\start.bat`
  - **Manual Backend:**
    ```powershell
    cd backend
    .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
    ```
  - **Manual Frontend:**
    ```powershell
    cd frontend
    npm run dev
    ```
  - **Build Frontend Verification:**
    ```powershell
    cd frontend
    npm run build
    ```

---

## 3. Struktur Direktori & File Kunci
```text
ORbit-agent/
├── backend/
│   ├── main.py                     # Entry point FastAPI, routes API, SSE stream endpoint (/stream), slash commands
│   ├── database.py                 # Inisialisasi engine SQLite & SessionLocal (agy_local.db)
│   ├── crypto.py                   # Enkripsi/dekripsi simetris Fernet untuk kunci API pengguna
│   ├── requirements.txt            # Dependensi Python backend
│   ├── models/
│   │   └── all_models.py           # Definisi schema SQLAlchemy (Conversation, Message, ModelConfig, Checkpoint, dll.)
│   ├── services/
│   │   ├── agent.py                # Core agentic loop: eksekusi tool, evaluasi checkpoint, tool calls extraction
│   │   ├── litellm_router.py       # Multi-account pooling, LiteLLM gateway, streaming Hermes local runtime (-Q)
│   │   ├── memory_compressor.py    # Zero-cost rule-based memory compressor & sliding window context injector
│   │   ├── skill_manager.py        # Pengelola katalog persona dan custom skills
│   │   └── task_analyzer.py        # Smart complexity analyzer (Auto-Router: tugas berat vs ringan)
│   └── tools/                      # Modul eksekusi 19 alat bawaan (read_file, write_file, run_command, invoke_hermes, dll.)
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Root layout IDE (Sidebar, ChatCanvas, EditorPane, TerminalPane)
│   │   ├── stores/chatStore.ts     # State management Zustand: koneksi SSE, switch model, Web Audio notification chime
│   │   ├── lib/api.ts              # Axios HTTP client & TypeScript interfaces
│   │   └── components/
│   │       ├── chat/               # MessageBubble, ChatInput, ModelSelector, ThinkingIndicator, ToolCallCard
│   │       ├── editor/             # EditorPane (Monaco code viewer/editor)
│   │       ├── auxiliary/          # TerminalPane & auxiliary panels
│   │       ├── sidebar/            # File tree explorer & tasks management
│   │       └── settings/           # ModelAccountManager & API key management
│   ├── package.json                # Dependensi React & Vite
│   └── vite.config.ts              # Konfigurasi build Vite
├── data/
│   └── agy_local.db                # Database SQLite persisten lokal (diabaikan oleh git)
├── .env.example                    # Template environment variables
├── install.bat                     # Script instalasi otomatis venv & npm
├── start.bat                       # Script launcher backend & frontend simultan
└── CONTEXT.md                      # Dokumen ini (memori eksternal handoff)
```

---

## 4. Arsitektur & Skema Database

### Alur Komunikasi (Data / Request Flow):
1. **User Input:** Pengguna mengirim prompt melalui `ChatInput.tsx`.
2. **REST Request:** Frontend mem-POST pesan ke `/api/conversations/{id}/messages`.
3. **SSE Connection:** Frontend membuka EventSource ke `/api/conversations/{id}/stream`.
4. **Agent Loop (`services/agent.py`):**
   - Mengambil histori dari DB via `services/memory_compressor.py` (menyuntikkan ringkasan memori terkompresi + 6 pesan terkini).
   - Memilih model (Auto Router atau manual) dan memanggil `services/litellm_router.py`.
   - Streaming token via SSE queue (`type: token`).
   - Jika model menghasilkan blok ````tool_call````, backend memvalidasi kebijakan (auto/request review), mengeksekusi modul di `backend/tools/`, dan mengirim status eksekusi kembali ke context loop.
5. **Completion & Audio Chime:** Saat stream selesai (`type: done`), frontend memperbarui UI dan memicu synthesizer Web Audio API (`playCompletionChime`) agar berbunyi notifikasi bahkan jika pengguna berada di tab browser lain.
6. **Memory Compression Trigger:** Setiap 6 turn pesan baru terakumulasi, `memory_compressor.py` otomatis merangkum goal, temuan, file yang disentuh, dan status terakhir ke kolom `conversation.memory_summary` tanpa biaya LLM (zero cost).

### Skema Database Utama (`backend/models/all_models.py`):
- `conversations`: `id`, `project_id`, `title`, `model_config_id`, `goal`, `memory_summary`, `memory_turn_count`, `status`, `token_count`
- `messages`: `id`, `conversation_id`, `role` (user/assistant/tool/system), `content`, `model_id`, `sequence_index`, `created_at`
- `tool_calls`: `id`, `message_id`, `tool_name`, `arguments`, `result`, `status`, `approved_by_user`, `error_message`
- `checkpoints`: `id`, `conversation_id`, `message_index`, `goal_snapshot`, `progress_summary`, `context_snapshot`, `stop_reason`
- `model_accounts`: `id`, `provider`, `account_label`, `api_key_encrypted`, `base_url`, `is_active`, `token_limit_per_day`, `tokens_used_today`
- `model_configs`: `id`, `display_name`, `provider`, `model_id`, `context_window`, `is_enabled`, `sort_order`
- `projects`: `id`, `name`, `path`, `settings`, `is_active`

### Endpoint API Kunci:
- `POST /api/conversations/{id}/messages` : Kirim pesan baru (mendukung parsing otomatis command `/goal`)
- `GET /api/conversations/{id}/stream` : Server-Sent Events (SSE) streaming token & approval
- `POST /api/tool-calls/{id}/approve` & `deny` : Konfirmasi eksekusi tool berisiko oleh user
- `POST /api/conversations/{id}/resume` : Melanjutkan sesi dari checkpoint akibat rate limit / token limit
- `GET /api/workspace` & `POST /api/workspace/open` : Navigasi & manajemen file folder aktif
- `GET` & `POST /api/model-accounts` : Manajemen akun model terenkripsi

---

## 5. Status Fitur

### Sudah Selesai & Berjalan (Completed)
- [x] Full IDE split layout (Chat Canvas, Monaco Code Editor, Terminal, File Tree).
- [x] Multi-provider router via LiteLLM (Gemini, BansosAI, Claude, OpenAI proxy).
- [x] Local Autonomous Agent integration via Nous Hermes CLI (`hermes.exe`).
- [x] Perbaikan formatting output Hermes (memakai flag `-Q` dan sanitasi ANSI untuk menjaga newline `\n\n`, markdown heading, dan bullet points rapi setara Gemini/Claude).
- [x] Persistent Conversation Memory antar model (model cloud & lokal membaca histori obrolan yang sama).
- [x] Memory Compression System (`backend/services/memory_compressor.py`) untuk mencegah boros token di percakapan panjang.
- [x] Native audio completion chime menggunakan Web Audio API (berbunyi saat balasan selesai, terdengar lintas tab browser).
- [x] Parsing otomatis perintah `/goal <tujuan>` di chat input langsung ke database `conversation.goal`.
- [x] Penegasan System Prompt agar model frontier (seperti Claude Sonnet) aktif mengeksekusi format ```tool_call alih-alih menolak.
- [x] Auto-Checkpointing dan Resume System saat kuota model limit atau token penuh.

### Sedang Dikerjakan / Belum Selesai (In Progress & TODO)
- [ ] Penggabungan output Native Function Calling API dengan Text-based tool calling agar kompatibel 100% dengan model yang menuntut skema JSON tools resmi.
- [ ] Terminal interactivity dua arah (PTY WebSocket nyata untuk interaksi CLI seperti `npm init` atau `git commit` interaktif).
- [ ] Git visual staging panel di sidebar untuk melihat status diff per file secara interaktif.

### Diketahui Masih Bug / Catatan Teknis (Known Issues)
- **Zombie Process pada Windows:** Saat restart backend di Windows, proses child Python/uvicorn kadang tertahan di background (`PID` lama memegang port 8000). Jika backend tidak merespons perubahan, hentikan seluruh proses Python dengan `Stop-Process -Name python -Force` sebelum menyalakan kembali.
- **Git Junction Path:** Di mesin lokal pengguna, folder workspace `E:\.VSCODE\project clone antigravity` merupakan symlink/junction ke `E:\.VSCODE\ORbit-Agent (byRd)`. Keduanya menunjuk ke codebase yang identik.

---

## 6. Aturan & Konvensi Kode untuk AI (Strict Rules)

1. **Aturan Git & Push:**
   - **DILARANG KERAS** melakukan `git commit` atau `git push` tanpa izin atau instruksi eksplisit dari pengguna.
2. **Gaya Penulisan & Komponen:**
   - **Backend:** Python 3.12, async/await untuk I/O dan route FastAPI, SQLAlchemy ORM dengan penanganan sesi `db.commit()` yang rapi, modularitas service terpisah di `backend/services/`.
   - **Frontend:** TypeScript murni, functional React components dengan hooks, Zustand store sebagai single source of truth untuk chat dan workspace state.
   - **Styling:** Obsidian dark theme konsisten menggunakan Tailwind CSS. Gunakan typography classes (`prose prose-invert`) untuk rendering Markdown.
3. **Integritas Kode (No Placeholders):**
   - Saat mengubah kode, selalu berikan implementasi yang utuh dan drop-in replacement siap pakai. **Dilarang memotong kode** dengan komentar malas seperti `// ... existing code ...` atau `# ... kode lainnya`.
4. **Keamanan & Secrets:**
   - Jangan pernah melakukan hardcode untuk API Keys atau kredensial di file `.py`, `.ts`, atau commit git. Kunci API wajib disimpan melalui `crypto.py` ke tabel `model_accounts` atau di `.env` lokal.