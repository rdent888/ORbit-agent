import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MessageItem } from "../../lib/api";
import { useChatStore } from "../../stores/chatStore";
import {
  Bot,
  User,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  FileCode,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Terminal,
  Search,
  Sparkles,
  GitBranch,
} from "lucide-react";

interface Props {
  message: MessageItem;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const { deleteMessage, openFile, workspacePath } = useChatStore();
  const [copied, setCopied] = useState(false);
  const [isToolDetailsOpen, setIsToolDetailsOpen] = useState(false);

  const isUser = message.role === "user";
  const isTool = message.role === "tool";
  const isSystem = message.role === "system";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ekstensi file yang valid (bukan direktori atau teks obrolan biasa)
  const VALID_FILE_EXTENSIONS = new Set([
    "js", "jsx", "ts", "tsx", "py", "pyw", "java", "c", "cpp", "h", "hpp", "cs",
    "go", "rs", "php", "rb", "swift", "kt", "kts", "dart", "scala",
    "html", "htm", "css", "scss", "sass", "less",
    "json", "jsonc", "yaml", "yml", "toml", "xml", "csv", "tsv", "sql",
    "md", "mdx", "txt", "rst", "log", "env",
    "sh", "bash", "zsh", "bat", "cmd", "ps1",
    "svg", "png", "jpg", "jpeg", "gif", "webp", "ico", "pdf",
    "lock", "ini", "cfg", "conf"
  ]);

  const SPECIAL_FILE_NAMES = new Set([
    "dockerfile", "makefile", "gemfile", "procfile", "vagrantfile", "caddyfile",
    "license", ".gitignore", ".env", ".env.local", ".env.production",
    "package.json", "tsconfig.json"
  ]);

  // Validasi apakah sebuah string adalah file nyata, BUKAN direktori atau teks obrolan biasa
  const isRealFilePath = (rawPath: string): boolean => {
    if (!rawPath) return false;
    const clean = rawPath.trim().replace(/^['"`\s]+|['"`\s.,;:()]+$/g, "");
    if (!clean) return false;

    // Normalisasi slash
    const norm = clean.replace(/\\/g, "/");
    const wsNorm = (workspacePath || "").replace(/\\/g, "/").replace(/\/+$/, "");

    // 1. Tolak jika path sama dengan root workspace atau direktori root
    if (wsNorm) {
      if (
        norm.toLowerCase() === wsNorm.toLowerCase() ||
        norm.toLowerCase() === wsNorm.toLowerCase() + "/" ||
        norm.toLowerCase() + "/" === wsNorm.toLowerCase()
      ) {
        return false;
      }
    }

    // 2. Tolak jika berakhiran slash (itu folder)
    if (clean.endsWith("/") || clean.endsWith("\\")) {
      return false;
    }

    // Ambil nama file terakhir
    const segments = norm.split("/").filter(Boolean);
    const fname = segments.length > 0 ? segments[segments.length - 1] : clean;
    if (!fname) return false;

    const lowerFname = fname.toLowerCase();
    if (SPECIAL_FILE_NAMES.has(lowerFname)) return true;

    // Cek ekstensi file (harus ada dot dan ekstensi terdaftar)
    const dotIdx = fname.lastIndexOf(".");
    if (dotIdx <= 0 || dotIdx === fname.length - 1) {
      return false;
    }

    const ext = fname.slice(dotIdx + 1).toLowerCase();
    return VALID_FILE_EXTENSIONS.has(ext);
  };

  // Ekstrak file yang dihasilkan dari eksekusi tool (hanya jika tool sukses menulis/mengedit file)
  const extractToolFiles = (toolOutput: string): string[] => {
    if (!toolOutput || toolOutput.startsWith("Error")) return [];

    const files: string[] = [];

    // Format write_file: "Written <N> chars to <path>"
    const writtenMatch = toolOutput.match(/Written \d+ chars to\s+([^\s<>"'\n]+)/i);
    if (writtenMatch && isRealFilePath(writtenMatch[1])) {
      files.push(writtenMatch[1].trim());
    }

    // Format edit_file: "Edited <path>: replaced ..."
    const editMatch = toolOutput.match(/Edited\s+([^\s<>"'\n:]+):/i);
    if (editMatch && isRealFilePath(editMatch[1]) && !files.includes(editMatch[1].trim())) {
      files.push(editMatch[1].trim());
    }

    // Format create_artifact / saved to:
    const artifactMatch = toolOutput.match(/(?:Artifact created|saved to|created and saved to)(?:\s*:)?\s+([^\s<>"'\n]+)/i);
    if (artifactMatch && isRealFilePath(artifactMatch[1]) && !files.includes(artifactMatch[1].trim())) {
      files.push(artifactMatch[1].trim());
    }

    return files.slice(0, 4);
  };

  // Ekstrak file HANYA jika asisten benar-benar melakukan aksi pembuatan/modifikasi file
  // BUKAN pada obrolan / chat santai biasa
  const extractAssistantFiles = (
    rawText: string,
    detectedToolsList: Array<{ tool: string; args: Record<string, any> }>
  ): string[] => {
    const files: string[] = [];

    // 1. Jika pesan mengandung tool call file (write_file, edit_file, create_artifact)
    for (const t of detectedToolsList) {
      if (t.tool === "write_file" || t.tool === "edit_file" || t.tool === "create_artifact") {
        const candidate = t.args?.path || t.args?.filename || t.args?.file;
        if (candidate && isRealFilePath(candidate) && !files.includes(candidate)) {
          files.push(candidate);
        }
      }
    }

    // 2. Jika asisten dalam respons teksnya secara eksplisit menyatakan aksi pembuatan/penulisan file
    // Menggunakan kata kunci spesifik agar tidak salah mendeteksi obrolan biasa
    const explicitCreationRegex =
      /(?:(?:Berhasil membuat file|File telah dibuat|Created file|Telah membuat file|Telah disimpan ke|Saved to|Saved file|Written \d+ chars to)(?:\s*:)?\s+)([a-zA-Z]:[\\/][^\s<>"'\n]+|\.?\.?[\\/][a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+|[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/gi;

    let match;
    while ((match = explicitCreationRegex.exec(rawText)) !== null) {
      const candidate = match[1].replace(/[.,;:()]+$/, "");
      if (isRealFilePath(candidate) && !files.includes(candidate)) {
        files.push(candidate);
      }
    }

    return files.slice(0, 4);
  };

  // Bersihkan teks asisten dari blok JSON tool_call mentah agar tidak bocor ke tampilan chat
  const parseAssistantContent = (rawText: string) => {
    const toolCallRegex = /```tool_call\s*\n([\s\S]*?)\n```/g;
    const rawJsonRegex = /\{"tool":\s*"[^"]+",\s*"args":\s*\{[\s\S]*?\}\s*\}/g;

    const detectedTools: Array<{ tool: string; args: Record<string, any> }> = [];

    let cleaned = rawText.replace(toolCallRegex, (_match, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr.trim());
        detectedTools.push(parsed);
      } catch (e) {
        // Abaikan parse error
      }
      return ""; // Hapus dari teks markdown agar tidak tampil mentah
    });

    cleaned = cleaned.replace(rawJsonRegex, (jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr.trim());
        if (parsed.tool) {
          detectedTools.push(parsed);
          return "";
        }
      } catch (e) {}
      return jsonStr;
    });

    return {
      text: cleaned.trim(),
      tools: detectedTools,
    };
  };

  // 1. SYSTEM NOTIFICATION BUBBLE
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3 px-4">
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-3 max-w-xl w-full shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{message.content}</span>
          </div>
          <button
            onClick={() => deleteMessage(message.id)}
            className="p-1 hover:bg-amber-900/50 rounded text-amber-400 hover:text-amber-200"
            title="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. USER MESSAGE BUBBLE — DIPOSISIKAN DI KANAN
  if (isUser) {
    return (
      <div className="flex justify-end my-3 px-4 md:px-6">
        <div className="flex items-end gap-2.5 max-w-[85%] md:max-w-[75%] flex-row-reverse group">
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
            <User className="w-4 h-4" />
          </div>

          {/* User Bubble Card */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] text-zinc-400">
              <span className="font-semibold text-blue-300">You</span>
              <span>•</span>
              <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 hover:text-zinc-200 transition-opacity p-0.5 ml-1"
                title="Salin Prompt"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm leading-relaxed shadow-lg shadow-blue-900/20 break-words">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. TOOL EXECUTION CARD (Antigravity Style Action Result)
  if (isTool) {
    const files = extractToolFiles(message.content);
    return (
      <div className="flex justify-start my-2.5 px-4 md:px-6">
        <div className="w-full max-w-3xl rounded-xl border border-emerald-500/30 bg-[#060911]/90 shadow-lg backdrop-blur overflow-hidden">
          {/* Header Bar */}
          <div className="px-3.5 py-2 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-emerald-300">Tool Execution Completed</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <button
              onClick={() => setIsToolDetailsOpen(!isToolDetailsOpen)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <span>{isToolDetailsOpen ? "Sembunyikan" : "Detail"}</span>
              {isToolDetailsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          {/* Main Summary */}
          <div className="p-3">
            <div className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 overflow-x-auto whitespace-pre-wrap">
              {isToolDetailsOpen ? message.content : (message.content.slice(0, 220) + (message.content.length > 220 ? "..." : ""))}
            </div>

            {/* Referenced File Chips with Quick Action Buttons */}
            {files.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-2">
                {files.map((fPath) => {
                  const fname = fPath.split(/[\\/]/).pop() || fPath;
                  return (
                    <div
                      key={fPath}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs shadow-sm hover:border-indigo-500/60 transition-colors"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-mono text-zinc-200 font-medium truncate max-w-[190px]" title={fPath}>
                        {fname}
                      </span>
                      <div className="flex items-center gap-1 border-l border-zinc-700 pl-2">
                        <button
                          onClick={() => openFile(fPath)}
                          className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-indigo-300 hover:text-indigo-200 flex items-center gap-1 text-[11px] font-medium"
                          title="Buka langsung di Editor"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Buka</span>
                        </button>
                        <a
                          href={`http://localhost:8000/api/workspace/download?path=${encodeURIComponent(fPath)}`}
                          download
                          className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium"
                          title="Download file ke komputer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. ASSISTANT MESSAGE BUBBLE (Antigravity Agent) — DIPOSISIKAN DI KIRI
  const { text: cleanText, tools: detectedTools } = parseAssistantContent(message.content);
  const referencedFiles = extractAssistantFiles(message.content, detectedTools);

  return (
    <div className="flex justify-start my-3 px-4 md:px-6">
      <div className="flex items-start gap-3 max-w-[92%] md:max-w-[85%] group">
        {/* Agent Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/30 shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-zinc-200">Orbit Agent</span>
              {message.model_id && (
                <span className="text-[10px] font-mono bg-zinc-800 text-indigo-300 border border-indigo-700/40 rounded px-1.5 py-0.5">
                  {message.model_id}
                </span>
              )}
              <span className="text-[10px] text-zinc-500 font-mono">
                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Action Buttons: Copy */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
                title="Salin Respon"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Activity Cards (jika model sedang mengeksekusi tool - Antigravity Style Animation) */}
          {detectedTools.length > 0 && (
            <div className="mb-3 space-y-2">
              {detectedTools.map((tc, idx) => {
                const toolName = tc.tool || "action";
                const filePath = tc.args?.path || tc.args?.filename || "";
                const fileName = filePath.split(/[\\/]/).pop() || filePath;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-950/30 border border-indigo-500/30 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        {toolName.includes("write") || toolName.includes("edit") ? (
                          <FileCode className="w-3.5 h-3.5 animate-pulse" />
                        ) : toolName.includes("grep") || toolName.includes("search") ? (
                          <Search className="w-3.5 h-3.5 animate-pulse" />
                        ) : toolName.includes("git") ? (
                          <GitBranch className="w-3.5 h-3.5" />
                        ) : (
                          <Terminal className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-indigo-200">
                          {toolName === "write_file"
                            ? `Membuat / Menulis File:`
                            : toolName === "edit_file"
                            ? `Mengedit File:`
                            : toolName === "delete_file"
                            ? `Menghapus File:`
                            : `Menjalankan ${toolName}:`}
                        </span>
                        {fileName && (
                          <span className="ml-1.5 font-mono text-xs font-semibold text-emerald-400 truncate">
                            {fileName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 flex items-center gap-1 shrink-0 ml-2">
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                      <span>Executed</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clean Markdown Text Content */}
          {cleanText && (
            <div className="p-4 rounded-2xl rounded-tl-sm bg-[#0d1117] border border-zinc-800/80 shadow-md text-sm leading-relaxed text-zinc-200 prose prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-code:text-emerald-400 prose-p:leading-relaxed prose-p:my-2 prose-headings:text-zinc-100 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-5 prose-h3:text-sm prose-h3:mt-4 prose-li:text-zinc-200 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-strong:text-zinc-100 prose-blockquote:border-indigo-500 prose-blockquote:text-zinc-400 break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {cleanText}
              </ReactMarkdown>
            </div>
          )}

          {/* Referenced / Created File Chips */}
          {referencedFiles.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {referencedFiles.map((fPath) => {
                const fname = fPath.split(/[\\/]/).pop() || fPath;
                return (
                  <div
                    key={fPath}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700/70 text-xs shadow-sm hover:border-indigo-500/60 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-mono text-zinc-200 font-medium truncate max-w-[190px]" title={fPath}>
                      {fname}
                    </span>
                    <div className="flex items-center gap-1 border-l border-zinc-700 pl-2">
                      <button
                        onClick={() => openFile(fPath)}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-indigo-300 hover:text-indigo-200 flex items-center gap-1 text-[11px] font-medium"
                        title="Buka langsung di Editor"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka</span>
                      </button>
                      <a
                        href={`http://localhost:8000/api/workspace/download?path=${encodeURIComponent(fPath)}`}
                        download
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium"
                        title="Download file ke komputer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
