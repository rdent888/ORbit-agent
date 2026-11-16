import React, { useState } from 'react';
import { useIDEStore } from '../../engine/store';
import { X, Key, Plus, Trash2, Cpu, CheckCircle } from 'lucide-react';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    accounts,
    updateAccountApiKey,
    saveAccount,
    removeAccount,
    turboMode,
    setTurboMode,
  } = useIDEStore();

  const [activeTab, setActiveTab] = useState<'keys' | 'turbo'>('keys');

  // New custom key inputs
  const [googleKey, setGoogleKey] = useState(
    accounts.find((a) => a.provider === 'google')?.apiKey || ''
  );
  const [anthropicKey, setAnthropicKey] = useState(
    accounts.find((a) => a.provider === 'anthropic')?.apiKey || ''
  );
  const [openaiKey, setOpenaiKey] = useState(
    accounts.find((a) => a.provider === 'openai')?.apiKey || ''
  );

  const [newLabel, setNewLabel] = useState('');
  const [newProvider, setNewProvider] = useState<'google' | 'anthropic' | 'openai' | 'custom'>('google');
  const [newKey, setNewKey] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!settingsModalOpen) return null;

  const handleSaveStandardKeys = () => {
    updateAccountApiKey('google', googleKey.trim());
    updateAccountApiKey('anthropic', anthropicKey.trim());
    updateAccountApiKey('openai', openaiKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddCustomAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newKey) return;
    saveAccount({
      label: newLabel,
      provider: newProvider,
      apiKey: newKey,
      priorityOrder: accounts.length + 1,
      quotaLimit: 0,
      supportedModelIds:
        newProvider === 'google'
          ? ['google/gemini-3.8-flash-high', 'google/gemini-2.5-pro']
          : newProvider === 'anthropic'
          ? ['anthropic/claude-3-7-sonnet']
          : ['openai/gpt-4o', 'openai/o3-mini'],
    });
    setNewLabel('');
    setNewKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-2xl bg-surface border border-border-input rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-raised border-b border-border">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-text" />
            <h3 className="font-semibold text-text text-base">Antigravity Settings & AI API Keys</h3>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="text-muted hover:text-text p-1 rounded hover:bg-surface cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border bg-bg-sidebar px-5 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('keys')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'keys'
                ? 'border-accent text-accent-text font-semibold'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            AI Providers & BYOK Keys
          </button>
          <button
            onClick={() => setActiveTab('turbo')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'turbo'
                ? 'border-turbo text-turbo font-semibold'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Turbo Mode & Local Device Access
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto text-xs">
          {activeTab === 'keys' && (
            <div className="flex flex-col gap-4">
              <p className="text-muted text-2xs leading-relaxed">
                Hubungkan API Key Anda sendiri (BYOK). Anda dapat memasukkan banyak akun sekaligus agar kuota token tidak pernah habis dan Anda tidak perlu berlangganan ke Google Antigravity. Kredensial disimpan secara lokal di mesin Anda.
              </p>

              {/* Standard Providers */}
              <div className="flex flex-col gap-3 p-3.5 bg-bg border border-border rounded-lg">
                <div className="font-semibold text-text flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-warning" />
                  <span>Kredensial Akun Utama:</span>
                </div>

                <div>
                  <label className="text-2xs text-muted block mb-1">
                    Google AI Studio API Key (Gemini 3.8 Flash & 2.5 Pro):
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={googleKey}
                    onChange={(e) => setGoogleKey(e.target.value)}
                    className="w-full bg-surface-raised border border-border-input rounded px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-2xs text-muted block mt-0.5">
                    Dapatkan gratis di: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent-text hover:underline">aistudio.google.com</a>
                  </span>
                </div>

                <div>
                  <label className="text-2xs text-muted block mb-1">
                    Anthropic API Key (Claude 3.7 Sonnet):
                  </label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="w-full bg-surface-raised border border-border-input rounded px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="text-2xs text-muted block mb-1">
                    OpenAI API Key (GPT-4o & o3-mini):
                  </label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-surface-raised border border-border-input rounded px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedNotice && (
                    <span className="text-success text-2xs flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> API Keys Berhasil Disimpan!
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveStandardKeys}
                    className="ml-auto"
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </div>

              {/* Add Extra Account for Quota Pooling */}
              <div className="p-3.5 bg-bg border border-border rounded-lg flex flex-col gap-2.5">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-accent-text" />
                  <span>Tambah Akun Tambahan (Banyak Akun Sekaligus):</span>
                </span>
                <form onSubmit={handleAddCustomAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Akun Google #2)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="bg-surface-raised border border-border-input rounded px-2.5 py-1 text-xs text-text focus:outline-none"
                    required
                  />
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as any)}
                    className="bg-surface-raised border border-border-input rounded px-2 py-1 text-xs text-text focus:outline-none"
                  >
                    <option value="google">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom / Ollama</option>
                  </select>
                  <input
                    type="password"
                    placeholder="API Key"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="bg-surface-raised border border-border-input rounded px-2.5 py-1 text-xs text-text font-mono focus:outline-none"
                    required
                  />
                  <div className="sm:col-span-3 flex justify-end">
                    <Button size="sm" variant="secondary" type="submit">
                      Tambah ke Pool
                    </Button>
                  </div>
                </form>
              </div>

              {/* Connected Accounts List */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-muted text-2xs uppercase tracking-wider">
                  Daftar Akun Terdaftar ({accounts.length})
                </span>
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">{acc.provider.toUpperCase()}</Badge>
                      <span className="text-text font-medium">{acc.label}</span>
                      <span className="text-2xs text-muted font-mono">
                        {acc.apiKey ? '••••••••' + acc.apiKey.slice(-4) : '(Belum ada key)'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeAccount(acc.id)}
                      className="p-1 text-muted hover:text-danger-text cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'turbo' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-surface border border-turbo/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-text text-sm">Turbo Mode Access</div>
                  <div className="text-2xs text-muted">
                    Eksekusi terminal native dan akses baca/tulis langsung ke file lokal tanpa sandbox.
                  </div>
                </div>
                <button
                  onClick={() => setTurboMode(!turboMode)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    turboMode ? 'bg-turbo' : 'bg-surface-raised border border-border'
                  }`}
                >
                  <div
                    className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      turboMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-bg border border-border rounded-lg flex flex-col gap-2">
                <span className="font-semibold text-text">Workspace Path:</span>
                <span className="text-2xs font-mono bg-surface p-2 rounded border border-border text-accent-text">
                  E:\.VSCODE\project clone antigravity
                </span>
                <span className="text-2xs text-muted">
                  Perintah yang dijalankan di terminal akan berjalan langsung pada direktori ini menggunakan PowerShell host.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-surface-raised border-t border-border">
          <Button variant="primary" size="sm" onClick={() => setSettingsModalOpen(false)}>
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
};
