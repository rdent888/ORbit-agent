import React from "react";
import { useChatStore } from "../../stores/chatStore";
import { Terminal, Check, X, ShieldAlert } from "lucide-react";

export const ToolCallCard: React.FC = () => {
  const { pendingToolCall, approveToolCall, turboMode } = useChatStore();

  if (!pendingToolCall) return null;

  return (
    <div className="mx-6 my-4 p-4 rounded-xl border border-amber-500/40 bg-zinc-950/90 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Action Approval Required
              {turboMode && (
                <span className="text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-800/60 rounded px-1.5 py-0.5">
                  Turbo Mode Active
                </span>
              )}
            </h4>
            <p className="text-xs text-zinc-400">
              The agent wants to execute tool:{" "}
              <span className="font-mono text-amber-300 font-bold">{pendingToolCall.tool}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => approveToolCall(pendingToolCall.id, false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
            Deny
          </button>
          <button
            onClick={() => approveToolCall(pendingToolCall.id, true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Allow Execution
          </button>
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Arguments</span>
        <pre className="mt-1 p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs font-mono text-zinc-300 overflow-x-auto">
          {JSON.stringify(pendingToolCall.args, null, 2)}
        </pre>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
        <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
        <span>Execution runs locally on your machine. You retain full control over every action.</span>
      </div>
    </div>
  );
};
