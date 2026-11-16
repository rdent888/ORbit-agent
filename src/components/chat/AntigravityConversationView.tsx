import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../engine/store';
import {
  Plus,
  Zap,
  Mic,
  ArrowUp,
  FileText,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Terminal,
  Trash2,
  FileCode,
} from 'lucide-react';

export const AntigravityConversationView: React.FC = () => {
  const {
    messages,
    sendMessage,
    isStreaming,
    models,
    activeModelId,
    setActiveModel,
    turboMode,
    setTurboMode,
    terminalOpen,
    terminalLines,
    runTerminalCommand,
    clearTerminal,
    sessions,
    activeSessionId,
    resumeInterruptedSession,
  } = useIDEStore();

  const [prompt, setPrompt] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [diffCardExpanded, setDiffCardExpanded] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const currentModel = models.find((m) => m.id === activeModelId) || models[0];
  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const isTokenLimit = currentSession?.status === 'token_limit';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (terminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, terminalOpen]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    const text = prompt;
    setPrompt('');
    await sendMessage(text);
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput;
    setTerminalInput('');
    await runTerminalCommand(cmd);
  };

  // Real files changed list matching the user's project
  const changedFiles = [
    { name: 'architecture.md', path: 'replica', added: 29, removed: 20 },
    { name: 'components.md', path: 'replica/design', added: 286, removed: 0 },
    { name: 'contrast.py', path: 'replica/design', added: 77, removed: 0 },
    { name: 'tailwind.config.ts', path: 'replica/design', added: 104, removed: 0 },
    { name: 'tokens.css', path: 'replica/design', added: 125, removed: 0 },
    { name: 'tokens.json', path: 'replica/design', added: 160, removed: 0 },
    { name: 'schema.sql', path: 'replica', added: 11, removed: 3 },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121317] relative select-text overflow-hidden font-ui">
      {/* Scrollable Conversation Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-48 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* Token Quota Warning Banner if token limit is hit */}
        {isTokenLimit && (
          <div className="p-3 bg-[#2d1f07] border border-warning/40 rounded-xl text-warning text-xs flex items-center justify-between shadow-md">
            <span>
              Error Individual quota reached. Resets in 167h. Ganti model AI di pill bawah lalu tekan Resume.
            </span>
            <button
              onClick={() => resumeInterruptedSession(activeSessionId, activeModelId)}
              className="bg-warning text-black font-semibold text-2xs px-3 py-1 rounded hover:bg-warning/90 cursor-pointer"
            >
              Resume dengan {currentModel.displayName}
            </button>
          </div>
        )}

        {/* Artifact Card 1: Architecture Summary (Matches Image 2) */}
        <div className="p-4 bg-[#181920] border border-[#2a2c35] rounded-xl shadow-md flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#e2e8f0]">
            <FileText className="w-4 h-4 text-accent-text" />
            <span>Architecture Summary</span>
          </div>
          <p className="text-xs text-[#a0a5b5] leading-relaxed">
            Stack final yang diupdate: VS Code fork (sama persis dengan Antigravity asli) + Vercel AI SDK + SQLite + LevelDB + keytar. Dibandingkan dengan versi sebelumnya yang pakai Electron dari nol.
          </p>
        </div>

        {/* Artifact Card 2: Design Summary (Matches Image 2) */}
        <div className="p-4 bg-[#181920] border border-[#2a2c35] rounded-xl shadow-md flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#e2e8f0]">
            <FileText className="w-4 h-4 text-accent-text" />
            <span>Design Summary</span>
          </div>
          <p className="text-xs text-[#a0a5b5] leading-relaxed">
            Design system lengkap untuk Antigravity IDE Clone. Mencakup: stack final VS Code fork, colour tokens (15 pair semua WCAG AA pass), tipografi (Inter + JetBrains Mono), spacing 8px grid, radius, shadow, motion, layout, Tailwind config, dan specs 14 komponen lengkap dengan states dan a11y.
          </p>
        </div>

        {/* Artifact Card 3: 7 files changed +792 -23 [Review] (Matches Image 2) */}
        <div className="p-4 bg-[#181920] border border-[#2a2c35] rounded-xl shadow-md flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div
              onClick={() => setDiffCardExpanded(!diffCardExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-[#e2e8f0] cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-accent-text" />
              <span>7 files changed <span className="text-success font-mono">+792</span> <span className="text-danger-text font-mono">-23</span></span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${diffCardExpanded ? 'rotate-180' : ''}`} />
            </div>
            <button className="bg-[#242732] hover:bg-[#2c303e] text-xs font-medium text-[#e2e8f0] px-3 py-1 rounded-md border border-[#353846] cursor-pointer flex items-center gap-1.5 transition-colors">
              <FileText className="w-3.5 h-3.5 text-muted" />
              <span>Review</span>
            </button>
          </div>

          {diffCardExpanded && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#242732] text-xs font-mono">
              {changedFiles.map((f) => (
                <div key={f.name} className="flex items-center justify-between py-0.5 px-1 hover:bg-[#1f2027] rounded">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-2xs text-[#707585]">M+</span>
                    <span className="text-text font-medium">{f.name}</span>
                    <span className="text-2xs text-[#606575] font-sans truncate">e:/.VSCODE/project clone antigravity/{f.path}</span>
                  </div>
                  <div className="flex items-center gap-2 text-2xs shrink-0">
                    {f.added > 0 && <span className="text-success font-mono">+{f.added}</span>}
                    {f.removed > 0 && <span className="text-danger-text font-mono">-{f.removed}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Stream */}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className="p-4 bg-[#181920] border border-[#2a2c35] rounded-xl text-xs text-[#e2e8f0] leading-relaxed shadow-sm whitespace-pre-wrap">
              {msg.content}
            </div>

            {/* Message Action Bar (Copy, Thumbs Up/Down - Matches Image 2) */}
            <div className="flex items-center justify-end gap-3 text-muted text-2xs px-1 select-none">
              <span className="text-muted font-mono">{msg.role === 'user' ? 'You' : 'Antigravity'}</span>
              <button className="hover:text-text cursor-pointer p-0.5" title="Copy text">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="hover:text-text cursor-pointer p-0.5" title="Helpful">
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button className="hover:text-text cursor-pointer p-0.5" title="Unhelpful">
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="p-3 rounded-lg bg-[#181920] border border-border text-xs text-muted flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Sedang memproses instruksi menggunakan {currentModel.displayName}...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Integrated Terminal Dock (User requested: "tapi saya suka fitur integrated terminalnya") */}
      {terminalOpen && (
        <div className="absolute bottom-32 left-6 right-6 z-30 bg-[#0d0e12] border border-[#2c2e38] rounded-xl shadow-2xl flex flex-col h-56 font-mono text-xs overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#16171d] border-b border-[#242630] select-none">
            <div className="flex items-center gap-2 text-2xs text-[#e2e8f0] font-semibold">
              <Terminal className="w-3.5 h-3.5 text-accent-text" />
              <span>Integrated Terminal (PowerShell — Host Local Access)</span>
              {turboMode && (
                <span className="text-2xs bg-turbo-bg text-turbo px-1.5 py-0.2 rounded font-semibold border border-turbo/40">
                  ⚡ Turbo Native
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearTerminal} className="text-muted hover:text-text p-1" title="Clear">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="flex-1 p-3 overflow-y-auto text-2xs flex flex-col gap-1 leading-relaxed">
            {terminalLines.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.type === 'input'
                    ? 'text-accent-text font-semibold'
                    : line.type === 'error'
                    ? 'text-danger-text'
                    : line.type === 'system'
                    ? 'text-muted italic'
                    : 'text-[#e2e8f0]'
                }
              >
                {line.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input */}
          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 px-3 py-1.5 bg-[#16171d] border-t border-[#242630]">
            <span className="text-turbo font-bold">{turboMode ? '⚡' : '$'}</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Jalankan perintah PowerShell (e.g. dir, git status, npm run)..."
              className="flex-1 bg-transparent text-[#e2e8f0] text-2xs focus:outline-none"
            />
          </form>
        </div>
      )}

      {/* Floating Prompt Bar at Bottom (Exact replica of Image 2) */}
      <div className="absolute bottom-5 left-0 right-0 px-6 max-w-4xl mx-auto z-40 select-none">
        <div className="bg-[#181920] border border-[#2a2c35] rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5 transition-all focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
          {/* Text Input Area */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(e);
              }
            }}
            placeholder="Tulis instruksi atau coding prompt..."
            rows={2}
            className="w-full bg-transparent text-xs text-[#e2e8f0] placeholder:text-[#6a6f80] focus:outline-none resize-none leading-relaxed font-ui"
          />

          {/* Bottom Controls Row inside the Floating Pill (Matches Image 2) */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Plus Button */}
              <button
                type="button"
                className="w-7 h-7 rounded-lg hover:bg-[#252733] text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors"
                title="Attach context or files"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Model Selector Dropdown Button (Matches Image 2: "Gemini 3.8 Flash High ^") */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#252733] text-xs text-[#cfd4e2] font-medium cursor-pointer transition-colors"
                >
                  <span>{currentModel.displayName}</span>
                  <span className="text-2xs text-muted">^</span>
                </button>

                {/* Dropdown Options */}
                {modelDropdownOpen && (
                  <div className="absolute bottom-9 left-0 w-64 bg-[#181920] border border-[#2a2c35] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-2xs font-bold text-muted px-2 py-1 uppercase tracking-wider border-b border-[#242732]">
                      Ganti Model AI (Bebas Ganti Kapan Saja)
                    </div>
                    {models.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setActiveModel(m.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex justify-between items-center transition-colors ${
                          activeModelId === m.id
                            ? 'bg-accent/20 text-accent-text font-semibold'
                            : 'hover:bg-[#22242e] text-[#cfd4e2]'
                        }`}
                      >
                        <span>{m.displayName}</span>
                        <span className="text-2xs uppercase text-muted font-mono">{m.provider}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Turbo Toggle Button (Matches Image 2: "Turbo ^") */}
              <button
                type="button"
                onClick={() => setTurboMode(!turboMode)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                  turboMode ? 'text-turbo font-semibold' : 'text-muted hover:text-text'
                }`}
                title="Turbo Mode: Full Local Hardware & Filesystem Access"
              >
                <Zap className={`w-3.5 h-3.5 ${turboMode ? 'fill-turbo text-turbo' : ''}`} />
                <span>Turbo</span>
                <span className="text-2xs">^</span>
              </button>

              {/* Microphone Icon */}
              <button
                type="button"
                className="text-muted hover:text-text p-1 cursor-pointer transition-colors"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Blue Circular Send Button with Up Arrow (Matches Image 2) */}
              <button
                type="button"
                onClick={handleSendPrompt}
                disabled={!prompt.trim() || isStreaming}
                className="w-8 h-8 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
