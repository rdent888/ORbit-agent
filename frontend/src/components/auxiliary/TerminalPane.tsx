import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Terminal as TerminalIcon, RotateCcw } from "lucide-react";

export const TerminalPane: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const initTerminal = () => {
    if (!terminalRef.current) return;

    // Clean previous instance if any
    if (termInstanceRef.current) {
      termInstanceRef.current.dispose();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }

    const term = new Terminal({
      theme: {
        background: "#090d16",
        foreground: "#f3f4f6",
        cursor: "#38bdf8",
        selectionBackground: "#334155",
      },
      fontFamily: "Fira Code, Consolas, Monaco, monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termInstanceRef.current = term;

    const ws = new WebSocket("ws://localhost:8000/ws/terminal/default");
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln("\x1b[32m✔ Connected to Orbit Agent Local Shell (PowerShell)\x1b[0m\r\n");
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[31m✖ Terminal session disconnected.\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      ws.close();
    };
  };

  useEffect(() => {
    initTerminal();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#090d16] border-t border-zinc-800">
      <div className="h-9 px-4 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Integrated Terminal</span>
          <span className="text-[10px] font-mono text-zinc-500">PowerShell (Host)</span>
        </div>
        <button
          onClick={initTerminal}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Restart Terminal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" />
    </div>
  );
};
