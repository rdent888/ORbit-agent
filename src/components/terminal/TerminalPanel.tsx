import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../engine/store';
import { Terminal as TerminalIcon, Trash2, Zap, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const TerminalPanel: React.FC = () => {
  const { terminalLines, runTerminalCommand, clearTerminal, turboMode } = useIDEStore();
  const [commandInput, setCommandInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    runTerminalCommand(commandInput.trim());
    setCommandInput('');
  };

  return (
    <div className="flex flex-col h-48 bg-bg border-t border-border font-mono text-xs select-text">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-sidebar border-b border-border select-none">
        <div className="flex items-center gap-2 text-text font-medium text-2xs uppercase tracking-wider">
          <TerminalIcon className="w-3.5 h-3.5 text-accent-text" />
          <span>Integrated Terminal (node-pty)</span>
          {turboMode ? (
            <span className="flex items-center gap-1 text-2xs bg-turbo-bg text-turbo px-1.5 py-0.2 rounded font-semibold border border-turbo/40">
              <Zap className="w-3 h-3 fill-turbo" /> Turbo Unsandboxed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-2xs bg-surface text-muted px-1.5 py-0.2 rounded border border-border">
              <ShieldCheck className="w-3 h-3" /> Sandboxed
            </span>
          )}
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 rounded text-muted hover:text-text hover:bg-surface"
          title="Clear Terminal"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-2.5 overflow-y-auto flex flex-col gap-1 text-2xs leading-relaxed">
        {terminalLines.map((line, idx) => (
          <div
            key={idx}
            className={clsx(
              'font-mono whitespace-pre-wrap',
              line.type === 'input'
                ? 'text-accent-text font-semibold'
                : line.type === 'error'
                ? 'text-danger-text'
                : line.type === 'system'
                ? 'text-muted italic'
                : 'text-text'
            )}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Prompt */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-1 bg-surface border-t border-border">
        <span className="text-turbo font-bold">{turboMode ? '⚡' : '$'}</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder={turboMode ? "Perintah shell native (akses penuh local device)..." : "Ketik perintah shell..."}
          className="flex-1 bg-transparent text-text text-2xs font-mono focus:outline-none"
        />
      </form>
    </div>
  );
};
