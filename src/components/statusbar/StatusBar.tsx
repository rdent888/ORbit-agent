import React, { useState } from 'react';
import { useIDEStore } from '../../engine/store';
import { GitBranch, Cpu, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { TurboToggle } from '../primitives/TurboToggle';

export const StatusBar: React.FC = () => {
  const {
    models,
    accounts,
    activeModelId,
    activeAccountId,
    setActiveModel,
    sessions,
    activeSessionId,
    setResumeDialogOpen,
  } = useIDEStore();

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const currentModel = models.find((m) => m.id === activeModelId);
  const currentAccount = accounts.find((a) => a.id === activeAccountId);
  const currentSession = sessions.find((s) => s.id === activeSessionId);

  const isTokenLimit = currentSession?.status === 'token_limit';

  return (
    <div className="h-6 bg-bg-sidebar border-t border-border flex items-center justify-between px-3 text-2xs text-muted select-none z-30 relative font-ui">
      {/* Left side items */}
      <div className="flex items-center gap-3">
        {/* Git branch */}
        <div className="flex items-center gap-1 hover:text-text cursor-pointer">
          <GitBranch className="w-3 h-3 text-accent-text" />
          <span>master*</span>
        </div>

        {/* Turbo Mode Pill */}
        <TurboToggle />

        {/* Interrupted Session quick alert */}
        {isTokenLimit && (
          <div
            onClick={() => setResumeDialogOpen(true)}
            className="flex items-center gap-1 text-warning bg-warning-bg px-2 py-0.5 rounded cursor-pointer border border-warning/40 animate-pulse font-semibold"
          >
            <AlertCircle className="w-3 h-3" />
            <span>Sesi Terhenti: Resume Tersedia</span>
            <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
          </div>
        )}
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-3">
        {/* Active Account & Token Quota Indicator */}
        {currentAccount && (
          <div className="flex items-center gap-1.5 font-mono text-2xs">
            <Key className="w-3 h-3 text-warning" />
            <span className="text-text font-medium truncate max-w-[140px]">{currentAccount.label}</span>
            <span className="text-muted">
              ({(currentAccount.quotaUsed / 1000).toFixed(0)}k
              {currentAccount.quotaLimit > 0 ? ` / ${(currentAccount.quotaLimit / 1000).toFixed(0)}k` : ''} tok)
            </span>
          </div>
        )}

        {/* Model Selector Dropdown Button (S04) */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface text-text font-medium cursor-pointer transition-colors"
          >
            <Cpu className="w-3 h-3 text-accent-text" />
            <span>{currentModel?.displayName || 'Select Model'}</span>
            <span className="text-muted text-2xs">▼</span>
          </button>

          {/* S04 Dropdown Menu */}
          {modelDropdownOpen && (
            <div className="absolute bottom-7 right-0 w-64 bg-surface border border-border-input rounded-lg shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-2xs font-bold text-muted px-2 py-1 uppercase tracking-wider border-b border-border">
                Ganti Model AI Aktif (BYOK)
              </div>
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    setActiveModel(model.id);
                    setModelDropdownOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded text-xs cursor-pointer flex flex-col transition-colors ${
                    activeModelId === model.id
                      ? 'bg-accent/20 text-accent-text font-semibold'
                      : 'hover:bg-surface-raised text-text'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{model.displayName}</span>
                    <span className="text-2xs uppercase text-muted font-mono">{model.provider}</span>
                  </div>
                  <div className="text-2xs text-muted font-mono">
                    Context: {(model.contextWindow / 1000).toFixed(0)}k tokens
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Encoding & Formatting */}
        <span className="hidden sm:inline">UTF-8</span>
      </div>
    </div>
  );
};
