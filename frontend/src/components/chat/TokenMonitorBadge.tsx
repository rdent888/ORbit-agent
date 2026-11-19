import React, { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { useChatStore } from "../../stores/chatStore";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Server,
  KeyRound,
  ChevronDown,
} from "lucide-react";

interface AccountMonitor {
  id: string;
  provider: string;
  account_label: string;
  is_active: boolean;
  priority: number;
  tokens_used_today: number;
  token_limit_per_day: number;
  pct_used: number;
  status: "healthy" | "warning" | "exhausted" | "inactive";
  last_used_at: string | null;
}

interface ModelMonitor {
  id: string;
  display_name: string;
  provider: string;
  model_id: string;
  context_window: number;
  is_available: boolean;
  status: "online" | "offline";
}

interface MonitorData {
  summary: {
    total_models: number;
    online_models: number;
    total_tokens_today: number;
    active_accounts: number;
    timestamp: string;
  };
  accounts: AccountMonitor[];
  models: ModelMonitor[];
}

export const TokenMonitorBadge: React.FC = () => {
  const [data, setData] = useState<MonitorData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { setSelectedModelId, selectedModelId } = useChatStore();

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/monitor/realtime");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch monitor status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh poll every 12 seconds
    const interval = setInterval(fetchStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!data) return null;

  const onlineModels = data.summary.online_models;
  const totalModels = data.summary.total_models;
  const totalTokens = data.summary.total_tokens_today;

  // Format token count: 1200 -> 1.2k
  const formatTokens = (val: number) => {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
    if (val >= 1_000) return (val / 1_000).toFixed(1) + "k";
    return val.toString();
  };

  const filteredModels =
    filterProvider === "all"
      ? data.models.filter((m) => m.id !== "auto")
      : data.models.filter((m) => m.provider === filterProvider && m.id !== "auto");

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Real-time Indicator Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all shadow-sm group"
        title="Klik untuk memonitor token limit & ketersediaan model real-time"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        <span className="text-zinc-300 font-medium">
          {onlineModels}/{totalModels} Ready
        </span>

        <span className="text-zinc-600">|</span>

        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          {formatTokens(totalTokens)} tok
        </span>

        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel — anchored below the pill, capped height so it never covers chat */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-[400px] max-w-[calc(100vw-2rem)] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[60] overflow-hidden flex flex-col text-xs" style={{ maxHeight: "min(460px, calc(100vh - 120px))" }}>
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-zinc-200">Real-Time Model & Token Monitor</span>
            </div>
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
              title="Perbarui status sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>

          <div className="max-h-[460px] overflow-y-auto p-3 space-y-3.5">
            {/* Account Quota Cards */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                <span>Akun & Kuota Harian</span>
              </div>
              <div className="space-y-2">
                {data.accounts.map((acc) => {
                  const isHealthy = acc.status === "healthy";
                  const isWarning = acc.status === "warning";
                  return (
                    <div
                      key={acc.id}
                      className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isHealthy ? "bg-emerald-400" : isWarning ? "bg-amber-400" : "bg-red-400"
                            }`}
                          />
                          <span className="font-medium text-zinc-200 truncate">{acc.account_label}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                            {acc.provider}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isHealthy
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : isWarning
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                              : "bg-red-950/60 text-red-400 border border-red-800/40"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>

                      {/* Usage progress bar if limit is set */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                          <span>Terpakai: {formatTokens(acc.tokens_used_today)} tok</span>
                          <span>
                            {acc.token_limit_per_day > 0
                              ? `Limit: ${formatTokens(acc.token_limit_per_day)} (${acc.pct_used}%)`
                              : "Free Tier / Dynamic"}
                          </span>
                        </div>
                        {acc.token_limit_per_day > 0 && (
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                acc.pct_used > 85 ? "bg-red-500" : acc.pct_used > 60 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, acc.pct_used)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Hermes Local Engine Card */}
                <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-medium text-zinc-200">☤ Hermes Agent</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      Local Offline
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Zero Cost / Unlimited</span>
                </div>
              </div>
            </div>

            {/* Model Availability Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Ketersediaan Model ({filteredModels.length})</span>
                </div>
                {/* Filter buttons */}
                <div className="flex gap-1 text-[10px]">
                  {["all", "gemini", "bansosai"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterProvider(p)}
                      className={`px-1.5 py-0.5 rounded capitalize ${
                        filterProvider === p
                          ? "bg-indigo-600 text-white font-medium"
                          : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {filteredModels.map((m) => {
                  const isSelected = selectedModelId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedModelId(m.id);
                        setIsOpen(false);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-700/60"
                          : "bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {m.is_available ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="font-medium text-zinc-200 truncate">{m.display_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">{m.model_id}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {formatTokens(m.context_window)} ctx
                        </span>
                        {isSelected && (
                          <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-mono">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3.5 py-2 border-t border-zinc-800/80 bg-zinc-900/40 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
            <span>Auto-refresh aktif tiap 12 detik</span>
            <span>Update: {new Date(data.summary.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
