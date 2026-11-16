import React, { useState } from 'react';
import { useIDEStore } from '../../engine/store';
import { Shield, Zap, Plus, Trash2 } from 'lucide-react';
import { Button } from '../primitives/Button';
import { Badge } from '../primitives/Badge';

export const SettingsPanel: React.FC = () => {
  const { turboMode, setTurboMode, permissionRules, addPermissionRule, removePermissionRule } =
    useIDEStore();

  const [toolName, setToolName] = useState('fs.write');
  const [pattern, setPattern] = useState('**/*');
  const [action, setAction] = useState<'allow' | 'deny' | 'ask'>('allow');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    addPermissionRule({ toolName, pattern, action });
  };

  return (
    <div className="flex flex-col h-full bg-surface-raised border-r border-border p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Shield className="w-4 h-4 text-accent-text" />
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Security & Hardware Permissions
        </h2>
      </div>

      {/* Turbo Mode Card */}
      <div className="my-4 p-3.5 bg-surface border border-turbo/40 rounded-xl shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-turbo fill-turbo animate-pulse" />
            <div>
              <div className="text-xs font-bold text-text">Turbo Mode Engine</div>
              <div className="text-2xs text-muted">Akses Penuh Perangkat & Local Filesystem</div>
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

        <p className="text-2xs text-text/80 leading-relaxed">
          {turboMode ? (
            <span className="text-turbo font-medium">
              ⚡ AKTIF: Agent memiliki akses membaca/menulis ke seluruh direktori lokal Anda dan menjalankan perintah shell secara native tanpa isolasi sandbox.
            </span>
          ) : (
            <span>
              STANDAR: Agent dibatasi hanya pada workspace direktori aktif dan membutuhkan konfirmasi untuk perubahan file di luar proyek.
            </span>
          )}
        </p>
      </div>

      {/* Permission Rules (Safety Overlay) */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text">Aturan Izin Akses (Rules Overlay):</span>
          <Badge variant="default">{permissionRules.length} Rules</Badge>
        </div>
        <p className="text-2xs text-muted">
          Aturan di bawah ini akan diutamakan di atas pengaturan Turbo Mode default.
        </p>

        {/* Rules List */}
        <div className="flex flex-col gap-2 mt-2">
          {permissionRules.map((rule) => (
            <div
              key={rule.id}
              className="p-2.5 bg-surface border border-border rounded-lg flex items-center justify-between text-xs"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-text">{rule.toolName}</span>
                  <span className="text-muted">({rule.pattern})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {rule.action === 'allow' && <Badge variant="success">Allow</Badge>}
                {rule.action === 'deny' && <Badge variant="danger">Deny</Badge>}
                {rule.action === 'ask' && <Badge variant="warning">Prompt User</Badge>}
                <button
                  onClick={() => removePermissionRule(rule.id)}
                  className="p-1 text-muted hover:text-danger-text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Rule Form */}
        <form onSubmit={handleAddRule} className="mt-4 p-3 bg-surface border border-border-input rounded-lg flex flex-col gap-2 text-xs">
          <span className="font-semibold text-2xs uppercase tracking-wider text-text">
            Tambah Rule Spesifik
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-muted block mb-1">Tool:</label>
              <select
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full bg-surface-raised border border-border-input rounded px-2 py-1 text-xs text-text"
              >
                <option value="fs.read">fs.read</option>
                <option value="fs.write">fs.write</option>
                <option value="terminal.exec">terminal.exec</option>
                <option value="*">Semua Tools (*)</option>
              </select>
            </div>
            <div>
              <label className="text-2xs text-muted block mb-1">Aksi:</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as 'allow' | 'deny' | 'ask')}
                className="w-full bg-surface-raised border border-border-input rounded px-2 py-1 text-xs text-text"
              >
                <option value="allow">Allow Otomatis</option>
                <option value="ask">Ask / Minta Izin</option>
                <option value="deny">Deny / Blokir</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-2xs text-muted block mb-1">Glob Pattern:</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-surface-raised border border-border-input rounded px-2.5 py-1 text-xs text-text font-mono"
            />
          </div>
          <Button size="sm" variant="secondary" type="submit" className="mt-1">
            <Plus className="w-3 h-3" /> Pasang Rule
          </Button>
        </form>
      </div>
    </div>
  );
};
