import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../stores/chatStore";
import { Send, StopCircle, Terminal, Paperclip, Sparkles, X, Image, FileText } from "lucide-react";

interface AttachmentItem {
  name: string;
  type: string;
  data_url?: string;
  text_content?: string;
  preview?: string;
}

export const ChatInput: React.FC = () => {
  const [content, setContent] = useState("");
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const { sendMessage, isStreaming, skills } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Static slash commands
  const staticCommands = [
    { cmd: "/plan", desc: "Plan a complex task step-by-step before executing" },
    { cmd: "/hermes", desc: "Delegate task directly to local Hermes Autonomous Agent (Zero Cloud Cost)" },
    { cmd: "/goal", desc: "Set an unwavering target goal for the session" },
    { cmd: "/compact", desc: "Compact long conversation context into summary" },
    { cmd: "/terminal", desc: "Focus or execute command in integrated terminal" },
    { cmd: "/checkpoint", desc: "Manually snapshot task progress for safe resume" },
  ];

  // Dynamic skill commands
  const skillCommands = skills
    .filter((s) => s.enabled)
    .map((s) => ({
      cmd: `/skill:${s.name}`,
      desc: s.description || `Apply ${s.display_name || s.name} skill`,
    }));

  const slashCommands = [...staticCommands, ...skillCommands];

  // Filter berdasarkan input user setelah "/"
  const filteredCommands = content.startsWith("/")
    ? slashCommands.filter((c) => c.cmd.toLowerCase().includes(content.toLowerCase()))
    : slashCommands;

  // ── File attachment handler ──────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              data_url: reader.result as string,
              preview: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Text / code / other files
        const text = await file.text();
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            text_content: text.slice(0, 8000),
            preview: text.slice(0, 100),
          },
        ]);
      }
    }
    // Reset input supaya bisa upload file yang sama lagi
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Send ────────────────────────────────────────────────────
  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;

    // Build final message text — include attachment text content if any
    let finalContent = content.trim();
    if (attachments.length > 0) {
      const attText = attachments
        .map((a) => {
          if (a.text_content) return `\n\n[Attached File: ${a.name}]\n\`\`\`\n${a.text_content}\n\`\`\``;
          if (a.data_url) return `\n\n[Attached Image: ${a.name}]`;
          return "";
        })
        .join("");
      finalContent = finalContent + attText;
    }

    // Strip /skill:xxx prefix and expand it
    let expandedContent = finalContent;
    const skillMatch = finalContent.match(/^\/skill:(\S+)\s*(.*)/s);
    if (skillMatch) {
      expandedContent = `Tolong baca dan terapkan skill '${skillMatch[1]}' untuk tugas berikut:\n${skillMatch[2]}`;
    }

    // Strip /hermes prefix and expand it
    const hermesMatch = finalContent.match(/^\/hermes\s*(.*)/s);
    if (hermesMatch) {
      expandedContent = `Tolong delegasikan tugas ini ke Hermes Agent menggunakan tool invoke_hermes:\n${hermesMatch[1]}`;
    }

    sendMessage(expandedContent, attachments.length > 0 ? attachments : undefined);
    setContent("");
    setAttachments([]);
    setSlashMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSlashMenuOpen(val.startsWith("/"));
  };

  const selectSlash = (cmd: string) => {
    setContent(cmd + " ");
    setSlashMenuOpen(false);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="relative px-6 pb-6 pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.csv,.sql,.html,.css,.yaml,.yml,.toml"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Slash command menu popover */}
      {slashMenuOpen && filteredCommands.length > 0 && (
        <div className="absolute bottom-full mb-2 left-6 w-96 max-h-72 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50">
          <div className="text-[10px] uppercase font-mono text-zinc-500 px-2 py-1">Slash Commands</div>
          {filteredCommands.map((item) => (
            <button
              key={item.cmd}
              onClick={() => selectSlash(item.cmd)}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-800 flex flex-col transition-colors"
            >
              <span className={`font-mono text-xs font-semibold ${item.cmd.startsWith("/skill:") ? "text-purple-400" : "text-emerald-400"}`}>
                {item.cmd}
              </span>
              <span className="text-[11px] text-zinc-400">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Attachment preview chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 max-w-[200px]"
            >
              {att.type.startsWith("image/") ? (
                <>
                  <Image className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {att.preview && (
                    <img src={att.preview} alt={att.name} className="w-8 h-8 object-cover rounded" />
                  )}
                </>
              ) : (
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-2xl backdrop-blur transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Orbit Agent to build, edit code, run commands, or type '/' for commands..."
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none leading-relaxed"
        />

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Paperclip → opens file picker */}
            <button
              type="button"
              title="Attach File / Image"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors relative"
            >
              <Paperclip className="w-4 h-4" />
              {attachments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-[9px] flex items-center justify-center text-white font-bold">
                  {attachments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => selectSlash("/plan")}
              title="Quick Plan"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>/plan</span>
            </button>
            <button
              type="button"
              onClick={() => selectSlash("/hermes")}
              title="Delegasikan ke Hermes Local Agent (Zero Token Cost)"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/40 text-[11px] text-amber-300 transition-colors"
            >
              <span className="font-serif font-bold text-xs">☤</span>
              <span>/hermes</span>
            </button>
            <button
              type="button"
              onClick={() => selectSlash("/terminal")}
              title="Run Terminal Command"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/60 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>/terminal</span>
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0 && !isStreaming}
            className={`p-2 rounded-xl text-white transition-all ${
              isStreaming
                ? "bg-red-600 hover:bg-red-500"
                : content.trim() || attachments.length > 0
                ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
