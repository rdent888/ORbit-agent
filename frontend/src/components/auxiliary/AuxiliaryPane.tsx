import React from "react";
import { useChatStore } from "../../stores/chatStore";
import { ModelAccountManager } from "../settings/ModelAccountManager";
import { X } from "lucide-react";

export const AuxiliaryPane: React.FC = () => {
  const { auxTab, setAuxTab } = useChatStore();

  if (auxTab !== "settings") return null;

  return (
    <div className="w-[460px] max-w-[90vw] border-l border-zinc-800 bg-[#0d1117] flex flex-col h-full shrink-0 overflow-hidden shadow-2xl z-40">
      <div className="h-10 px-4 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 shrink-0">
        <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
          Model Settings & Accounts
        </span>
        <button
          onClick={() => setAuxTab("none")}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <ModelAccountManager />
      </div>
    </div>
  );
};
