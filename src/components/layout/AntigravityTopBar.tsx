import React from 'react';
import { useIDEStore } from '../../engine/store';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  PanelLeft,
  Terminal,
  MoreVertical,
  Minus,
  Square,
  X,
  Sparkles,
} from 'lucide-react';

interface AntigravityTopBarProps {
  onToggleSidebar: () => void;
}

export const AntigravityTopBar: React.FC<AntigravityTopBarProps> = ({ onToggleSidebar }) => {
  const { breadcrumb, terminalOpen, toggleTerminal } = useIDEStore();

  return (
    <div className="flex flex-col bg-[#0b0c0e] border-b border-[#1e2025] select-none text-xs text-[#a0a5b5]">
      {/* Menu Row */}
      <div className="flex items-center justify-between px-3 h-7 text-2xs text-[#808595] border-b border-[#16171b]">
        <div className="flex items-center gap-4">
          <span className="hover:text-text cursor-pointer transition-colors">Antigravity</span>
          <span className="hover:text-text cursor-pointer transition-colors">Workspace</span>
          <span className="hover:text-text cursor-pointer transition-colors">View</span>
          <span className="hover:text-text cursor-pointer transition-colors">Window</span>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <Minus className="w-3.5 h-3.5 hover:text-text cursor-pointer" />
          <Square className="w-3 h-3 hover:text-text cursor-pointer" />
          <X className="w-3.5 h-3.5 hover:text-danger-text cursor-pointer" />
        </div>
      </div>

      {/* Navigation & Breadcrumb Row (Matches Image 2) */}
      <div className="flex items-center justify-between px-3 h-10">
        <div className="flex items-center gap-2.5">
          {/* Logo A */}
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded hover:bg-[#18191f] text-muted hover:text-text cursor-pointer transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center text-muted">
            <button className="p-1 hover:text-text cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-text cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Icon */}
          <button className="p-1 text-muted hover:text-text cursor-pointer">
            <Search className="w-4 h-4" />
          </button>

          {/* Breadcrumb Title */}
          <span className="text-xs text-[#e2e8f0] font-medium truncate max-w-md ml-1">
            {breadcrumb}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Terminal Toggle Button */}
          <button
            onClick={toggleTerminal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer transition-colors border ${
              terminalOpen
                ? 'bg-turbo-bg text-turbo border-turbo/60 shadow-sm'
                : 'bg-[#181920] text-muted border-[#2a2c35] hover:text-text'
            }`}
            title="Toggle Integrated Terminal (PowerShell)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal {terminalOpen ? 'Active' : ''}</span>
          </button>

          {/* Restart to Update Pill */}
          <button className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-2xs font-medium px-3 py-1 rounded-md shadow-sm cursor-pointer transition-colors flex items-center gap-1">
            <span>Restart to Update</span>
            <span>→</span>
          </button>

          {/* More Menu */}
          <button className="text-muted hover:text-text p-1 cursor-pointer">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
