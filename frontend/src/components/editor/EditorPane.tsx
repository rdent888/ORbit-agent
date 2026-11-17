import React, { useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import { TerminalPane } from "../auxiliary/TerminalPane";
import {
  X,
  Save,
  Download,
  Copy,
  Check,
  FileCode,
  Terminal as TerminalIcon,
  Code2,
  Columns2,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

export const EditorPane: React.FC = () => {
  const {
    openFiles,
    activeFilePath,
    openFile,
    closeFile,
    updateFileContent,
    saveFile,
    layoutMode,
    setLayoutMode,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<"file" | "terminal">("file");
  const [copied, setCopied] = useState(false);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  const handleCopyContent = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = activeFile ? activeFile.content.split("\n") : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080b12] overflow-hidden">
      {/* Tab Bar Header - Synchronized Height (h-14 / 56px) with Chat & Sidebar */}
      <div className="h-14 bg-zinc-950/60 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between px-3 shrink-0">
        {/* Left Side: Navigation Back & File / Terminal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 py-1">
          {/* Tombol Cepat: Kembali ke Chat jika sedang di mode Full Editor */}
          {layoutMode === "editor-full" && (
            <button
              onClick={() => setLayoutMode("split")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold shrink-0 transition-colors mr-1 shadow-sm"
              title="Kembali ke Tampilan Split / Chat"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Chat</span>
            </button>
          )}

          {/* File Tabs */}
          {openFiles.map((file) => {
            const isActive = activeTab === "file" && file.path === activeFilePath;
            return (
              <div
                key={file.path}
                onClick={() => {
                  setActiveTab("file");
                  openFile(file.path);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 border ${
                  isActive
                    ? "bg-zinc-800/90 text-zinc-100 border-zinc-700/90 shadow-md font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border-transparent"
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                <span className="truncate max-w-[130px]">{file.name}</span>
                {file.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(file.path);
                  }}
                  className="p-0.5 rounded hover:bg-zinc-700/80 text-zinc-500 hover:text-zinc-300 ml-1 transition-colors"
                  title="Tutup File"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Integrated Terminal Tab */}
          <div
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 border ${
              activeTab === "terminal"
                ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-md font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border-transparent"
            }`}
          >
            <TerminalIcon className={`w-3.5 h-3.5 ${activeTab === "terminal" ? "text-emerald-400" : "text-zinc-500"}`} />
            <span>Terminal</span>
            {activeTab === "terminal" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab("file");
                }}
                className="p-0.5 rounded hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-200 ml-1 transition-colors"
                title="Tutup Terminal Tab"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: File Actions & Layout Navigation Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Action buttons when file is active */}
          {activeTab === "file" && activeFile && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyContent}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
                title="Salin Konten File"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => saveFile(activeFile.path)}
                disabled={!activeFile.isDirty}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                  activeFile.isDirty
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                    : "text-zinc-600 cursor-not-allowed bg-zinc-900 border border-zinc-800/80"
                }`}
                title="Simpan perubahan ke disk lokal"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
              <a
                href={`http://localhost:8000/api/workspace/download?path=${encodeURIComponent(activeFile.path)}`}
                download
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-xs font-medium"
                title="Download file ke komputer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            </div>
          )}

          {/* Layout Mode Navigation Buttons (Never get stuck!) */}
          <div className="flex items-center border border-zinc-800 rounded-lg p-0.5 bg-zinc-900 text-xs">
            <button
              onClick={() => setLayoutMode("split")}
              className={`p-1 rounded-md transition-colors ${
                layoutMode === "split"
                  ? "bg-zinc-800 text-indigo-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Split View (Chat Kiri + Editor Kanan)"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("chat-full")}
              className={`p-1 rounded-md transition-colors ${
                layoutMode === "chat-full"
                  ? "bg-zinc-800 text-blue-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tampilan Penuh Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("editor-full")}
              className={`p-1 rounded-md transition-colors ${
                layoutMode === "editor-full"
                  ? "bg-zinc-800 text-emerald-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tampilan Penuh Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Close Editor Button */}
          <button
            onClick={() => setLayoutMode("chat-full")}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Tutup Editor & Kembali ke Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "terminal" ? (
          <div className="h-full w-full">
            <TerminalPane />
          </div>
        ) : activeFile ? (
          <div className="h-full flex flex-col">
            {/* File Path Header */}
            <div className="px-4 py-1.5 bg-[#060911]/60 border-b border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="truncate font-medium text-zinc-300">{activeFile.path}</span>
              <span className="text-zinc-500">{lines.length} lines</span>
            </div>

            {/* Code / Text Area with Line Numbers */}
            <div className="flex-1 overflow-auto flex text-xs font-mono bg-[#0d1117]">
              {/* Line Numbers */}
              <div className="py-3 px-2 bg-[#090d16] text-zinc-600 select-none text-right shrink-0 min-w-[40px] border-r border-zinc-800/60">
                {lines.map((_, idx) => (
                  <div key={idx} className="leading-5">
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Editable Text Area */}
              <textarea
                value={activeFile.content}
                onChange={(e) => updateFileContent(activeFile.path, e.target.value)}
                className="flex-1 p-3 bg-transparent text-zinc-200 outline-none resize-none leading-5 font-mono whitespace-pre overflow-x-auto selection:bg-indigo-600/40"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <Code2 className="w-12 h-12 text-zinc-700 mb-3" />
            <h4 className="text-sm font-semibold text-zinc-300 mb-1">Orbit Agent Code & File Viewer</h4>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              Klik nama file di tab <strong>Project</strong> pada sidebar, atau klik <strong>Buka</strong> pada hasil chat untuk melihat dan mengedit file langsung di sini.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("terminal")}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-emerald-400 flex items-center gap-1.5 transition-colors font-medium"
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Buka Terminal</span>
              </button>
              <button
                onClick={() => setLayoutMode("split")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-xs text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split View dengan Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
