import React, { useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import { PlayCircle, BookmarkCheck, ArrowRightLeft, Sparkles } from "lucide-react";

export const CheckpointBanner: React.FC = () => {
  const { activeCheckpoint, modelConfigs, resumeCheckpoint, selectedModelId } = useChatStore();
  const [targetModelId, setTargetModelId] = useState(selectedModelId);

  if (!activeCheckpoint) return null;

  return (
    <div className="mx-6 my-4 p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/70 to-purple-950/70 shadow-2xl backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-100">Task Checkpoint Available</h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                {activeCheckpoint.stop_reason.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-1 max-w-xl">
              {activeCheckpoint.progress_summary}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>You can resume this task seamlessly, even with a different model or account without losing context.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs">
            <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={targetModelId}
              onChange={(e) => setTargetModelId(e.target.value)}
              className="bg-transparent text-zinc-200 outline-none text-xs cursor-pointer"
            >
              {modelConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id} className="bg-zinc-900 text-zinc-200">
                  {cfg.display_name} ({cfg.provider})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => resumeCheckpoint(activeCheckpoint.id, targetModelId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" />
            Resume Progress
          </button>
        </div>
      </div>
    </div>
  );
};
