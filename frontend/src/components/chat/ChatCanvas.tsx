import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ToolCallCard } from "./ToolCallCard";
import { CheckpointBanner } from "./CheckpointBanner";
import { ModelSelector } from "./ModelSelector";
import { ChatInput } from "./ChatInput";
import {
  Sparkles,
  Settings,
  Columns2,
  MessageSquare,
  Code2,
} from "lucide-react";

export const ChatCanvas: React.FC = () => {
  const {
    messages,
    streamingContent,
    currentConvId,
    conversations,
    generalConversationsList,
    projectConversationsList,
    auxTab,
    setAuxTab,
    layoutMode,
    setLayoutMode,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const allConvs = [...generalConversationsList, ...projectConversationsList, ...conversations];
  const activeConv = allConvs.find((c) => c.id === currentConvId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] overflow-hidden">
      {/* Top Navbar */}
      <div className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0 bg-zinc-950/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-zinc-100 truncate max-w-[140px]">
            {activeConv?.title || "New Task"}
          </h2>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            {activeConv?.status || "Ready"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Mode Selector (Split IDE vs Full Chat vs Full Editor) */}
          <div className="flex items-center border border-zinc-800 rounded-lg p-0.5 bg-zinc-900 text-xs">
            <button
              onClick={() => setLayoutMode("split")}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
                layoutMode === "split"
                  ? "bg-zinc-800 text-indigo-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Split View (Chat Kiri + Editor Kanan)"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("chat-full")}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
                layoutMode === "chat-full"
                  ? "bg-zinc-800 text-blue-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Full Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("editor-full")}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
                layoutMode === "editor-full"
                  ? "bg-zinc-800 text-emerald-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Full Editor & File Viewer"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <ModelSelector />

          {/* Settings Toggle */}
          <button
            onClick={() => setAuxTab(auxTab === "settings" ? "none" : "settings")}
            className={`p-1.5 border border-zinc-800 rounded-lg transition-colors ${
              auxTab === "settings"
                ? "bg-zinc-800 text-blue-400"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Model Accounts & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4 shadow-xl">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              Orbit Agent Autonomous IDE
            </h3>
            <p className="text-xs max-w-md text-zinc-400 leading-relaxed mb-6">
              Full device access, automated model switching across multiple accounts, and reliable progress checkpointing.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full text-left">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                <span className="text-xs font-semibold text-zinc-200 block mb-0.5">Full Local Access</span>
                <span className="text-[11px] text-zinc-400">Run code, edit files, and debug without sandbox limits.</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                <span className="text-xs font-semibold text-zinc-200 block mb-0.5">Token Rotation</span>
                <span className="text-[11px] text-zinc-400">Add multiple accounts per provider to multiply your free quota.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {/* Antigravity Thinking & Live Streaming Indicator */}
            <ThinkingIndicator />
          </div>
        )}

        {/* Checkpoint Banner (if available) */}
        <CheckpointBanner />

        {/* Tool Call Approval (if paused for user confirmation) */}
        <ToolCallCard />
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
};
