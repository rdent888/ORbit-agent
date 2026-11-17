import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { ModelAccount } from "../../lib/api";
import { useChatStore } from "../../stores/chatStore";
import { Key, Plus, Trash2, CheckCircle2, XCircle, DownloadCloud, Layers } from "lucide-react";

export const ModelAccountManager: React.FC = () => {
  const { fetchModelConfigs, modelConfigs } = useChatStore();
  const [accounts, setAccounts] = useState<ModelAccount[]>([]);
  const [provider, setProvider] = useState("gemini");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [priority, setPriority] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  // Custom Model form
  const [customModelId, setCustomModelId] = useState("");
  const [customDisplayName, setCustomDisplayName] = useState("");
  const [customProvider, setCustomProvider] = useState("bansosai");
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/api/model-accounts");
      setAccounts(res.data);
    } catch (e) {
      console.error("fetchAccounts error", e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchModelConfigs();
  }, []);

  // When provider changes, auto-fill base URL for bansosai / hermes / ollama
  const handleProviderChange = (newP: string) => {
    setProvider(newP);
    if (newP === "hermes") {
      setBaseUrl("http://127.0.0.1:8645/v1");
      if (!label) setLabel("Hermes Agent (Local PC / Nous Portal)");
      if (!apiKey) setApiKey("hermes-local");
    } else if (newP === "bansosai") {
      setBaseUrl("https://api.bansosai.app/v1");
      if (!label) setLabel("BansosAI (Free 2M Tokens)");
    } else if (newP === "ollama") {
      setBaseUrl("http://localhost:11434/v1");
      if (!label) setLabel("Local Ollama");
    } else if (newP === "custom") {
      if (!baseUrl) setBaseUrl("https://api.your-proxy.com/v1");
    } else {
      setBaseUrl("");
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !apiKey.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/model-accounts", {
        provider,
        account_label: label.trim(),
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || null,
        priority: Number(priority),
        token_limit_per_day: Number(tokenLimit),
      });
      setLabel("");
      setApiKey("");
      await fetchAccounts();
    } catch (e: any) {
      alert("Failed to add account: " + (e?.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this account?")) return;
    try {
      await api.delete(`/api/model-accounts/${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
    } catch (e) {
      console.error("delete account failed", e);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.post(`/api/model-accounts/${id}/test`);
      if (res.data.ok) {
        setTestResult({ id, ok: true, msg: "Verified & Working!" });
      } else {
        setTestResult({ id, ok: false, msg: res.data.error || "Failed" });
      }
    } catch (e: any) {
      setTestResult({ id, ok: false, msg: e?.response?.data?.detail || "Network error" });
    } finally {
      setTestingId(null);
    }
  };

  // Auto fetch models from provider /models endpoint
  const handleFetchModels = async () => {
    if (!apiKey.trim()) {
      alert("Please enter the API Key first.");
      return;
    }
    const targetUrl = baseUrl.trim() || (provider === "bansosai" ? "https://api.bansosai.app/v1" : "");
    if (!targetUrl) {
      alert("Please provide the Base URL for this provider.");
      return;
    }

    setFetchingModels(true);
    setFetchMsg(null);
    try {
      const res = await api.post("/api/model-accounts/fetch-models", {
        base_url: targetUrl,
        api_key: apiKey.trim(),
        provider_label: provider,
      });
      setFetchMsg(`✔ Berhasil mengimpor ${res.data.imported_count} model dari ${provider}!`);
      await fetchModelConfigs();
    } catch (e: any) {
      setFetchMsg(`✖ Gagal mengambil model: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleAddCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelId.trim()) return;
    try {
      await api.post("/api/model-configs", {
        display_name: customDisplayName.trim() || customModelId.trim(),
        provider: customProvider,
        model_id: customModelId.trim(),
        context_window: 128000,
      });
      setCustomModelId("");
      setCustomDisplayName("");
      await fetchModelConfigs();
      alert("Model berhasil ditambahkan ke dropdown!");
    } catch (e: any) {
      alert("Gagal menambahkan model: " + (e?.response?.data?.detail || e.message));
    }
  };

  const handleDeleteModel = async (cfgId: string) => {
    if (cfgId === "auto") {
      alert("Model Auto Router sistem tidak dapat dihapus.");
      return;
    }
    if (!confirm("Hapus model ini dari daftar?")) return;
    try {
      await api.delete(`/api/model-configs/${cfgId}`);
      await fetchModelConfigs();
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message);
    }
  };

  return (
    <div className="p-6 text-zinc-200 overflow-y-auto max-h-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-100">Multi-Account & Custom API Gateway</h3>
          <p className="text-xs text-zinc-400">
            Hubungkan API dari Google Gemini, BansosAI, OpenAI, Claude, atau custom OpenAI-compatible proxy.
          </p>
        </div>
      </div>

      {/* Add Account Form */}
      <form onSubmit={handleAddAccount} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-400" />
          Tambah Akun / Provider AI
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Penyedia Layanan (Provider)</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
            >
              <option value="gemini">Google Gemini (Free tier friendly)</option>
              <option value="bansosai">bansosAI (Proxy 2M Kuota Gratis)</option>
              <option value="hermes">☤ Hermes Agent (Local PC / Nous Portal)</option>
              <option value="custom">Custom OpenAI-compatible Proxy (OneAPI, NewAPI)</option>
              <option value="claude">Anthropic Claude</option>
              <option value="openai">OpenAI Resmi (GPT-4o)</option>
              <option value="openrouter">OpenRouter (DeepSeek / Multi-model)</option>
              <option value="ollama">Ollama (Lokal PC)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Nama / Label Akun</label>
            <input
              type="text"
              placeholder="e.g. BansosAI Akun 1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
              required
            />
          </div>

          {/* Base URL (visible for custom, bansosai, ollama) */}
          {(provider === "bansosai" || provider === "custom" || provider === "ollama") && (
            <div className="md:col-span-2">
              <label className="block text-[11px] text-zinc-400 mb-1">
                Base URL Endpoint (OpenAI-compatible)
              </label>
              <input
                type="text"
                placeholder="https://api.bansosai.app/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-[11px] text-zinc-400 mb-1">API Key</label>
            <input
              type="password"
              placeholder="Masukkan API Key kamu (disimpan terenkripsi aman secara lokal)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Prioritas (0 = dipakai pertama, 1 = cadangan)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Batas Token Harian (0 = tanpa batas)</label>
            <input
              type="number"
              value={tokenLimit}
              onChange={(e) => setTokenLimit(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{loading ? "Menyimpan..." : "Simpan ke Pool Akun"}</span>
          </button>

          {(provider === "bansosai" || provider === "custom") && (
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={fetchingModels || !apiKey.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              title="Ambil dan daftarkan semua model yang didukung oleh provider ini secara otomatis"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>{fetchingModels ? "Mengambil Model..." : "Ambil Model dari Provider"}</span>
            </button>
          )}
        </div>

        {fetchMsg && (
          <div className="text-xs font-mono p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
            {fetchMsg}
          </div>
        )}
      </form>

      {/* Account Pool List */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
          Akun API Terdaftar ({accounts.length})
        </h4>

        {accounts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            Belum ada akun API. Tambahkan API key Gemini atau BansosAI kamu di atas!
          </div>
        ) : (
          <div className="space-y-2.5">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-300">
                    {acc.provider.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{acc.account_label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Priority: {acc.priority}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        {acc.provider}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      Key: {acc.api_key_masked} • Hari Ini: {acc.tokens_used_today.toLocaleString()} tokens
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {testResult && testResult.id === acc.id && (
                    <span
                      className={`text-[11px] font-medium flex items-center gap-1 ${
                        testResult.ok ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {testResult.msg}
                    </span>
                  )}

                  <button
                    onClick={() => handleTest(acc.id)}
                    disabled={testingId === acc.id}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                  >
                    {testingId === acc.id ? "Testing..." : "Test Key"}
                  </button>

                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model Catalog / Available Models in Dropdown */}
      <div className="pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Daftar Model AI untuk Chat ({modelConfigs.length})
          </h4>
        </div>

        {/* Quick Add Custom Model Form */}
        <form onSubmit={handleAddCustomModel} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 mb-4 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Model ID (e.g. gpt-4o, claude-3-5-sonnet, deepseek-r1)"
            value={customModelId}
            onChange={(e) => setCustomModelId(e.target.value)}
            className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none font-mono"
            required
          />
          <input
            type="text"
            placeholder="Nama Tampilan (opsional)"
            value={customDisplayName}
            onChange={(e) => setCustomDisplayName(e.target.value)}
            className="w-44 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
          />
          <select
            value={customProvider}
            onChange={(e) => setCustomProvider(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 outline-none"
          >
            <option value="hermes">hermes</option>
            <option value="bansosai">bansosai</option>
            <option value="gemini">gemini</option>
            <option value="openai">openai</option>
            <option value="claude">claude</option>
            <option value="custom">custom</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Tambah Model
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {modelConfigs.map((cfg) => (
            <div
              key={cfg.id}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                cfg.id === "auto"
                  ? "bg-indigo-950/40 border-indigo-700/60 text-indigo-200"
                  : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300"
              }`}
            >
              <div className="truncate pr-2">
                <span className="font-semibold block truncate">{cfg.display_name}</span>
                <span className="text-[10px] font-mono text-zinc-500 truncate block">
                  {cfg.model_id} [{cfg.provider}]
                </span>
              </div>
              {cfg.id !== "auto" && (
                <button
                  onClick={() => handleDeleteModel(cfg.id)}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
                  title="Hapus Model"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
