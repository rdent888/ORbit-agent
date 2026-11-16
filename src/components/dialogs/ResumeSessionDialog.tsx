import React, { useState } from 'react';
import { useIDEStore } from '../../engine/store';
import { X, Play, RefreshCw, Cpu, Key, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export const ResumeSessionDialog: React.FC = () => {
  const {
    resumeDialogOpen,
    setResumeDialogOpen,
    sessions,
    activeSessionId,
    models,
    accounts,
    resumeInterruptedSession,
  } = useIDEStore();

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const [selectedModelId, setSelectedModelId] = useState<string>('google/gemini-2.5-pro');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('acc-google-1');
  const [isResuming, setIsResuming] = useState(false);

  if (!resumeDialogOpen && currentSession?.status !== 'token_limit') {
    return null;
  }

  // Filter accounts supporting the chosen model
  const compatibleAccounts = accounts.filter(
    (a) => a.supportedModelIds.includes(selectedModelId) && a.status === 'ok'
  );

  const handleResume = async () => {
    if (!currentSession) return;
    setIsResuming(true);
    await resumeInterruptedSession(currentSession.id, selectedModelId, selectedAccountId);
    setIsResuming(false);
    setResumeDialogOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-surface border border-border-input rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-raised border-b border-border">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-accent-text" />
            <h3 className="font-semibold text-text text-base">Resume Interrupted Coding Session</h3>
          </div>
          <button
            onClick={() => setResumeDialogOpen(false)}
            className="text-muted hover:text-text p-1 rounded hover:bg-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Interruption Notice */}
          <div className="p-3.5 bg-warning-bg/40 border border-warning/40 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-warning">
                Sesi Terhenti: Kuota Token Habis / Rate Limit 429
              </span>
              <p className="text-text/80 leading-relaxed">
                Anda dapat melanjutkan sesi ini secara mulus menggunakan model AI atau akun lain. Konteks percakapan, file diff, dan target akhir (goal) akan tetap dipertahankan 100%.
              </p>
            </div>
          </div>

          {/* Goal Summary */}
          <div className="p-3 bg-bg border border-border rounded-lg flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-2xs text-muted uppercase font-mono">
              <span>Goal Target Akhir (TETAP DIJAGA)</span>
              <Badge variant="accent">Protected Goal</Badge>
            </div>
            <p className="text-xs text-text font-medium leading-relaxed">
              "{currentSession?.goalText || currentSession?.title}"
            </p>
            <div className="text-2xs text-muted mt-1 flex items-center gap-2">
              <span>Token Historis: ~{currentSession?.tokenCount.toLocaleString()}</span>
              <span>•</span>
              <span>Model Asal: {currentSession?.modelId}</span>
            </div>
          </div>

          {/* New Model Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-accent-text" />
              Pilih Model AI Pengganti (Bebas Ganti Model):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    setSelectedModelId(model.id);
                    const matching = accounts.find(
                      (a) => a.supportedModelIds.includes(model.id) && a.status === 'ok'
                    );
                    if (matching) setSelectedAccountId(matching.id);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col gap-1 ${
                    selectedModelId === model.id
                      ? 'bg-accent/15 border-accent text-text ring-1 ring-accent'
                      : 'bg-surface-raised border-border text-muted hover:border-border-input hover:text-text'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text truncate">{model.displayName}</span>
                    {model.supportsThinking && <Badge variant="accent">Reasoning</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-2xs text-muted">
                    <span>Context: {(model.contextWindow / 1000).toFixed(0)}k</span>
                    <span>{model.provider.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Selection (BYOK Multi-Account) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Key className="w-4 h-4 text-warning" />
              Gunakan Token Dari Akun BYOK:
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-surface-raised border border-border-input rounded-md px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {compatibleAccounts.length > 0 ? (
                compatibleAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label} — {acc.quotaLimit > 0 ? `Sisa: ${(acc.quotaLimit - acc.quotaUsed).toLocaleString()} token` : 'Unlimited Pay-as-you-go'}
                  </option>
                ))
              ) : (
                <option value="">Tidak ada akun aktif yang support model ini (Tambah di Settings)</option>
              )}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-raised border-t border-border">
          <div className="flex items-center gap-1 text-2xs text-muted">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>State serialization: lossless recovery enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResumeDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isResuming}
              onClick={handleResume}
              className="bg-accent text-on-accent font-semibold px-4"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Lanjutkan Sesi Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
