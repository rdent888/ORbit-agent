import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Brain } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";

export const ThinkingIndicator: React.FC = () => {
  const { isStreaming, streamingContent, modelConfigs, selectedModelId } = useChatStore();
  const [elapsed, setElapsed] = useState(0);

  // Timer: count seconds during streaming
  useEffect(() => {
    if (!isStreaming) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isStreaming) return null;

  const activeModel = modelConfigs.find((m) => m.id === selectedModelId);
  const isHermes = selectedModelId === "mc-hermes-local" || activeModel?.provider === "hermes";

  // Dynamic reasoning phrase based on elapsed time
  const getStatusText = () => {
    if (isHermes) {
      return "☤ Hermes Local Autonomous Agent executing on this PC...";
    }
    if (elapsed < 1.5) {
      return "Analyzing request & project workspace...";
    }
    if (elapsed < 3.5) {
      return "Reasoning through solution & inspecting context...";
    }
    if (elapsed < 7.0) {
      return "Formulating response & evaluating tools...";
    }
    return "Generating response stream...";
  };

  return (
    <div className="flex justify-start my-3 px-4 md:px-6 animate-in fade-in duration-200">
      <div className="flex items-start gap-3 max-w-[92%] md:max-w-[85%] w-full">
        {/* Antigravity Pulsing Glowing Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-75 blur-sm animate-pulse-glow" />
          <div className="relative w-8 h-8 rounded-xl bg-[#0e1628] border border-indigo-500/50 flex items-center justify-center text-white shadow-lg shadow-indigo-950/40">
            {isHermes ? (
              <span className="font-serif font-bold text-amber-300 text-sm">☤</span>
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: "3s" }} />
            )}
          </div>
        </div>

        {/* Thinking Card Content */}
        <div className="flex-1 overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-zinc-200">
              {isHermes ? "Hermes Agent (Local Engine)" : "Orbit Agent"}
            </span>

            {/* Model Badge */}
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isHermes
                ? "bg-amber-950/50 text-amber-300 border-amber-700/50"
                : "bg-indigo-950/50 text-indigo-300 border-indigo-700/50"
            }`}>
              {activeModel?.display_name || (isHermes ? "Hermes Local" : "AI Agent")}
            </span>

            {/* Live Elapsed Counter Badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span>{elapsed.toFixed(1)}s</span>
            </span>
          </div>

          {/* If streaming content has arrived, display it with markdown + glowing typing cursor */}
          {streamingContent ? (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-xl backdrop-blur">
              {/* Compact thinking bar at top */}
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-zinc-800/60 text-[11px] text-zinc-400 font-mono">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>Thinking stream active ({elapsed.toFixed(1)}s)</span>
                {/* Mini audio equalizer wave */}
                <div className="flex items-center gap-0.5 ml-auto h-3">
                  <span className="w-0.5 bg-indigo-400 rounded-full thinking-bar-1" />
                  <span className="w-0.5 bg-blue-400 rounded-full thinking-bar-2" />
                  <span className="w-0.5 bg-purple-400 rounded-full thinking-bar-3" />
                  <span className="w-0.5 bg-indigo-400 rounded-full thinking-bar-4" />
                </div>
              </div>

              {/* Streaming Markdown */}
              <div className="prose prose-invert prose-xs max-w-none text-zinc-200 leading-relaxed font-sans text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingContent}
                </ReactMarkdown>
                {/* Glowing typing cursor */}
                <span className="inline-block w-1.5 h-4 ml-1 bg-gradient-to-t from-blue-500 via-indigo-400 to-purple-400 rounded-sm animate-pulse align-middle" />
              </div>
            </div>
          ) : (
            /* WHILE WAITING FOR FIRST TOKEN: Antigravity Signature Thinking Card */
            <div className="relative rounded-xl border border-indigo-500/30 bg-gradient-to-br from-[#0c1222] via-[#090e1a] to-[#070b14] p-4 shadow-xl overflow-hidden">
              {/* Animated Light Sweep Beam */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent skew-x-12 animate-shimmer" />
              </div>

              {/* Top Row: Wave Equalizer + Status */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {/* Equalizer animation */}
                  <div className="flex items-center gap-1 h-4">
                    <span className="w-1 bg-indigo-400 rounded-full thinking-bar-1" />
                    <span className="w-1 bg-blue-400 rounded-full thinking-bar-2" />
                    <span className="w-1 bg-purple-400 rounded-full thinking-bar-3" />
                    <span className="w-1 bg-indigo-300 rounded-full thinking-bar-4" />
                  </div>
                  <span className="text-xs font-semibold bg-gradient-to-r from-indigo-200 via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    {isHermes ? "Hermes is thinking & executing..." : "Thinking & planning..."}
                  </span>
                </div>

                <span className="text-[11px] font-mono text-indigo-400/80 font-medium">
                  {elapsed.toFixed(1)}s
                </span>
              </div>

              {/* Dynamic Status Phrase */}
              <p className="text-xs text-zinc-400 font-mono tracking-tight leading-relaxed">
                {getStatusText()}
              </p>

              {/* Shimmer Progress Track */}
              <div className="mt-3.5 h-1 w-full bg-zinc-800/80 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 rounded-full animate-shimmer" style={{ width: "60%" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
