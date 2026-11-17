import React, { useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import type { FileTreeItem, ConversationItem } from "../../lib/api";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Download,
  RefreshCw,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  FolderGit2,
  Puzzle,
  Pin,
  PinOff,
  Pencil,
  Check,
  X,
  Globe,
  Orbit,
} from "lucide-react";

interface SidebarProps {
  width?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ width = 260 }) => {
  const {
    currentConvId,
    selectConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    setAuxTab,
    sidebarTab,
    setSidebarTab,
    workspacePath,
    workspaceName,
    workspaceTree,
    fetchWorkspace,
    createFolder,
    createFile,
    openFile,
    activeProject,
    setIsProjectModalOpen,
    setIsSkillsModalOpen,
    skills,
    selectProject,
    isGeneralChat,
    generalConversationsList,
    projectConversationsList,
  } = useChatStore();

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [isGeneralListOpen, setIsGeneralListOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateFilePrompt = () => {
    const name = window.prompt("Nama file baru (contoh: main.py atau src/app.tsx):");
    if (name) createFile(name);
  };

  const handleCreateFolderPrompt = () => {
    const name = window.prompt("Nama folder baru (contoh: components atau docs):");
    if (name) createFolder(name);
  };

  const startRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) {
      await renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const cancelRename = () => setRenamingId(null);

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") commitRename(id);
    if (e.key === "Escape") cancelRename();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["ts", "tsx", "js", "jsx", "py", "html", "css", "sql", "sh", "bat"].includes(ext || "")) {
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (["md", "txt", "json", "yml", "yaml", "env"].includes(ext || "")) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
  };

  const renderTree = (items: FileTreeItem[], depth = 0) => {
    return items.map((item) => {
      const isOpen = openFolders[item.path] ?? false;
      if (item.is_dir) {
        return (
          <div key={item.path} className="select-none">
            <div
              onClick={() => toggleFolder(item.path)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className="flex items-center justify-between py-1 pr-2 rounded hover:bg-zinc-800/60 cursor-pointer text-xs font-medium text-zinc-300 group"
            >
              <div className="flex items-center gap-1.5 truncate">
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
                {isOpen ? (
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
              </div>
            </div>
            {isOpen && item.children && item.children.length > 0 && (
              <div>{renderTree(item.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={item.path}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          onClick={() => openFile(item.path)}
          className="flex items-center justify-between py-1 pr-2 rounded hover:bg-zinc-800/70 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 group"
        >
          <div className="flex items-center gap-1.5 truncate">
            {getFileIcon(item.name)}
            <span className="truncate">{item.name}</span>
          </div>
          <a
            href={`http://localhost:8000/api/workspace/download?path=${encodeURIComponent(item.path)}`}
            download
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-indigo-300 transition-opacity"
            title="Download file"
          >
            <Download className="w-3 h-3" />
          </a>
        </div>
      );
    });
  };

  // Render row conversation dengan Pin, Rename, Delete
  const renderConvRow = (conv: ConversationItem) => {
    const isPinned = (conv.is_pinned || 0) === 1;
    const isActive = conv.id === currentConvId;
    const isRenaming = renamingId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => !isRenaming && selectConversation(conv.id)}
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-all ${
          isActive
            ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
        }`}
      >
        <div className="flex items-center gap-1.5 truncate pr-1 flex-1 min-w-0">
          {isPinned ? (
            <Pin className="w-3 h-3 shrink-0 text-amber-400" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
          )}

          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 outline-none"
            />
          ) : (
            <span className="truncate">{conv.title}</span>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {isRenaming ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); commitRename(conv.id); }}
                className="p-1 rounded hover:bg-zinc-700 text-green-400"
                title="Simpan"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
                title="Batal"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => startRename(conv, e)}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                title="Edit Nama Chat"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pinConversation(conv.id, !isPinned);
                }}
                className={`p-1 rounded hover:bg-zinc-700 ${isPinned ? "text-amber-400 hover:text-amber-300" : "text-zinc-400 hover:text-amber-400"}`}
                title={isPinned ? "Lepas Pin" : "Pin Chat Ini"}
              >
                {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400"
                title="Hapus Chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Helper untuk pisah pinned & unpinned
  const splitConvs = (list: ConversationItem[]) => {
    const pinned = list.filter((c) => (c.is_pinned || 0) === 1);
    const unpinned = list.filter((c) => (c.is_pinned || 0) === 0);
    return { pinned, unpinned };
  };

  const generalSplitted = splitConvs(generalConversationsList);
  const projectSplitted = splitConvs(projectConversationsList);

  return (
    <div
      style={{ width: `${width}px` }}
      className="border-r border-zinc-800/80 bg-[#090d16] flex flex-col h-full shrink-0 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Orbit className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-zinc-100 uppercase">Orbit Agent</h1>
            <span className="text-[10px] text-zinc-400 font-mono">Autonomous IDE</span>
          </div>
        </div>

        <button
          onClick={() => createConversation(isGeneralChat ? "General Chat" : "New Task")}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-colors"
          title="New Chat Task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ── 1. GENERAL CHAT SECTION (Disediakan khusus & terpisah) ── */}
      <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between gap-1 w-full px-2 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900/60 border border-zinc-800/70">
          <button
            onClick={() => selectProject("general")}
            className="flex items-center gap-2 flex-1 text-left truncate text-zinc-300 hover:text-white"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">General Chat</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {generalConversationsList.length}
            </span>
            {isGeneralChat && (
              <span className="text-[9px] font-mono px-1 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                ACTIVE
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                createConversation("General Chat", true);
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-blue-300"
              title="Tambah General Chat Baru"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsGeneralListOpen((prev) => !prev)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              title={isGeneralListOpen ? "Sembunyikan List General Chat" : "Tampilkan List General Chat"}
            >
              {isGeneralListOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* List General Chat tepat di bawah tombol General Chat */}
        {isGeneralListOpen && (
          <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto px-0.5">
            {generalConversationsList.length === 0 ? (
              <div className="text-[11px] text-zinc-500 py-1.5 px-2 text-center">
                Belum ada general chat.
              </div>
            ) : (
              <>
                {generalSplitted.pinned.length > 0 && (
                  <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-mono text-amber-500/80 font-semibold flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5" />
                    <span>Pinned</span>
                  </div>
                )}
                {generalSplitted.pinned.map(renderConvRow)}
                {generalSplitted.unpinned.map(renderConvRow)}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 2. ACTIVE PROJECT SWITCHER BAR ─────────────────────── */}
      <div className="px-2 py-2 border-b border-zinc-800/80 bg-zinc-950/60">
        <div
          className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
            !isGeneralChat && activeProject
              ? "bg-indigo-950/30 border-indigo-700/50 shadow-sm"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
          onClick={() => setIsProjectModalOpen(true)}
          title={`Active Project:\n${workspacePath}\n(Klik untuk ganti atau buat project baru)`}
        >
          <div className="flex items-center gap-2 truncate flex-1">
            <FolderGit2 className={`w-4 h-4 shrink-0 ${!isGeneralChat ? "text-indigo-400" : "text-zinc-500"}`} />
            <div className="truncate">
              <div className="text-xs font-bold text-zinc-200 truncate flex items-center gap-1.5">
                <span className="truncate">{activeProject?.name || workspaceName || "Pilih Project"}</span>
                {activeProject?.turbo_mode && (
                  <span className="text-[9px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800/60 font-bold shrink-0">
                    ⚡ TURBO
                  </span>
                )}
                {!isGeneralChat && activeProject && (
                  <span className="text-[9px] font-mono px-1 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 shrink-0">
                    ACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsProjectModalOpen(true); }}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white shrink-0 transition-colors"
            title="Kelola Project & Ganti Folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3. PRIMARY SIDEBAR TABS: Files vs Tasks ──────────────── */}
      <div className="flex items-center border-b border-zinc-800/80 bg-zinc-950/40 p-1">
        <button
          onClick={() => setSidebarTab("files")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            sidebarTab === "files"
              ? "bg-zinc-800 text-indigo-300 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setSidebarTab("tasks")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            sidebarTab === "tasks"
              ? "bg-zinc-800 text-blue-300 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Tasks ({projectConversationsList.length})</span>
        </button>
      </div>

      {/* TAB 1: PROJECT DIRECTORY & FILES EXPLORER */}
      {sidebarTab === "files" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 px-2 bg-zinc-900/30">
            <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold truncate max-w-[120px]">
              EXPLORER
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateFilePrompt}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                title="New File di Project Ini"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCreateFolderPrompt}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                title="New Folder di Project Ini"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => fetchWorkspace()}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                title="Refresh Explorer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {workspaceTree.length === 0 ? (
              <div className="text-[11px] text-zinc-500 p-4 text-center">
                Direktori kosong atau sedang memuat...
              </div>
            ) : (
              renderTree(workspaceTree)
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROJECT TASKS & CONVERSATIONS (TERISOLASI TOTAL) */}
      {sidebarTab === "tasks" && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold mb-1">
            <span className="truncate pr-1">
              {activeProject?.name ? `${activeProject.name} · Tasks` : "Project Tasks"}
            </span>
            <button
              onClick={() => createConversation("New Task", false)}
              className="text-blue-400 hover:text-blue-300 font-sans normal-case text-xs shrink-0"
              title="Tambah task baru untuk project ini"
            >
              + New
            </button>
          </div>

          {projectConversationsList.length === 0 ? (
            <div className="text-xs text-zinc-500 p-4 text-center">
              Belum ada task di project ini.<br />
              <button
                onClick={() => createConversation("New Task", false)}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline"
              >
                Mulai Task Baru
              </button>
            </div>
          ) : (
            <>
              {projectSplitted.pinned.length > 0 && (
                <div className="px-2 pt-1 pb-0.5 text-[9px] uppercase font-mono text-amber-500/80 font-semibold flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5" />
                  <span>Pinned</span>
                </div>
              )}
              {projectSplitted.pinned.map(renderConvRow)}

              {projectSplitted.unpinned.length > 0 && projectSplitted.pinned.length > 0 && (
                <div className="px-2 pt-2 pb-0.5 text-[9px] uppercase font-mono text-zinc-600 font-semibold">
                  Recent
                </div>
              )}
              {projectSplitted.unpinned.map(renderConvRow)}
            </>
          )}
        </div>
      )}

      {/* Bottom: Skills & Settings */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0 space-y-1">
        <button
          onClick={() => setIsSkillsModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-indigo-300 hover:bg-indigo-950/30 border border-zinc-800/60 hover:border-indigo-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-indigo-400" />
            <span>Skills & Plugins</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {skills.length}
          </span>
        </button>

        <button
          onClick={() => setAuxTab("settings")}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
        >
          <Settings className="w-4 h-4 text-zinc-500" />
          <span>Model Accounts & Keys</span>
        </button>
      </div>
    </div>
  );
};
