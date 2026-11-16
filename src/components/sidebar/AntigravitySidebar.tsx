import React from 'react';
import { useIDEStore } from '../../engine/store';
import {
  Plus,
  Clock,
  Package,
  Folder,
  Settings,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

export const AntigravitySidebar: React.FC = () => {
  const {
    pinnedConversations,
    projects,
    activeConversationId,
    createNewConversation,
    selectConversation,
    setSettingsModalOpen,
  } = useIDEStore();

  return (
    <div className="w-64 h-full bg-[#0d0e11] border-r border-[#1e2025] flex flex-col justify-between select-none text-xs text-[#a0a5b5] shrink-0 font-ui">
      {/* Top Section */}
      <div className="flex flex-col p-3 gap-3 overflow-y-auto">
        {/* + New Conversation Button */}
        <button
          onClick={createNewConversation}
          className="w-full flex items-center justify-start gap-2 bg-[#181920] hover:bg-[#22242c] text-[#e2e8f0] font-semibold px-3 py-2 rounded-lg border border-[#2a2c35] shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 text-accent-text" />
          <span>New Conversation</span>
        </button>

        {/* Automations & Customizations Links */}
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#15161b] hover:text-text cursor-pointer transition-colors">
            <Clock className="w-4 h-4 text-muted" />
            <span>Automations</span>
          </div>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#15161b] hover:text-text cursor-pointer transition-colors">
            <Package className="w-4 h-4 text-muted" />
            <span>Customizations</span>
          </div>
        </div>

        {/* Pinned Conversations */}
        <div className="flex flex-col gap-1.5 pt-2">
          <div className="text-2xs font-semibold text-[#656a7b] uppercase tracking-wider px-1">
            Pinned Conversations
          </div>
          {pinnedConversations.map((pin) => (
            <div
              key={pin.id}
              className="flex flex-col px-2 py-1.5 rounded-md hover:bg-[#15161b] hover:text-text cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="text-text font-medium truncate max-w-[160px] text-xs">
                  {pin.title}
                </span>
                <span className="text-2xs text-muted font-mono">{pin.timestamp}</span>
              </div>
              <span className="text-2xs text-[#606575] font-mono truncate">{pin.path}</span>
            </div>
          ))}
        </div>

        {/* Projects Section */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between px-1 text-2xs font-semibold text-[#656a7b] uppercase tracking-wider">
            <span>Projects</span>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 hover:text-text cursor-pointer" />
              <ArrowUpDown className="w-3 h-3 hover:text-text cursor-pointer" />
            </div>
          </div>

          {/* Project Folders */}
          {projects.map((proj) => (
            <div key={proj.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[#cfd4e2] font-semibold px-1 py-0.5">
                <Folder className="w-3.5 h-3.5 text-accent-text" />
                <span className="truncate">{proj.name}</span>
              </div>

              {/* Conversations inside project */}
              <div className="flex flex-col gap-0.5 pl-2 border-l border-[#1a1c22] ml-2">
                {proj.conversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv.id, proj.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#1e2028] text-white font-medium shadow-xs'
                          : 'hover:bg-[#14151a] text-[#8e93a5] hover:text-text'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{conv.title}</span>
                      <span className="text-2xs text-[#606575] font-mono shrink-0 ml-1">
                        {conv.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Settings Button (Image 2) */}
      <div className="p-3 border-t border-[#1e2025]">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#181920] text-[#a0a5b5] hover:text-text cursor-pointer transition-colors"
        >
          <Settings className="w-4 h-4 text-muted" />
          <span className="font-medium text-xs">Settings (API Keys & Turbo)</span>
        </button>
      </div>
    </div>
  );
};
