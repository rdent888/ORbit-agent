import React, { useEffect } from "react";
import { useChatStore } from "../../stores/chatStore";
import { Brain, ChevronDown, Sliders, Sparkles } from "lucide-react";

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

  useEffect(() => {
    fetchModelConfigs();
  }, []);

  const isAuto = selectedModelId === "auto";
  const activeConfig = modelConfigs.find((c) => c.id === selectedModelId);
  const isGemini = activeConfig?.provider === "gemini";

  return (
    <div className="flex items-center gap-2">
      {/* Model Dropdown */}
      <div
        className={`relative flex items-center border rounded-lg px-2.5 py-1.5 shadow-sm transition-all ${
          isAuto
            ? "bg-indigo-950/40 border-indigo-700/60 hover:border-indigo-500"
            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {isAuto ? (
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-2 shrink-0 animate-pulse" />
        ) : (
          <Brain className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
        )}
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="bg-transparent text-xs font-medium text-zinc-200 outline-none appearance-none pr-5 cursor-pointer max-w-[210px] truncate"
        >
          {modelConfigs.map((cfg) => (
            <option key={cfg.id} value={cfg.id} className="bg-zinc-900 text-zinc-200">
              {cfg.display_name} {cfg.provider !== "auto" ? `[${cfg.provider}]` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 pointer-events-none" />
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
};
