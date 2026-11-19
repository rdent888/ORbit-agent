# 🪐 ORbit Agent — Autonomous Coding IDE

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![LiteLLM](https://img.shields.io/badge/Routing-LiteLLM-blueviolet.svg)](https://litellm.ai/)
[![Local Engine](https://img.shields.io/badge/Local_AI-Nous_Hermes-orange.svg)](https://nousresearch.com/)

**ORbit Agent** adalah autonomous coding assistant & development environment yang dirancang untuk berjalan **100% lokal** di PC Anda — dengan dukungan multi-akun, multi-provider AI, token rotation otomatis, dan split-view IDE terintegrasi.

---

## 🌟 Fitur Utama

### 1. 🤖 Multi-Provider AI dengan Token Pool & Auto-Fallback
- Dukung **Google Gemini**, **bansosAI Proxy**, **Anthropic Claude**, **OpenAI**, **OpenRouter**, **Ollama**, dan **custom OpenAI-compatible proxy**.
- Daftarkan **banyak akun per provider** (misal 3 akun Google AI Studio, 3 akun bansosAI) — sistem otomatis berotasi ke akun berikutnya saat rate-limit `429` tercapai.
- **Priority system:** Akun priority `0` = utama, `1` = cadangan, `2+` = fallback. Bisa diedit kapan saja.
- **Auto-priority slot:** Saat tambah akun baru, slot priority diisi otomatis ke angka berikutnya (tidak perlu hitung manual).

### 2. 🧠 Smart Task Router (Auto Model Switching)
- Mode **Auto** memilih model terbaik sesuai kompleksitas task secara otomatis.
- **Hermes Local Engine:** Integrasi langsung dengan Nous Hermes Agent yang berjalan di PC lokal — Zero Cloud Cost & 100% Private.
- Ketika semua akun cloud kena rate-limit, sistem fallback ke Hermes tanpa interupsi.

### 3. 📊 Real-Time Token & Model Monitor
- Badge monitor di navbar menampilkan: jumlah model aktif, token terpakai hari ini, dan status kesehatan tiap akun secara live.
- Panel detail memperlihatkan progress bar kuota per akun, ketersediaan tiap model, dan bisa digunakan langsung sebagai model picker.
- Auto-refresh tiap 12 detik.

### 4. ⚙️ Model Settings & Accounts Panel
- **Tambah akun** dari antarmuka UI — isi provider, label, API key, priority, dan batas token harian.
- **Edit inline** per akun: ubah label, priority, batas token, atau ganti API key tanpa hapus-daftar ulang.
- **Quick priority ▲▼**: Naikkan/turunkan urutan akun satu langkah langsung dari kartu akun.
- **Ambil model otomatis**: Fetch daftar model yang tersedia dari provider (bansosAI, custom proxy) — sistem cerdas mencegah duplikat.
- **Tambah model manual**: Daftarkan Model ID kustom (GPT-4o, DeepSeek, model Gemini terbaru) langsung dari UI.

### 5. 🖥️ Resizable Split-View IDE
- **Split mode:** Chat kiri + Editor/Terminal kanan, lebar bisa digeser bebas.
- **Full Chat / Full Editor:** Tombol toggle layout di navbar.
- **Integrated Terminal:** PowerShell via WebSocket real-time.
- **Code Viewer:** Tab editor file dengan simpan ke disk, salin, dan unduh.

### 6. 💾 Checkpoint & Cross-Model Resume
- Auto-snapshot percakapan mendekati batas token atau gangguan jaringan.
- Lanjutkan task yang terhenti dengan model berbeda tanpa kehilangan konteks.

### 7. ⚡ Slash Commands
| Command | Fungsi |
|---|---|
| `/hermes` | Delegasikan task ke Hermes Autonomous Agent lokal |
| `/plan` | Rancang rencana eksekusi terstruktur |
| `/goal` | Kunci target utama sesi |
| `/terminal` | Buka konsol terminal interaktif |
| `/checkpoint` | Snapshot manual progres |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Zustand, Lucide Icons, `@xterm/xterm` |
| **Backend** | Python 3.12, FastAPI, WebSocket, SQLAlchemy, SQLite (WAL mode) |
| **AI Routing** | LiteLLM (multi-provider abstraction) |
| **Security** | Fernet symmetric encryption untuk API key di database |
| **Local AI** | Nous Hermes Agent (OpenAI-compatible local server) |

---

## 🚀 Instalasi & Menjalankan

### Prasyarat
Pastikan sudah terinstal:
- **Python 3.10+** (centang *"Add Python to PATH"* saat instalasi)
- **Node.js v18+**
- **Git**

---

### ✅ Cara 1: Setup Otomatis (Rekomendasi Windows)

```bash
git clone https://github.com/rdent888/ORbit-agent.git
cd ORbit-agent
```

Double-click **`install.bat`** — otomatis membuat virtual environment, install semua dependensi backend & frontend.

Setelah selesai, jalankan kapan saja dengan double-click **`start.bat`** → backend, frontend, dan browser terbuka otomatis di `http://localhost:5173`.

---

### Cara 2: Manual via Terminal

```bash
# 1. Clone
git clone https://github.com/rdent888/ORbit-agent.git
cd ORbit-agent

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# 3. Frontend (terminal baru)
cd frontend
npm install
npm run dev
```

Buka **`http://localhost:5173`** di browser.

---

## 🔑 Menambahkan API Key

1. Klik ikon **⚙️ Settings** di pojok kanan atas navbar.
2. Di panel **Model Settings & Accounts**, isi form:
   - **Provider** → pilih Google Gemini, bansosAI, Claude, dll.
   - **Label** → nama bebas untuk akun ini
   - **API Key** → paste key dari provider
   - **Prioritas** → otomatis diisi slot berikutnya (bisa diubah)
3. Klik **Simpan ke Pool Akun**.

> Untuk Google AI Studio: dapatkan API key gratis di [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Tidak perlu isi Base URL.
>
> Untuk bansosAI: Base URL otomatis diisi `https://api.bansosai.app/v1`. Gunakan tombol **Ambil Model dari Provider** setelah simpan akun pertama.

---

## 🗂️ Struktur Direktori

```
ORbit-Agent/
├── backend/
│   ├── main.py                  # FastAPI app, semua endpoint REST & WebSocket
│   ├── models/all_models.py     # SQLAlchemy ORM models
│   ├── services/
│   │   ├── agent.py             # Autonomous agent loop & tool execution
│   │   └── litellm_router.py    # Multi-provider routing & account pool
│   └── tools/                   # Tool definitions (run_command, file_ops, dll)
├── frontend/
│   └── src/
│       ├── App.tsx              # Layout root (sidebar + chat + editor + aux pane)
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatCanvas.tsx       # Navbar 2-baris + area chat
│       │   │   ├── ModelSelector.tsx    # Dropdown model picker dengan search & tabs
│       │   │   └── TokenMonitorBadge.tsx # Real-time token & model monitor
│       │   ├── settings/
│       │   │   └── ModelAccountManager.tsx  # Panel kelola akun & model
│       │   └── auxiliary/
│       │       └── AuxiliaryPane.tsx    # Settings drawer
│       └── stores/chatStore.ts  # Zustand global state
├── data/
│   └── agy_local.db             # SQLite database (auto-created)
├── install.bat                  # One-click installer (Windows)
├── start.bat                    # One-click launcher (Windows)
└── CONTEXT byOrbit.md           # Handoff document untuk AI session
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **Apache 2.0** — lihat file [LICENSE](LICENSE) untuk detail.  
Hak Cipta © 2026 rdent888.
