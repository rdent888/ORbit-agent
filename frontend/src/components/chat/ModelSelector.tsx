import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chatStore";
import {
  Brain,
  ChevronDown,
  Sliders,
  Sparkles,
  Search,
  Check,
  Zap,
  Server,
  Layers,
} from "lucide-react";

export const ModelSelector: React.FC = () => {
  const {
    modelConfigs,
    selectedModelId,
    setSelectedModelId,
    thinkingLevel,
    setThinkingLevel,
    activeRoutingInfo,
    fetchModelConfigs,
  } = useChatStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchModelConfigs();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      // Auto focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const activeConfig = modelConfigs.find((c) => c.id === selectedModelId);
  const isAuto = selectedModelId === "auto";
  const isGemini = activeConfig?.provider === "gemini";

  // Filter models
  const filteredModels = modelConfigs.filter((m) => {
    // Tab filter
    if (selectedTab !== "all") {
      if (selectedTab === "auto" && m.provider !== "auto") return false;
      if (selectedTab === "gemini" && m.provider !== "gemini") return false;
      if (selectedTab === "bansosai" && m.provider !== "bansosai") return false;
      if (selectedTab === "hermes" && m.provider !== "hermes") return false;
    }
    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.display_name.toLowerCase().includes(q) ||
      m.model_id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    );
  });

  // Group models by provider
  const autoModels = filteredModels.filter((m) => m.provider === "auto");
  const geminiModels = filteredModels.filter((m) => m.provider === "gemini");
  const bansosaiModels = filteredModels.filter((m) => m.provider === "bansosai");
  const hermesModels = filteredModels.filter((m) => m.provider === "hermes");

  const formatContext = (val: number) => {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(0) + "M";
    if (val >= 1_000) return (val / 1_000).toFixed(0) + "k";
    return val.toString();
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "gemini":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-800/40 font-mono font-medium">Google</span>;
      case "bansosai":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/40 font-mono font-medium">BansosAI</span>;
      case "hermes":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40 font-mono font-medium">Local</span>;
      case "auto":
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 font-mono font-medium">Smart</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{provider}</span>;
    }
  };

  return (
    <div className="flex items-center gap-2" ref={popoverRef}>
      {/* Custom Model Picker Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 shadow-sm transition-all text-xs font-medium ${
            isAuto
              ? "bg-indigo-950/40 border-indigo-700/60 hover:border-indigo-500 text-indigo-200"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-200"
          }`}
          title="Ganti Model AI"
        >
          {isAuto ? (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 animate-pulse" />
          ) : activeConfig?.provider === "gemini" ? (
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : activeConfig?.provider === "bansosai" ? (
            <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          ) : (
            <Brain className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          )}

          <span className="truncate max-w-[170px] text-zinc-100 font-medium">
            {activeConfig?.display_name || "Pilih Model"}
          </span>

          {activeConfig && activeConfig.provider !== "auto" && (
            getProviderBadge(activeConfig.provider)
          )}

          <ChevronDown
            className={`w-3 h-3 text-zinc-500 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Floating Custom Popover Card */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-[380px] max-w-[95vw] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[60] overflow-hidden flex flex-col text-xs" style={{ maxHeight: "min(480px, calc(100vh - 100px))" }}>
            {/* Search Bar */}
            <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/60">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari model (misal: sonnet, flash, deepseek)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              {/* Provider Category Filter Tabs */}
              <div className="flex items-center gap-1 mt-2">
                {[
                  { id: "all", label: "Semua", icon: Layers },
                  { id: "gemini", label: "Google", icon: Sparkles },
                  { id: "bansosai", label: "BansosAI", icon: Zap },
                  { id: "hermes", label: "Local", icon: Server },
                ].map((t) => {
                  const Icon = t.icon;
                  const isTabActive = selectedTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTab(t.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        isTabActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model List Sections */}
            <div className="max-h-[340px] overflow-y-auto p-2 space-y-3">
              {filteredModels.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 font-mono">
                  Tidak ada model yang cocok dengan "{searchQuery}"
                </div>
              ) : null}

              {/* Group: Smart Auto Router */}
              {autoModels.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                    🤖 Smart Routing
                  </div>
                  {autoModels.map((m) => renderModelItem(m))}
                </div>
              )}

              {/* Group: Google AI Studio */}
              {geminiModels.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-blue-400 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>⚡ Google AI Studio ({geminiModels.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {geminiModels.map((m) => renderModelItem(m))}
                  </div>
                </div>
              )}

              {/* Group: BansosAI Cloud Pool */}
              {bansosaiModels.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-purple-400 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>🚀 BansosAI Multi-Account Pool ({bansosaiModels.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {bansosaiModels.map((m) => renderModelItem(m))}
                  </div>
                </div>
              )}

              {/* Group: Local Hermes Engine */}
              {hermesModels.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider font-mono">
                    ☤ Local Offline Runtime
                  </div>
                  <div className="space-y-0.5">
                    {hermesModels.map((m) => renderModelItem(m))}
                  </div>
                </div>
              )}
            </div>

            {/* Popover Footer */}
            <div className="px-3 py-1.5 border-t border-zinc-800/80 bg-zinc-900/40 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
              <span>{filteredModels.length} Model Tersedia</span>
              <span>Klik untuk mengaktifkan</span>
            </div>
          </div>
        )}
      </div>

      {/* Auto Routing Indicator Badge */}
      {isAuto && activeRoutingInfo && (
        <span
          title={activeRoutingInfo}
          className="hidden lg:flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 max-w-[240px] truncate"
        >
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="truncate">{activeRoutingInfo}</span>
        </span>
      )}

      {/* Thinking Level (if Gemini or models supporting thinking budget) */}
      {isGemini && (
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs">
          <Sliders className="w-3 h-3 text-zinc-400 mr-1.5" />
          <span className="text-[11px] text-zinc-500 mr-1.5">Thinking:</span>
          <select
            value={thinkingLevel}
            onChange={(e) => setThinkingLevel(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer"
          >
            <option value="Low" className="bg-zinc-900">Low</option>
            <option value="Medium" className="bg-zinc-900">Medium</option>
            <option value="High" className="bg-zinc-900">High</option>
            <option value="Extra" className="bg-zinc-900">Extra</option>
          </select>
        </div>
      )}
    </div>
  );

  function renderModelItem(m: any) {
    const isSelected = selectedModelId === m.id;
    return (
      <div
        key={m.id}
        onClick={() => {
          setSelectedModelId(m.id);
          setIsOpen(false);
        }}
        className={`px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
          isSelected
            ? "bg-indigo-950/50 border border-indigo-700/60 text-zinc-100"
            : "hover:bg-zinc-900/80 text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="truncate">
            <div className="font-medium text-xs truncate flex items-center gap-1.5">
              <span>{m.display_name}</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              {m.model_id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400">
            {formatContext(m.context_window)}
          </span>
          {getProviderBadge(m.provider)}
          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
        </div>
      </div>
    );
  }
};
