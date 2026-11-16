import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../engine/store';
import { Send, Sparkles, RefreshCw, Layers, Zap, AlertCircle } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';
import { Button } from '../primitives/Button';
import { StatusDot } from '../primitives/StatusDot';
import { clsx } from 'clsx';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    sendMessage,
    isStreaming,
    sessions,
    activeSessionId,
    models,
    activeModelId,
    turboMode,
    setResumeDialogOpen,
    compactCurrentSession,
  } = useIDEStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId);
  const currentModel = models.find((m) => m.id === activeModelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const isTokenLimit = currentSession?.status === 'token_limit';

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border relative select-text">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-raised border-b border-border select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-text" />
          <span className="font-semibold text-text text-xs truncate max-w-[160px]">
            {currentSession?.title || 'Coding Agent'}
          </span>
          <StatusDot
            status={isStreaming ? 'thinking' : isTokenLimit ? 'error' : 'idle'}
            label={isStreaming ? 'Thinking...' : isTokenLimit ? 'Paused (Quota)' : 'Ready'}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {isTokenLimit && (
            <Button
              size="sm"
              variant="turbo"
              onClick={() => setResumeDialogOpen(true)}
              className="text-xs h-6 px-2 animate-bounce"
            >
              <RefreshCw className="w-3 h-3" /> Resume
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={compactCurrentSession}
            title="Compact Context Memory"
            className="text-xs h-6 px-2 text-muted hover:text-text"
          >
            <Layers className="w-3 h-3" /> Compact
          </Button>
        </div>
      </div>

      {/* Token Limit Alert Banner (S17) */}
      {isTokenLimit && (
        <div className="px-3.5 py-2 bg-warning-bg border-b border-warning/40 text-warning text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
            <span>
              Sesi terhenti karena kuota token limit. Tekan <strong>Resume</strong> untuk lanjut dengan model lain.
            </span>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setResumeDialogOpen(true)}
            className="bg-warning text-black font-semibold text-2xs h-6 px-2.5 hover:bg-warning/90"
          >
            Resume Sesi
          </Button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex flex-col gap-1 max-w-[95%]',
              msg.role === 'user' ? 'self-end items-end' : 'self-start items-start w-full'
            )}
          >
            {/* Header info */}
            <div className="flex items-center gap-2 text-2xs text-muted px-1">
              <span className="font-semibold uppercase">
                {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Antigravity Agent'}
              </span>
              {msg.modelId && (
                <span className="bg-surface-raised px-1.5 py-0.2 rounded font-mono text-accent-text">
                  {msg.modelId.split('/')[1] || msg.modelId}
                </span>
              )}
              {msg.tokensUsed > 0 && <span>• {msg.tokensUsed} tokens</span>}
            </div>

            {/* Bubble */}
            <div
              className={clsx(
                'rounded-lg p-3 text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-accent text-on-accent'
                  : msg.role === 'system'
                  ? 'bg-surface-raised border border-border text-text font-mono w-full'
                  : 'bg-surface border border-border text-text shadow-sm w-full'
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Artifacts (Plans, Diffs, Code) */}
              {msg.artifacts && msg.artifacts.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {msg.artifacts.map((art) => (
                    <ArtifactCard key={art.id} artifact={art} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-muted p-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-accent-text animate-spin" />
            <span>Agent sedang bernalar dan menyiapkan diff kode...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-surface-raised border-t border-border flex flex-col gap-2 select-none">
        {/* Turbo Mode Indicator */}
        <div className="flex items-center justify-between text-2xs text-muted px-1">
          <div className="flex items-center gap-1.5">
            <Zap className={clsx('w-3 h-3', turboMode ? 'text-turbo fill-turbo' : 'text-muted')} />
            <span className={turboMode ? 'text-turbo font-semibold' : ''}>
              {turboMode ? 'Turbo Mode: Full Local Device & Terminal Access Active' : 'Sandboxed Mode'}
            </span>
          </div>
          <span className="font-mono">{currentModel?.displayName}</span>
        </div>

        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={
              turboMode
                ? "Beri instruksi coding (e.g. 'implementasi failover API key' atau 'run test di local')..."
                : "Tulis prompt coding..."
            }
            rows={2}
            className="flex-1 bg-surface border border-border-input rounded-md px-3 py-2 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none font-ui"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isStreaming}
            className="h-full px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
