import React, { useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import {
  X,
  Plus,
  FolderGit2,
  Folder,
  Zap,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";

export const ProjectModal: React.FC = () => {
  const {
    isProjectModalOpen,
    setIsProjectModalOpen,
    projects,
    activeProject,
    createProject,
    selectProject,
    updateProject,
    deleteProject,
  } = useChatStore();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("C:\\Users\\rdent\\Desktop\\my-project");
  const [turboMode, setTurboMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isProjectModalOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) {
      setError("Nama project dan folder path wajib diisi.");
      return;
    }
    setError(null);
    try {
      await createProject(name.trim(), path.trim(), turboMode);
      setName("");
      setIsCreating(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Gagal membuat project.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Project & Workspace Manager</h3>
              <p className="text-[11px] text-zinc-400">Kelola folder direktori lokal dan konfigurasi Turbo Mode tiap project</p>
            </div>
          </div>
          <button
            onClick={() => setIsProjectModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Projects List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase font-mono text-zinc-400">
                Project Terdaftar ({projects.length})
              </span>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Project Baru</span>
                </button>
              )}
            </div>

            {/* List Cards */}
            <div className="space-y-2.5">
              {projects.map((proj) => {
                const isActive = proj.is_active === 1 || activeProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isActive
                        ? "bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-950/20"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 truncate flex-1">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                          <h4 className="text-xs font-bold text-zinc-200 truncate">{proj.name}</h4>
                          {isActive && (
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 truncate pl-6" title={proj.path}>
                          {proj.path}
                        </p>
                      </div>

                      {/* Right controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Turbo Mode Toggle per project */}
                        <button
                          onClick={() => updateProject(proj.id, { turbo_mode: !proj.turbo_mode })}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                            proj.turbo_mode
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border border-zinc-700/60"
                          }`}
                          title="Klik untuk on/off Turbo Mode di project ini"
                        >
                          <Zap className={`w-3 h-3 ${proj.turbo_mode ? "text-red-400 fill-red-400" : ""}`} />
                          <span>{proj.turbo_mode ? "Turbo ON" : "Turbo OFF"}</span>
                        </button>

                        {!isActive ? (
                          <button
                            onClick={() => selectProject(proj.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka</span>
                          </button>
                        ) : (
                          <span className="p-1 text-emerald-400">
                            <Check className="w-4 h-4" />
                          </span>
                        )}

                        {projects.length > 1 && !isActive && (
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Hapus project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Create Project */}
          {isCreating && (
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-zinc-950/80 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Form Buat Project Baru</span>
                </h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Batal
                </button>
              </div>

              {error && (
                <div className="p-2 rounded bg-red-950/50 border border-red-800/60 text-xs text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Nama Project:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="contoh: Toko Online, Web Portfolio, Automation Bot"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Folder Path di PC Lokal (Root Desktop / Direktori):
                  </label>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="contoh: C:\Users\rdent\Desktop\projek-baru"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Folder akan dibuat secara otomatis di komputer Anda jika belum ada.
                  </span>
                </div>

                {/* Turbo Mode Checkbox inside project create */}
                <div className="pt-2 border-t border-zinc-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={turboMode}
                      onChange={(e) => setTurboMode(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-700 text-indigo-600 focus:ring-0 bg-zinc-900"
                    />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 ${turboMode ? "text-red-400 fill-red-400" : "text-zinc-500"}`} />
                        <span>Aktifkan Turbo Mode untuk Project ini</span>
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Memberikan AI izin penuh mengeksekusi shell terminal dan menulis file ke direktori project secara langsung tanpa popup konfirmasi setiap turn.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Buat & Buka Project
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
