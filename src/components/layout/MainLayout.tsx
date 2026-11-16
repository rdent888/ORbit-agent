import React from 'react';
import { useIDEStore } from '../../engine/store';
import {
  Files,
  MessageSquare,
  Key,
  Shield,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ExplorerPanel } from '../sidebar/ExplorerPanel';
import { ChatPanel } from '../chat/ChatPanel';
import { AccountManagerPanel } from '../sidebar/AccountManagerPanel';
import { SettingsPanel } from '../sidebar/SettingsPanel';
import { EditorPanel } from '../editor/EditorPanel';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { StatusBar } from '../statusbar/StatusBar';
import { ResumeSessionDialog } from '../dialogs/ResumeSessionDialog';
import { clsx } from 'clsx';

export const MainLayout: React.FC = () => {
  const {
    activeSidebarTab,
    setActiveSidebarTab,
    createSession,
    setResumeDialogOpen,
    sessions,
    activeSessionId,
  } = useIDEStore();

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  const handleNewConversation = () => {
    createSession(
      'New Task #' + (sessions.length + 1),
      'Refactor and implement new feature using multi-model agent harness'
    );
    setActiveSidebarTab('chat');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-bg text-text overflow-hidden">
      {/* Top Window Titlebar (VS Code style) */}
      <div className="h-8 bg-bg-sidebar border-b border-border flex items-center justify-between px-3 text-xs select-none drag">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-accent-text">
            <Sparkles className="w-4 h-4 fill-accent-text" />
            <span>Antigravity IDE</span>
            <span className="text-2xs font-normal text-muted bg-surface px-1.5 py-0.2 rounded border border-border">
              Replica v2.31
            </span>
          </div>
          <div className="text-muted text-2xs hidden md:inline">
            enterprise-backend — project workspace
          </div>
        </div>

        {/* Global Action Shortcut: Resume Session Quick Trigger */}
        <div className="flex items-center gap-2">
          {currentSession?.status === 'token_limit' && (
            <button
              onClick={() => setResumeDialogOpen(true)}
              className="flex items-center gap-1 text-2xs bg-warning-bg text-warning border border-warning/60 px-2 py-0.5 rounded font-semibold hover:bg-warning/20 cursor-pointer animate-pulse"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resume Token-Limit Session</span>
            </button>
          )}

          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1 text-2xs bg-surface border border-border px-2 py-0.5 rounded hover:bg-surface-hover text-text cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (Icons) */}
        <div className="w-12 bg-bg-sidebar border-r border-border flex flex-col items-center py-2 gap-2 select-none z-20">
          <button
            onClick={() => setActiveSidebarTab('explorer')}
            title="File Explorer"
            className={clsx(
              'p-2.5 rounded-lg transition-colors cursor-pointer',
              activeSidebarTab === 'explorer'
                ? 'text-accent-text bg-surface border-l-2 border-l-accent'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            <Files className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSidebarTab('chat')}
            title="Agent Chat & Workflow"
            className={clsx(
              'p-2.5 rounded-lg transition-colors cursor-pointer relative',
              activeSidebarTab === 'chat'
                ? 'text-accent-text bg-surface border-l-2 border-l-accent'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            <MessageSquare className="w-5 h-5" />
            {currentSession?.status === 'token_limit' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full ring-2 ring-bg animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('accounts')}
            title="BYOK Multi-Account Quota Pool"
            className={clsx(
              'p-2.5 rounded-lg transition-colors cursor-pointer',
              activeSidebarTab === 'accounts'
                ? 'text-warning bg-surface border-l-2 border-l-warning'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            <Key className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSidebarTab('settings')}
            title="Turbo Mode & Security Permissions"
            className={clsx(
              'p-2.5 rounded-lg transition-colors cursor-pointer',
              activeSidebarTab === 'settings'
                ? 'text-accent-text bg-surface border-l-2 border-l-accent'
                : 'text-muted hover:text-text hover:bg-surface'
            )}
          >
            <Shield className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Drawer */}
        <div className="w-72 sm:w-80 h-full overflow-hidden shrink-0 flex flex-col">
          {activeSidebarTab === 'explorer' && <ExplorerPanel />}
          {activeSidebarTab === 'chat' && <ChatPanel />}
          {activeSidebarTab === 'accounts' && <AccountManagerPanel />}
          {activeSidebarTab === 'settings' && <SettingsPanel />}
        </div>

        {/* Center Canvas: Monaco Code Editor + Integrated Terminal */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EditorPanel />
          </div>
          <TerminalPanel />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Session Resume Modal Dialog */}
      <ResumeSessionDialog />
    </div>
  );
};
