import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ChatCanvas } from "./components/chat/ChatCanvas";
import { EditorPane } from "./components/editor/EditorPane";
import { AuxiliaryPane } from "./components/auxiliary/AuxiliaryPane";
import { ProjectModal } from "./components/projects/ProjectModal";
import { SkillsModal } from "./components/skills/SkillsModal";
import { ResizeDivider } from "./components/common/ResizeDivider";
import { useChatStore } from "./stores/chatStore";

const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 460;

const DEFAULT_CHAT_WIDTH = 520;
const MIN_CHAT_WIDTH = 340;

export const App: React.FC = () => {
  const {
    fetchModelConfigs,
    fetchWorkspace,
    fetchProjects,
    fetchSkills,
    fetchGeneralConversations,
    fetchProjectConversations,
    selectConversation,
    createConversation,
    layoutMode,
  } = useChatStore();

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("orbit_sidebar_width") || localStorage.getItem("antigravity_sidebar_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_SIDEBAR_WIDTH && val <= MAX_SIDEBAR_WIDTH) return val;
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [chatWidth, setChatWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("orbit_chat_width") || localStorage.getItem("antigravity_chat_width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_CHAT_WIDTH) return val;
      }
    } catch {}
    return DEFAULT_CHAT_WIDTH;
  });

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => {
      const next = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, prev + delta));
      try {
        localStorage.setItem("orbit_sidebar_width", next.toString());
      } catch {}
      return next;
    });
  }, []);

  const handleChatResize = useCallback(
    (delta: number) => {
      setChatWidth((prev) => {
        const maxChatWidth = Math.max(MIN_CHAT_WIDTH, window.innerWidth - sidebarWidth - 320);
        const next = Math.max(MIN_CHAT_WIDTH, Math.min(maxChatWidth, prev + delta));
        try {
          localStorage.setItem("orbit_chat_width", next.toString());
        } catch {}
        return next;
      });
    },
    [sidebarWidth]
  );

  useEffect(() => {
    const init = async () => {
      fetchModelConfigs();
      fetchSkills();
      await fetchGeneralConversations();
      const activeProj = await fetchProjects();
      if (activeProj) {
        await fetchWorkspace();
        const projConvs = await fetchProjectConversations(activeProj.id);
        if (projConvs.length > 0) {
          await selectConversation(projConvs[0].id);
        } else {
          await createConversation("New Task", false);
        }
      } else {
        const genConvs = await fetchGeneralConversations();
        if (genConvs.length > 0) {
          await selectConversation(genConvs[0].id);
        } else {
          await createConversation("General Chat", true);
        }
      }
    };
    init();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a12] text-zinc-100 select-none font-sans">
      {/* Primary Sidebar (Project Files & Tasks) */}
      <Sidebar width={sidebarWidth} />

      {/* Draggable Divider between Sidebar & Main Content */}
      <ResizeDivider
        onResize={handleSidebarResize}
        onReset={() => {
          setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
          try {
            localStorage.setItem("orbit_sidebar_width", DEFAULT_SIDEBAR_WIDTH.toString());
          } catch {}
        }}
        currentValue={sidebarWidth}
        tooltip="Geser untuk mengatur lebar Sidebar • Klik dua kali untuk reset (260px)"
      />

      {/* Main Workspace Area with Layout Switching */}
      <div className="flex-1 flex h-full overflow-hidden min-w-0">
        {layoutMode === "split" && (
          <>
            <div
              style={{ width: `${chatWidth}px` }}
              className="h-full shrink-0 flex flex-col overflow-hidden min-w-[320px]"
            >
              <ChatCanvas />
            </div>

            {/* Draggable Divider between ChatCanvas & EditorPane */}
            <ResizeDivider
              onResize={handleChatResize}
              onReset={() => {
                const ideal = Math.max(MIN_CHAT_WIDTH, Math.round((window.innerWidth - sidebarWidth) * 0.48));
                setChatWidth(ideal);
                try {
                  localStorage.setItem("orbit_chat_width", ideal.toString());
                } catch {}
              }}
              currentValue={chatWidth}
              tooltip="Geser untuk mengatur batasan Chat & Editor • Klik dua kali untuk reset 50:50"
            />

            <div className="flex-1 h-full overflow-hidden flex flex-col min-w-[320px]">
              <EditorPane />
            </div>
          </>
        )}

        {layoutMode === "chat-full" && (
          <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
            <ChatCanvas />
          </div>
        )}

        {layoutMode === "editor-full" && (
          <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
            <EditorPane />
          </div>
        )}
      </div>

      {/* Auxiliary Settings Drawer */}
      <AuxiliaryPane />

      {/* Project & Workspace Manager Modal */}
      <ProjectModal />

      {/* Skills, Plugins & Architect Manager Modal */}
      <SkillsModal />
    </div>
  );
};

export default App;
