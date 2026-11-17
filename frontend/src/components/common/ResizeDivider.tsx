import React, { useState, useEffect, useCallback, useRef } from "react";
import { GripVertical } from "lucide-react";

interface ResizeDividerProps {
  onResize: (delta: number) => void;
  onReset?: () => void;
  tooltip?: string;
  currentValue?: number;
  className?: string;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({
  onResize,
  onReset,
  tooltip = "Tarik untuk mengatur lebar • Klik dua kali untuk reset",
  currentValue,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    setIsDragging(true);

    // Style body saat drag
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startXRef.current;
      if (delta !== 0) {
        onResize(delta);
        startXRef.current = e.clientX;
      }
    },
    [isDragging, onResize]
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      title={tooltip}
      className={`relative group shrink-0 w-3 -mx-1.5 z-30 cursor-col-resize select-none flex items-center justify-center transition-colors ${className}`}
    >
      {/* Visual Divider Line */}
      <div
        className={`h-full transition-all duration-150 ${
          isDragging
            ? "w-[2px] bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]"
            : "w-[1px] bg-white/[0.08] group-hover:w-[2px] group-hover:bg-indigo-500/80 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        }`}
      />

      {/* Tactile Grab Indicator Pill */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 flex flex-col items-center justify-center py-2 px-0.5 rounded-full bg-zinc-900 border shadow-lg ${
          isDragging
            ? "opacity-100 scale-105 border-blue-400 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
            : "opacity-0 group-hover:opacity-100 group-hover:scale-100 border-zinc-700/80 text-zinc-400 group-hover:border-indigo-500/60 group-hover:text-indigo-300"
        }`}
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Live Width Badge saat dragging */}
      {isDragging && currentValue !== undefined && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none bg-indigo-600/95 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-2xl border border-indigo-400/50 whitespace-nowrap z-50 backdrop-blur">
          {Math.round(currentValue)}px
        </div>
      )}
    </div>
  );
};
