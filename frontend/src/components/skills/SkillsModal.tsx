import React, { useState, useEffect } from "react";
import { useChatStore } from "../../stores/chatStore";
import {
  X,
  Sparkles,
  GitBranch,
  FolderDown,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  BookOpen,
  Puzzle,
} from "lucide-react";

export const SkillsModal: React.FC = () => {
  const {
    skills,
    isSkillsModalOpen,
    setIsSkillsModalOpen,
    fetchSkills,
    installSkill,
    importLocalSkill,
    createCustomSkill,
    toggleSkill,
    deleteSkill,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<"installed" | "github" | "local" | "create">("installed");

  // Form states
  const [gitUrl, setGitUrl] = useState("");
  const [gitName, setGitName] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [localName, setLocalName] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customInst, setCustomInst] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isSkillsModalOpen) {
      fetchSkills();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isSkillsModalOpen]);

  if (!isSkillsModalOpen) return null;

  const handleInstallGit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await installSkill(gitUrl.trim(), gitName.trim() || undefined);
      setSuccessMsg(`Skill berhasil diinstal dari GitHub!`);
      setGitUrl("");
      setGitName("");
      setActiveTab("installed");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Gagal menginstal dari Git.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPath.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await importLocalSkill(localPath.trim(), localName.trim() || undefined);
      setSuccessMsg(`Skill lokal berhasil diimpor ke sistem!`);
      setLocalPath("");
      setLocalName("");
      setActiveTab("installed");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Gagal mengimpor dari path lokal.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customDesc.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await createCustomSkill(customName.trim(), customDesc.trim(), customInst.trim());
      setSuccessMsg(`Skill kustom '${customName}' berhasil dibuat!`);
      setCustomName("");
      setCustomDesc("");
      setCustomInst("");
      setActiveTab("installed");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err.message || "Gagal membuat skill kustom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0e131f] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Skills, Architect & Plugin Extension
              </h3>
              <p className="text-xs text-zinc-400">
                Tingkatkan kemampuan AI dengan menginstal skill, arsitek, atau menghubungkan skill lokal.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSkillsModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-800/60 bg-[#0a0e17] shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab("installed")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "installed"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Terpasang ({skills.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("github")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "github"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Install dari GitHub / Git</span>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "local"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>Import Folder Lokal PC</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Skill Kustom</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: INSTALLED SKILLS */}
          {activeTab === "installed" && (
            <div className="space-y-3">
              {skills.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Puzzle className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm font-semibold text-zinc-400">Belum ada skill yang terpasang</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Kamu bisa menginstal dari link GitHub atau mengimpor folder skill yang ada di PC kamu.
                  </p>
                </div>
              ) : (
                skills.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[#090d16] border border-zinc-800 hover:border-zinc-700/80 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-100">{s.display_name || s.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-indigo-300 border border-zinc-700">
                          {s.source}
                        </span>
                        {s.enabled ? (
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                        {s.description || "Tidak ada deskripsi."}
                      </p>
                      <div className="text-[11px] font-mono text-zinc-500 truncate" title={s.folder_path}>
                        📂 {s.folder_path}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      {/* Toggle On/Off Switch */}
                      <button
                        onClick={() => toggleSkill(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          s.enabled
                            ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {s.enabled ? "Enabled" : "Disabled"}
                      </button>

                      {/* Delete / Uninstall */}
                      <button
                        onClick={() => {
                          if (confirm(`Uninstall skill '${s.name}'?`)) {
                            deleteSkill(s.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Hapus Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: INSTALL FROM GITHUB */}
          {activeTab === "github" && (
            <form onSubmit={handleInstallGit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  URL Repositori GitHub / Git <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/username/my-antigravity-skill"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Kamu juga bisa meminta AI langsung di chat, misal: <em>"install skill dari https://github.com/..."</em>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Skill (Opsional)
                </label>
                <input
                  type="text"
                  value={gitName}
                  onChange={(e) => setGitName(e.target.value)}
                  placeholder="misal: react-architect"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !gitUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengunduh & Menginstal dari Git...</span>
                  </>
                ) : (
                  <>
                    <GitBranch className="w-4 h-4" />
                    <span>Install Skill dari Repositori</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: IMPORT FROM LOCAL PC */}
          {activeTab === "local" && (
            <form onSubmit={handleImportLocal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Path Direktori Lokal PC <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="C:\Users\...\skills\my-skill atau E:\my-custom-plugin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Masukkan path folder skill atau file SKILL.md yang sudah kamu miliki di komputer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Label Skill (Opsional)
                </label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="misal: replica-architect"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !localPath.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Mengimpor Folder Skill Lokal...</span>
                  </>
                ) : (
                  <>
                    <FolderDown className="w-4 h-4" />
                    <span>Import Skill ke Sistem</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: CREATE CUSTOM SKILL */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Skill / Arsitek <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="misal: postgresql-dba-expert"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Deskripsi / Kapan Skill Ini Digunakan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Spesialisasi optimasi query SQL, indexing, dan partitioning"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Instruksi & SOP Spesialisasi (Markdown)
                </label>
                <textarea
                  value={customInst}
                  onChange={(e) => setCustomInst(e.target.value)}
                  placeholder="Tuliskan aturan, best practice, dan langkah-langkah kerja yang harus dipatuhi AI saat skill ini aktif..."
                  rows={6}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !customName.trim() || !customDesc.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Skill Kustom...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Buat & Daftarkan Skill Baru</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
