import React, { useState } from 'react';
import { useIDEStore } from '../../engine/store';
import { Plus, Key, Trash2, Shield } from 'lucide-react';
import { Button } from '../primitives/Button';
import { ProgressBar } from '../primitives/ProgressBar';
import { Badge } from '../primitives/Badge';
import { ProviderType } from '../../types';

export const AccountManagerPanel: React.FC = () => {
  const { accounts, addAccount, removeAccount, activeAccountId, setActiveAccount } = useIDEStore();
  const [showAddForm, setShowAddForm] = useState(false);

  // New Account Form State
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState<ProviderType>('google');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [priorityOrder, setPriorityOrder] = useState<number>(accounts.length + 1);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !apiKey.trim()) return;

    const supportedModelIds =
      provider === 'google'
        ? ['google/gemini-2.5-flash', 'google/gemini-2.5-pro']
        : provider === 'anthropic'
        ? ['anthropic/claude-3-7-sonnet', 'anthropic/claude-3-5-haiku']
        : ['openai/gpt-4o', 'openai/o3-mini'];

    addAccount({
      label,
      provider,
      apiKey,
      baseUrl: baseUrl.trim() || undefined,
      priorityOrder: Number(priorityOrder),
      quotaLimit: provider === 'google' ? 1000000 : 500000,
      supportedModelIds,
    });

    setLabel('');
    setApiKey('');
    setBaseUrl('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col h-full bg-surface-raised border-r border-border p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-warning" />
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
            BYOK Multi-Account Pool
          </h2>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-2xs h-6 px-2"
        >
          <Plus className="w-3 h-3" /> Tambah Akun
        </Button>
      </div>

      <p className="text-2xs text-muted mt-2 leading-relaxed">
        Tambahkan banyak akun AI (Google AI Studio, Anthropic, OpenAI, custom). Sistem akan menggabungkan kuota token dan melakukan failover otomatis saat rate limit 429 terjadi.
      </p>

      {/* Add Account Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAddAccount} className="my-3 p-3 bg-surface border border-border-input rounded-lg flex flex-col gap-2.5 text-xs">
          <div className="font-semibold text-text text-2xs uppercase tracking-wider">
            Tambah Kredensial AI Baru
          </div>
          <div>
            <label className="text-2xs text-muted block mb-1">Nama / Label Akun:</label>
            <input
              type="text"
              placeholder="e.g. Akun Cadangan Google AI Studio"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-surface-raised border border-border-input rounded px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-muted block mb-1">Provider:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderType)}
                className="w-full bg-surface-raised border border-border-input rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="google">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </div>
            <div>
              <label className="text-2xs text-muted block mb-1">Priority Order:</label>
              <input
                type="number"
                value={priorityOrder}
                onChange={(e) => setPriorityOrder(Number(e.target.value))}
                className="w-full bg-surface-raised border border-border-input rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-2xs text-muted block mb-1">API Key (Tersimpan Aman di Keychain):</label>
            <input
              type="password"
              placeholder="sk-... atau AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-surface-raised border border-border-input rounded px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
              Batal
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Simpan Akun
            </Button>
          </div>
        </form>
      )}

      {/* Account List */}
      <div className="flex flex-col gap-3 mt-4">
        {accounts.map((acc) => {
          const isSelected = activeAccountId === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setActiveAccount(acc.id)}
              className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface border-accent shadow-sm ring-1 ring-accent/60'
                  : 'bg-surface border-border hover:border-border-input'
              }`}
            >
              {/* Account Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-text truncate">
                  <span className="capitalize text-accent-text font-mono">[{acc.provider}]</span>
                  <span className="truncate">{acc.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {acc.status === 'ok' && (
                    <Badge variant="success">Active</Badge>
                  )}
                  {acc.status === 'rate_limited' && (
                    <Badge variant="warning">Rate Limited</Badge>
                  )}
                  {acc.status === 'error' && (
                    <Badge variant="danger">Error</Badge>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccount(acc.id);
                    }}
                    className="p-1 text-muted hover:text-danger-text rounded ml-1"
                    title="Hapus Akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Quota Gauge */}
              <ProgressBar
                used={acc.quotaUsed}
                limit={acc.quotaLimit}
                sublabel={acc.quotaResetAt || 'Priority #' + acc.priorityOrder + ' in Auto-Rotation Pool'}
              />

              {/* Supported Models */}
              <div className="flex flex-wrap gap-1 mt-0.5">
                {acc.supportedModelIds.map((mId) => (
                  <span key={mId} className="text-2xs bg-bg px-1.5 py-0.2 rounded border border-border text-muted font-mono">
                    {mId.split('/')[1]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="mt-auto pt-4 flex items-center gap-2 text-2xs text-muted border-t border-border">
        <Shield className="w-4 h-4 text-success shrink-0" />
        <span>Kredensial dienkripsi secara lokal. Tidak pernah dikirim ke pihak ketiga atau server Antigravity resmi.</span>
      </div>
    </div>
  );
};
