# Architecture — Antigravity IDE Clone
> `replica-architect` · 2026-11-16 | Reads: recon.md · features.csv

---

## Stack (satu baris per pilihan + alasan)

> [!NOTE]
> Antigravity IDE asli adalah **VS Code fork** di atas Electron. Stack di bawah mengikuti pola yang sama — fork `microsoft/vscode` open source, bukan build Electron dari nol — sehingga Monaco, xterm, file tree, diff viewer, dan extension system sudah built-in secara gratis.

| Layer | Pilihan | Sama dengan AGY asli? | Alasan |
|---|---|---|---|
| **Desktop base** | **VS Code fork** (`microsoft/vscode` open source) | ✅ Ya | Editor, terminal, file tree, diff viewer, extension host — semua sudah ada |
| **Extension marketplace** | **Open VSX** (`open-vsx.org`) | ✅ Ya | Microsoft marketplace dilarang untuk fork; Open VSX vendor-neutral |
| **Runtime** | **Electron** (sudah di dalam VS Code) | ✅ Ya | Chromium + Node.js; tidak perlu setup manual |
| **UI framework** | **React 19 + TypeScript** (untuk webview sidebar) | ✅ Ya (pola VS Code webview) | Agent panel = webview SPA; TypeScript wajib |
| **Styling sidebar** | **Tailwind CSS 4** | ➕ Lebih baik dari AGY | CSS variable-based theming yang inherit warna VS Code theme |
| **State management** | **Zustand** | ➕ Lebih baik | Ringan, cocok untuk streaming agent state; Jotai untuk atom per-komponen kecil |
| **Local DB — relational** | **SQLite via `better-sqlite3`** | ✅ Ya (pola sama) | Sessions, messages, artifacts, checkpoints; WAL mode; query SQL penuh |
| **Local DB — KV cache** | **LevelDB** (sudah di dalam VS Code core) | ✅ Ya (VS Code pakai ini) | File index cache, quick state, session metadata ringan |
| **AI SDK** | **Vercel AI SDK 4** (`ai`) + provider adapters | ✅ Ya (AGY CLI pakai ini) | Multi-provider streaming tool calls; `@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/openai` |
| **AGY SDK** | **`antigravity-sdk`** (official) | ✅ Ya | Untuk integrasi resmi AGY harness jika tersedia |
| **MCP client** | **`@modelcontextprotocol/sdk`** | ✅ Ya | Standard protokol; stdio + SSE transport |
| **Key storage** | **`keytar`** (OS Keychain / Windows Credential Store) | ✅ Ya | API key **tidak pernah** disimpan plaintext |
| **Context compaction** | **Custom engine** (`src/engine/compactor.ts`) | ✅ Ya (AGY punya ini) | Summarize via model; simpan `compact_summary` di sessions |
| **Terminal** | **`xterm.js` + `node-pty`** (sudah di VS Code) | ✅ Ya | Turbo mode = `node-pty` tanpa sandbox |
| **IPC** | **VS Code `postMessage` webview ↔ extension host** | ✅ Ya | Renderer ↔ main via VS Code API, bukan raw Electron IPC |
| **CLI** | **`commander` + `ink`** | ✅ Ya (pola `agy` CLI) | Flag `--continue`, `--conversation <id>`, `--model` |
| **Build** | **`@vscode/vsce` + `electron-rebuild`** | ✅ Ya | Bundle extension; rebuild native modules (better-sqlite3) untuk Electron ABI |
| **Auto-update** | **`electron-updater`** | ✅ Ya | Update binary tanpa reinstall |

> [!IMPORTANT]
> **Dua database, bukan satu:**
> - `LevelDB` — sudah ada di VS Code core; pakai untuk KV cache (token state, file index, quick metadata)
> - `SQLite` (`better-sqlite3`) — tambahkan sebagai native module di extension host; untuk sessions, messages, artifacts, checkpoints (perlu `electron-rebuild` sesuai Electron ABI VS Code fork)
>
> Simpan di: `~/.config/agy-clone/<workspace-id>/db.sqlite` (relational) + VS Code `globalStorageUri` (LevelDB via VS Code API)

---

## Schema SQL

Lihat [`replica/schema.sql`](file:///e:/.VSCODE/project%20clone%20antigravity/replica/schema.sql) — 11 tabel:

| Tabel | Baris kunci |
|---|---|
| `models` | Seed dari provider catalog; user bisa tambah custom |
| `accounts` | BYOK — `api_key_ref` → keychain, bukan raw key |
| `account_model_support` | Many-to-many: akun mana support model mana |
| `workspaces` | Per project folder; `turbo_mode`, config JSON |
| `permission_rules` | Allow/deny/ask per tool + glob; override Turbo |
| `sessions` | Satu percakapan; `status`, `compact_summary`, `parent_id` (fork) |
| `messages` | Setiap turn; menyimpan `model_id` + `account_id` yang dipakai |
| `artifacts` | Plan/diff/screenshot; `status` pending→approved/rejected |
| `checkpoints` | Rewind points di dalam session |
| `plugins` | MCP / skill / agent; `auth_vars_ref` → keychain |
| `slash_commands` | Built-in + plugin-contributed |

---

## API Routes (IPC + internal)

Semua route adalah **Electron IPC** (`ipcMain.handle`) atau **internal engine call** — bukan HTTP server.
Format: `channel | aksi | input | output | flow`

### Accounts & Models

| Channel | Aksi | Input | Output | Flow |
|---|---|---|---|---|
| `accounts:list` | List semua akun aktif dengan status quota | — | `Account[]` | F05, S05 |
| `accounts:add` | Tambah akun baru + simpan key ke keychain | `{provider, label, apiKey, baseUrl?}` | `Account` | F01, F05 |
| `accounts:remove` | Hapus akun + hapus key dari keychain | `{id}` | `void` | S05 |
| `accounts:test` | Tes koneksi API key | `{id}` | `{ok, latencyMs}` | S16 |
| `accounts:reorder` | Ubah priority_order | `{ids: string[]}` | `void` | S05 |
| `accounts:refreshQuota` | Update quota_used dari provider | `{id}` | `Account` | S15 (cron) |
| `models:list` | List semua model (built-in + custom) | — | `Model[]` | S04 |
| `models:addCustom` | Tambah model dengan endpoint custom | `{provider, name, baseUrl, apiKey?}` | `Model` | S16 |

### Sessions & Messages

| Channel | Aksi | Input | Output | Flow |
|---|---|---|---|---|
| `sessions:list` | List sesi terbaru per workspace | `{workspaceId, limit}` | `Session[]` | S07 |
| `sessions:create` | Buat sesi baru | `{workspaceId, goalText?, modelId, accountId}` | `Session` | F02 |
| `sessions:resume` | Lanjutkan sesi yang terhenti | `{sessionId, modelId?, accountId?}` | `Session` | F04, F06 |
| `sessions:fork` | Fork dari checkpoint | `{checkpointId}` | `Session` (parent_id diisi) | F09 |
| `sessions:compact` | Jalankan context compaction | `{sessionId}` | `{summary: string, tokensFreed: int}` | F04, S17 |
| `messages:send` | Kirim pesan + stream respons agent | `{sessionId, content, attachments?}` | `AsyncIterable<Chunk>` | F02 |
| `messages:list` | Ambil riwayat pesan | `{sessionId, afterId?}` | `Message[]` | S03 |
| `checkpoints:create` | Buat checkpoint manual | `{sessionId, label}` | `Checkpoint` | F09 |
| `checkpoints:list` | List checkpoint dalam sesi | `{sessionId}` | `Checkpoint[]` | S18 |

### Turbo Mode & Permissions

| Channel | Aksi | Input | Output | Flow |
|---|---|---|---|---|
| `turbo:toggle` | Aktifkan / nonaktifkan Turbo Mode | `{workspaceId, enabled}` | `void` | F03 |
| `turbo:status` | Cek status Turbo + ringkasan rules | `{workspaceId}` | `{enabled, ruleCount}` | S06 |
| `permissions:list` | List semua rules workspace | `{workspaceId}` | `PermissionRule[]` | S12 |
| `permissions:add` | Tambah rule baru | `{workspaceId, toolName, pattern, action}` | `PermissionRule` | S12 |
| `permissions:remove` | Hapus rule | `{id}` | `void` | S12 |
| `permissions:check` | Evaluasi apakah tool call diizinkan | `{workspaceId, toolName, path}` | `'allow'|'deny'|'ask'` | Engine internal |

### Artifacts & Diffs

| Channel | Aksi | Input | Output | Flow |
|---|---|---|---|---|
| `artifacts:list` | List artifact dalam sesi | `{sessionId, type?}` | `Artifact[]` | S10 |
| `artifacts:approve` | Approve artifact (terapkan diff) | `{id}` | `void` | F10 |
| `artifacts:reject` | Tolak artifact | `{id}` | `void` | F10 |
| `artifacts:diff` | Hitung diff antara dua versi file | `{before, after}` | `DiffResult` | S10 |

### Plugins & Slash Commands

| Channel | Aksi | Input | Output | Flow |
|---|---|---|---|---|
| `plugins:list` | List semua plugin | — | `Plugin[]` | S13 |
| `plugins:install` | Install plugin dari URL / path | `{sourceUrl}` | `Plugin` | F08 |
| `plugins:toggle` | Enable/disable plugin | `{id, enabled}` | `void` | S13 |
| `slashCommands:list` | List semua command (built-in + plugin) | — | `SlashCommand[]` | S14 |
| `mcp:callTool` | Panggil tool MCP server | `{pluginId, tool, args}` | `any` | Agent engine |

### Quota Engine (background, no IPC — internal timer)

| Job | Interval | Aksi |
|---|---|---|
| `quota:poll` | Setiap 60 detik | Refresh `quota_used` semua akun aktif |
| `quota:rotate` | Triggered saat 429 | Pindah ke akun berikutnya di priority queue |
| `context:watchdog` | Setiap pesan | Cek apakah `token_count` ≥ 80% context window → trigger compaction warning |

---

## Bagian yang Menggigit (Hard Parts)

### 1. Context Serialisasi + Resume di Model Berbeda
Saat user ganti model di tengah sesi:
- **Simpan** semua `messages` ke DB (sudah dilakukan per pesan)
- **Rebuild** message array dari DB, filter pesan yang fit dalam context window model baru
- Jika terlalu panjang → jalankan `sessions:compact` dulu (summarize via model)
- **Inject** `compact_summary` sebagai system message pertama
- Lanjutkan streaming — user tidak perlu tahu ganti model

> [!IMPORTANT]
> Setiap model punya format tool call berbeda (Anthropic XML vs OpenAI JSON). Vercel AI SDK menangani ini lewat adapter per provider — JANGAN hardcode format.

### 2. BYOK Multi-Account Quota Rotation
```
Saat request → pilih akun: priority_order ASC WHERE status='ok'
Jika 429 diterima:
  → tandai accounts SET status='rate_limited', quota_reset_at = header Retry-After
  → ambil akun berikutnya
  → retry request dengan akun baru (transparent ke user)
  → tampilkan badge di S04 / S15
Timer: setiap menit cek quota_reset_at → reset status='ok' jika sudah lewat
```

### 3. Turbo Mode Permission Engine
```
Setiap tool call dari agent → permissions:check(workspaceId, toolName, path)

Prioritas rule evaluation:
  1. Explicit DENY rules (paling tinggi) → langsung tolak
  2. Explicit ALLOW rules → langsung izinkan
  3. Jika turbo_mode=true → default ALLOW semua
  4. Jika turbo_mode=false → default ASK user

ASK → tampilkan modal konfirmasi → user pilih Allow Once / Allow Always / Deny
```

### 4. Idempotency Tool Calls
Agent bisa mengirim tool call dua kali jika stream terputus.
Solusi: hash setiap tool call `(session_id, tool_name, args_hash)` → simpan di `artifacts` dengan deduplikasi.

### 5. Rate Limit Header Parsing
Setiap provider punya format berbeda:
- Anthropic: `anthropic-ratelimit-requests-remaining`, `retry-after`
- OpenAI: `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-tokens`
- Gemini: `x-quota-remaining`, response body `429`
Buat adapter per provider di `src/engine/quota/`.

---

## Build Order

### Milestone 1 — Vertical Slice (minggu 1–2)
> Prove the stack. Ugly tapi jalan end-to-end.

- [ ] Electron shell + React scaffold (`electron-vite`)
- [ ] SQLite init + migration runner
- [ ] `accounts:add` + keytar integration (simpan/ambil key)
- [ ] `models:list` seed (Gemini Flash, Claude Haiku, GPT-4o-mini)
- [ ] `sessions:create` + `messages:send` dengan streaming (satu akun, satu model)
- [ ] Chat UI dasar (S03 — input + streaming response)
- [ ] File tree (S08) + Monaco editor (S02) — read-only dulu

**Done when:** User bisa chat dengan Claude/Gemini pakai API key sendiri.

---

### Milestone 2 — Must-Haves Core (minggu 3–5)

**Accounts & BYOK (F01, F05)**
- [ ] Account Manager UI (S05) — tambah/hapus/reorder
- [ ] BYOK Config screen (S16) — test koneksi
- [ ] Quota gauge + polling (S15)
- [ ] Auto-rotate saat 429 (quota engine)

**Session Resume + Model Swap (F04, F06)**
- [ ] Session list UI (S07)
- [ ] `sessions:resume` dengan model swap
- [ ] Context compaction engine (`compact_summary`)
- [ ] Context watchdog + banner (S17)
- [ ] `checkpoints:create` + `sessions:fork` (S18)

**Model Selector (S04)**
- [ ] Dropdown model per session
- [ ] Badge rate-limited / quota-ok per akun

---

### Milestone 3 — Turbo Mode & Permissions (minggu 6–7)

**Turbo Mode (F03)**
- [ ] Turbo toggle di toolbar + settings (S06)
- [ ] Terminal dengan `node-pty` (S09)
- [ ] Permission engine (`permissions:check`) dengan rule DB
- [ ] Permission settings UI (S12)
- [ ] Warning modal saat aktifkan Turbo

**Artifact System (F10)**
- [ ] Artifact card komponen (plan, diff, terminal)
- [ ] Inline diff viewer Monaco
- [ ] `artifacts:approve` → terapkan perubahan ke file

---

### Milestone 4 — Plugin & Polish (minggu 8–10)

- [ ] MCP client (`@modelcontextprotocol/sdk`) + Plugin Manager (S13)
- [ ] Slash command palette (S14) — built-in + dari plugin
- [ ] Agent Manager panel (S11)
- [ ] CLI (`agy-clone --continue`, `--conversation <id>`, `--model`)
- [ ] Settings UI (S20) — global + workspace config
- [ ] Onboarding wizard (S01)
- [ ] Credential masking di terminal output
- [ ] Auto-update (`electron-updater`)

---

### v2 (di luar scope v1)
- Swarm / parallel agents (S19, F07)
- Voice mode
- IDE extensions (VS Code, JetBrains)
- Open plugin marketplace

---

## Ringkasan

**Stack:** Electron + React + TypeScript + Monaco + SQLite + Vercel AI SDK + keytar

**11 tabel, ~45 IPC channels, 3 background jobs**

**3 bagian paling berisiko:**
1. Context rebuild saat model swap (format tool call berbeda antar provider)
2. Quota rotation race condition (dua request paralel kena 429 bersamaan)
3. Turbo mode permission engine — rule priority harus deterministik

**Langkah berikutnya: `/replica-design`** — warna, tipografi, komponen design system
(atau langsung `/replica-build` jika skip design system formal)
