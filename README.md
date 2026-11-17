# 🪐 Orbit Agent (Autonomous Coding IDE)

**Orbit Agent** adalah autonomous coding assistant & development environment yang dirancang khusus untuk berjalan **100% lokal** di mesin PC Anda dengan fleksibilitas model AI tanpa batas (Cloud AI + Local AI Engine).

---

## 🌟 Fitur Utama & Keunggulan

### 1. 🪐 Dual-Engine Intelligence (Cloud AI + Hermes Local PC)
- **Cloud Models:** Google Gemini 3.5 Flash, Claude Sonnet 4.5, OpenAI GPT-4o, DeepSeek, bansosAI.
- **Local PC Engine:** Terintegrasi langsung dengan **Nous Hermes Agent** lokal (Zero Cloud Cost & Private).
- **Auto Fallback & Smart Task Router:** Ketika kuota cloud habis atau terkena rate-limit (`429`), sistem otomatis berotasi atau beralih ke Hermes Agent lokal.

### 2. 🎛️ Resizable Split-View IDE & Unified Design
- **Pembatas Fleksibel yang Bisa Digeser:** Lebar Sidebar dan porsi antara Chat Canvas vs Editor/Terminal dapat disesuaikan sesuka hati dengan resizer halus dan tactile grip.
- **Header Horizon 56px:** Desain proporsional dan selaras, dengan tinggi header rata di seluruh aplikasi.
- **Dark Obsidian Theme:** Skema warna gelap yang nyaman di mata untuk sesi ngoding panjang.

### 3. ⚡ Turbo Mode (Full Local Device Access)
- **Direct Hardware & OS Access:** Agent dapat membaca, menulis, membuat berkas, dan menjalankan perintah langsung di local environment Windows Anda.
- **Action Approval Control:** Dalam mode normal, setiap eksekusi tool berisiko meminta persetujuan (*Allow / Deny*). Saat **Turbo Mode** aktif, approval dilewati untuk kecepatan maksimal.

### 4. 💾 Checkpoint & Cross-Model Resume Progress
- **Auto-Checkpoint:** Snapshot percakapan otomatis dibuat saat mendekati limit token atau kendala jaringan.
- **Ganti Model di Tengah Jalan:** Lanjutkan task yang terhenti dengan model AI lain tanpa kehilangan konteks maupun progress.

### 5. 🖥️ Integrated Terminal & Code Viewer
- Terminal PowerShell terintegrasi via WebSocket berkecepatan tinggi.
- Tab editor file dengan fitur simpan langsung ke disk lokal, salin konten, dan unduh berkas.

### 6. ⚡ Slash Commands & Quick Actions
- `/hermes` — Delegasikan task langsung ke Hermes Autonomous Agent lokal.
- `/plan` — Rancang rencana eksekusi terstruktur sebelum mulai eksekusi.
- `/goal` — Kunci target utama sesi agar AI tetap fokus.
- `/terminal` — Buka konsol terminal interaktif.
- `/checkpoint` — Snapshot manual progres kerja.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Zustand, Lucide Icons, `@xterm/xterm`
- **Backend:** Python 3.12, FastAPI, WebSocket, SQLAlchemy, SQLite (WAL mode)
- **AI Routing:** LiteLLM (multi-provider abstraction) & Fernet cryptography

---

## 🚀 Panduan Instalasi & Menjalankan (Untuk User Baru)

### 📋 Prasyarat Sistem
Sebelum menginstal, pastikan komputer sudah terpasang:
1. **Python 3.10+** (Centang *"Add Python to PATH"* saat instal)
2. **Node.js (v18+)**
3. **Git**

---

### Cara 1: Setup Otomatis 1-Klik (Rekomendasi untuk Windows)

1. Clone repositori ini:
   ```bash
   git clone https://github.com/username/orbit-agent.git
   cd orbit-agent
   ```
2. Cukup klik ganda (double-click) file:
   ```cmd
   install.bat
   ```
   *Script ini otomatis membuat virtual environment Python, menginstall dependensi backend & frontend, dan menyiapkan environment.*
3. Setelah selesai, jalankan aplikasi kapan saja dengan double-click:
   ```cmd
   start.bat
   ```
   *Aplikasi akan otomatis menyalakan backend, frontend, dan membuka browser di `http://localhost:5173`.*

---

### Cara 2: Instalasi Manual lewat Terminal

1. **Clone & Masuk ke Folder Proyek:**
   ```bash
   git clone https://github.com/username/orbit-agent.git
   cd orbit-agent
   ```

2. **Setup Backend (Python):**
   ```bash
   cd backend
   python -m venv venv
   # Aktifkan virtual environment (Windows):
   venv\Scripts\activate
   # (atau di Linux/Mac: source venv/bin/activate)

   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Setup Frontend (React + Vite):**
   Buka terminal baru di folder utama proyek:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Buka browser di **`http://localhost:5173`**.
5. Buka menu **Model Accounts & Keys** (pojok kiri bawah) untuk menambahkan API Key favorit Anda (Google Gemini, Claude, OpenAI, atau Hermes Local Engine).
