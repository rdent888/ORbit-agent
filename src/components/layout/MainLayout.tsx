import React, { useState } from 'react';
import { AntigravityTopBar } from './AntigravityTopBar';
import { AntigravitySidebar } from '../sidebar/AntigravitySidebar';
import { AntigravityConversationView } from '../chat/AntigravityConversationView';
import { SettingsModal } from '../dialogs/SettingsModal';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121317] text-[#e2e8f0] overflow-hidden select-none font-ui">
      {/* Top Application Bar matching Image 2 */}
      <AntigravityTopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {sidebarOpen && <AntigravitySidebar />}

        {/* Central Agent Workspace Canvas */}
        <AntigravityConversationView />
      </div>

      {/* Settings Modal (for connecting real API keys & multi-account pool) */}
      <SettingsModal />
    </div>
  );
};
