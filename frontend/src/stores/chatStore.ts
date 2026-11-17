import { create } from "zustand";
import { api } from "../lib/api";
import type {
  ConversationItem,
  MessageItem,
  ModelConfig,
  CheckpointItem,
  FileTreeItem,
  OpenFileItem,
  ProjectItem,
  SkillItem,
} from "../lib/api";

interface ToolCallPending {
  id: string;
  tool: string;
  args: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// TYPE INTERFACE (hanya tipe, tidak boleh ada nilai/kode fungsi)
// ═══════════════════════════════════════════════════════════════
interface ChatState {
  conversations: ConversationItem[];
  projectConversationsList: ConversationItem[];
  generalConversationsList: ConversationItem[];
  currentConvId: string | null;
  messages: MessageItem[];
  modelConfigs: ModelConfig[];
  selectedModelId: string;
  thinkingLevel: string;
  isStreaming: boolean;
  streamingContent: string;
  pendingToolCall: ToolCallPending | null;
  activeCheckpoint: CheckpointItem | null;
  activeRoutingInfo: string | null;
  turboMode: boolean;
  auxTab: "settings" | "none";

  // IDE Workspace & Layout
  sidebarTab: "files" | "tasks";
  workspacePath: string;
  workspaceName: string;
  workspaceTree: FileTreeItem[];
  openFiles: OpenFileItem[];
  activeFilePath: string | null;
  layoutMode: "split" | "chat-full" | "editor-full";

  // Projects Management
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  isProjectModalOpen: boolean;

  // Skills & Plugins Management
  skills: SkillItem[];
  isSkillsModalOpen: boolean;
  setIsSkillsModalOpen: (open: boolean) => void;
  fetchSkills: () => Promise<void>;
  installSkill: (repoUrl: string, name?: string) => Promise<void>;
  importLocalSkill: (localPath: string, name?: string) => Promise<void>;
  createCustomSkill: (name: string, desc: string, inst: string) => Promise<void>;
  toggleSkill: (id: string) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  // Per-project conversation cache
  projectConversations: Record<string, ConversationItem[]>;

  // General Chat mode (outside any project)
  isGeneralChat: boolean;
  setGeneralChat: (val: boolean) => void;

  // Helpers
  getCurrentProjectId: () => string;

  // Actions – Conversations
  fetchGeneralConversations: () => Promise<ConversationItem[]>;
  fetchProjectConversations: (projectId?: string) => Promise<ConversationItem[]>;
  fetchConversations: (projectId?: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title?: string, isGeneral?: boolean) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  pinConversation: (id: string, pinned: boolean) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  selectGeneralChat: () => Promise<void>;

  // Actions – Models
  fetchModelConfigs: () => Promise<void>;
  setSelectedModelId: (id: string) => void;
  setThinkingLevel: (lvl: string) => void;
  setTurboMode: (val: boolean) => void;
  setAuxTab: (tab: "settings" | "none") => void;
  setSidebarTab: (tab: "files" | "tasks") => void;
  setLayoutMode: (mode: "split" | "chat-full" | "editor-full") => void;
  setIsProjectModalOpen: (open: boolean) => void;

  // Actions – Projects
  fetchProjects: () => Promise<ProjectItem | null>;
  createProject: (name: string, path: string, turboMode: boolean) => Promise<void>;
  activateProject: (id: string) => Promise<void>;
  updateProject: (id: string, data: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Actions – Workspace
  fetchWorkspace: () => Promise<void>;
  openWorkspaceFolder: (path: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  createFile: (name: string, content?: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;

  // Actions – Chat & Messages
  deleteMessage: (messageId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: Array<{name: string; type: string; data_url?: string; text_content?: string}>) => Promise<void>;
  approveToolCall: (id: string, allow: boolean) => Promise<void>;
  resumeCheckpoint: (checkpointId: string, newModelId?: string) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// IMPLEMENTASI STORE
// ═══════════════════════════════════════════════════════════════
export const useChatStore = create<ChatState>((set, get) => ({
  // Default values
  conversations: [],
  projectConversationsList: [],
  generalConversationsList: [],
  currentConvId: null,
  messages: [],
  modelConfigs: [],
  selectedModelId: "auto",
  thinkingLevel: "Medium",
  isStreaming: false,
  streamingContent: "",
  pendingToolCall: null,
  activeCheckpoint: null,
  activeRoutingInfo: null,
  turboMode: false,
  auxTab: "none",

  // IDE defaults
  sidebarTab: "files",
  workspacePath: "",
  workspaceName: "",
  workspaceTree: [],
  openFiles: [],
  activeFilePath: null,
  layoutMode: "split",

  // Projects
  projects: [],
  activeProject: null,
  isProjectModalOpen: false,
  projectConversations: {},
  isGeneralChat: false,

  // Skills
  skills: [],
  isSkillsModalOpen: false,
  setIsSkillsModalOpen: (open) => set({ isSkillsModalOpen: open }),

  fetchSkills: async () => {
    try {
      const res = await api.get("/api/skills");
      set({ skills: res.data || [] });
    } catch (e) {
      console.error("fetchSkills failed", e);
    }
  },

  installSkill: async (repoUrl: string, name?: string) => {
    try {
      await api.post("/api/skills/install", { repo_url: repoUrl, skill_name: name });
      await get().fetchSkills();
    } catch (e) {
      console.error("installSkill failed", e);
      throw e;
    }
  },

  importLocalSkill: async (localPath: string, name?: string) => {
    try {
      await api.post("/api/skills/import-local", { local_path: localPath, skill_name: name });
      await get().fetchSkills();
    } catch (e) {
      console.error("importLocalSkill failed", e);
      throw e;
    }
  },

  createCustomSkill: async (name: string, desc: string, inst: string) => {
    try {
      await api.post("/api/skills/create", { name, description: desc, instructions: inst });
      await get().fetchSkills();
    } catch (e) {
      console.error("createCustomSkill failed", e);
      throw e;
    }
  },

  toggleSkill: async (id: string) => {
    try {
      await api.patch(`/api/skills/${id}/toggle`);
      await get().fetchSkills();
    } catch (e) {
      console.error("toggleSkill failed", e);
    }
  },

  deleteSkill: async (id: string) => {
    try {
      await api.delete(`/api/skills/${id}`);
      await get().fetchSkills();
    } catch (e) {
      console.error("deleteSkill failed", e);
    }
  },

  // ─── Helpers ────────────────────────────────────────────────
  getCurrentProjectId: () => get().activeProject?.id || "",
  setGeneralChat: (val) => set({ isGeneralChat: val }),

  // ─── Setters sederhana ──────────────────────────────────────
  setIsProjectModalOpen: (open) => set({ isProjectModalOpen: open }),
  setAuxTab: (tab) => set({ auxTab: tab }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),

  // ─── Projects ───────────────────────────────────────────────
  fetchProjects: async () => {
    try {
      const res = await api.get("/api/projects");
      const list = res.data || [];
      const active = list.find((p: ProjectItem) => p.is_active === 1) || list[0] || null;
      set({
        projects: list,
        activeProject: active,
        turboMode: active?.turbo_mode ?? false,
      });
      return active;
    } catch (e) {
      console.error("fetchProjects failed", e);
      return null;
    }
  },

  createProject: async (name, path, turboMode) => {
    try {
      const res = await api.post("/api/projects", { name, path, turbo_mode: turboMode });
      await get().selectProject(res.data.id);
      set({ isProjectModalOpen: false });
    } catch (e) {
      console.error("createProject failed", e);
      throw e;
    }
  },

  activateProject: async (id) => {
    try {
      await api.post(`/api/projects/${id}/activate`);
      await get().fetchProjects();
      await get().fetchWorkspace();
    } catch (e) {
      console.error("activateProject failed", e);
    }
  },

  // Pilih project → aktivasi → load conversations project tsb
  selectProject: async (projectId) => {
    if (projectId === "general") {
      await get().selectGeneralChat();
      return;
    }
    // Reset state dulu sebelum pindah project
    set({
      isGeneralChat: false,
      currentConvId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
      conversations: [],
      projectConversationsList: [],
    });
    try {
      await api.post(`/api/projects/${projectId}/activate`);
      await get().fetchProjects();
      await get().fetchWorkspace();
      const list = await get().fetchProjectConversations(projectId);
      if (list.length > 0) {
        await get().selectConversation(list[0].id);
      } else {
        await get().createConversation("New Task", false);
      }
      set({ isProjectModalOpen: false });
    } catch (e) {
      console.error("selectProject failed", e);
    }
  },

  selectGeneralChat: async () => {
    set({
      isGeneralChat: true,
      currentConvId: null,
      messages: [],
      isStreaming: false,
      streamingContent: "",
    });
    const list = await get().fetchGeneralConversations();
    if (list.length > 0) {
      await get().selectConversation(list[0].id);
    } else {
      await get().createConversation("General Chat", true);
    }
  },

  updateProject: async (id, data) => {
    try {
      await api.patch(`/api/projects/${id}`, data);
      await get().fetchProjects();
    } catch (e) {
      console.error("updateProject failed", e);
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/api/projects/${id}`);
      await get().fetchProjects();
    } catch (e) {
      console.error("deleteProject failed", e);
    }
  },

  // ─── Conversations ──────────────────────────────────────────
  fetchGeneralConversations: async () => {
    try {
      const res = await api.get("/api/conversations?project_id=general");
      const list: ConversationItem[] = res.data || [];
      set({ generalConversationsList: list });
      if (get().isGeneralChat) {
        set({ conversations: list });
      }
      return list;
    } catch (e) {
      console.error("fetchGeneralConversations failed", e);
      return [];
    }
  },

  fetchProjectConversations: async (projectId?: string) => {
    try {
      const pid = projectId ?? get().getCurrentProjectId();
      if (!pid) {
        set({ projectConversationsList: [] });
        return [];
      }
      const res = await api.get(`/api/conversations?project_id=${pid}`);
      const list: ConversationItem[] = res.data || [];
      set({ projectConversationsList: list });
      if (!get().isGeneralChat) {
        set({ conversations: list });
      }
      return list;
    } catch (e) {
      console.error("fetchProjectConversations failed", e);
      return [];
    }
  },

  fetchConversations: async (projectId?: string) => {
    await get().fetchGeneralConversations();
    await get().fetchProjectConversations(projectId);
  },

  selectConversation: async (id) => {
    try {
      const res = await api.get(`/api/conversations/${id}`);
      const convData = res.data;
      const isGen = !convData.project_id;
      set({
        currentConvId: id,
        isGeneralChat: isGen,
        messages: convData.messages || [],
        selectedModelId: convData.model_config_id || get().selectedModelId,
        activeCheckpoint: convData.checkpoints?.[0] || null,
        streamingContent: "",
        isStreaming: false,
        pendingToolCall: null,
      });
    } catch (e) {
      console.error("selectConversation error", e);
    }
  },

  createConversation: async (title = "New Task", isGeneral?: boolean) => {
    try {
      const isGen = isGeneral !== undefined ? isGeneral : get().isGeneralChat;
      const body: any = {
        title,
        model_config_id: get().selectedModelId,
      };

      if (isGen) {
        body.project_id = "general";
      } else {
        const pid = get().getCurrentProjectId();
        if (pid) body.project_id = pid;
      }

      const res = await api.post("/api/conversations", body);
      const newConv = res.data;

      if (isGen) {
        set({ isGeneralChat: true });
        await get().fetchGeneralConversations();
      } else {
        set({ isGeneralChat: false });
        await get().fetchProjectConversations();
      }

      await get().selectConversation(newConv.id);
      return newConv.id as string;
    } catch (e) {
      console.error("createConversation failed", e);
      throw e;
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/api/conversations/${id}`);
      const filterList = (list: ConversationItem[]) => list.filter((c) => c.id !== id);
      set((state) => {
        const remConversations = filterList(state.conversations);
        const remProj = filterList(state.projectConversationsList);
        const remGen = filterList(state.generalConversationsList);
        return {
          conversations: remConversations,
          projectConversationsList: remProj,
          generalConversationsList: remGen,
        };
      });

      if (get().currentConvId === id) {
        const activeList = get().isGeneralChat
          ? get().generalConversationsList
          : get().projectConversationsList;
        if (activeList.length > 0) {
          await get().selectConversation(activeList[0].id);
        } else {
          set({ currentConvId: null, messages: [] });
        }
      }
    } catch (e) {
      console.error("deleteConversation failed", e);
    }
  },

  renameConversation: async (id, newTitle) => {
    try {
      await api.patch(`/api/conversations/${id}`, { title: newTitle });
      const updateList = (list: ConversationItem[]) =>
        list.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      set((state) => ({
        conversations: updateList(state.conversations),
        projectConversationsList: updateList(state.projectConversationsList),
        generalConversationsList: updateList(state.generalConversationsList),
      }));
    } catch (e) {
      console.error("renameConversation failed", e);
    }
  },

  pinConversation: async (id, pinned) => {
    try {
      await api.patch(`/api/conversations/${id}`, { is_pinned: pinned ? 1 : 0 });
      const sortList = (list: ConversationItem[]) => {
        const updated = list.map((c) =>
          c.id === id ? { ...c, is_pinned: pinned ? 1 : 0 } : c
        );
        return updated.sort((a, b) => {
          if ((b.is_pinned || 0) !== (a.is_pinned || 0)) {
            return (b.is_pinned || 0) - (a.is_pinned || 0);
          }
          return (b.updated_at || "").localeCompare(a.updated_at || "");
        });
      };
      set((state) => ({
        conversations: sortList(state.conversations),
        projectConversationsList: sortList(state.projectConversationsList),
        generalConversationsList: sortList(state.generalConversationsList),
      }));
    } catch (e) {
      console.error("pinConversation failed", e);
    }
  },

  // ─── Model Configs ──────────────────────────────────────────
  fetchModelConfigs: async () => {
    try {
      const res = await api.get("/api/model-configs");
      set({ modelConfigs: res.data });
      if (res.data.length > 0 && !get().selectedModelId) {
        set({ selectedModelId: res.data[0].id });
      }
    } catch (e) {
      console.error("fetchModelConfigs failed", e);
    }
  },

  setSelectedModelId: (id) => {
    set({ selectedModelId: id });
    const convId = get().currentConvId;
    if (convId) {
      api.patch(`/api/conversations/${convId}`, { model_config_id: id }).catch(console.error);
    }
  },

  setThinkingLevel: (lvl) => set({ thinkingLevel: lvl }),

  setTurboMode: async (val) => {
    set({ turboMode: val });
    try {
      await api.patch("/api/settings", { turbo_mode: val });
      if (get().activeProject) {
        await api.patch(`/api/projects/${get().activeProject!.id}`, { turbo_mode: val });
        get().fetchProjects();
      }
    } catch (e) {
      console.error("update turbo_mode failed", e);
    }
  },

  // ─── Workspace ──────────────────────────────────────────────
  fetchWorkspace: async () => {
    try {
      const res = await api.get("/api/workspace");
      set({
        workspacePath: res.data.workspace_path,
        workspaceName: res.data.name,
        workspaceTree: res.data.tree || [],
      });
    } catch (e) {
      console.error("fetchWorkspace failed", e);
    }
  },

  openWorkspaceFolder: async (path) => {
    try {
      const res = await api.post("/api/workspace/open", { path });
      set({
        workspacePath: res.data.workspace_path,
        workspaceName: res.data.name,
        workspaceTree: res.data.tree || [],
      });
    } catch (e) {
      console.error("openWorkspaceFolder failed", e);
    }
  },

  createFolder: async (name) => {
    try {
      const res = await api.post("/api/workspace/create-folder", { path: name });
      set({ workspaceTree: res.data.tree || [] });
    } catch (e) {
      console.error("createFolder failed", e);
    }
  },

  createFile: async (name, content = "") => {
    try {
      const res = await api.post("/api/workspace/create-file", { path: name, content });
      set({ workspaceTree: res.data.tree || [] });
      await get().openFile(res.data.path);
    } catch (e) {
      console.error("createFile failed", e);
    }
  },

  openFile: async (path) => {
    const existing = get().openFiles.find((f) => f.path === path);
    if (existing) {
      set({ activeFilePath: path });
      if (get().layoutMode === "chat-full") set({ layoutMode: "split" });
      return;
    }
    try {
      const res = await api.get(`/api/workspace/file?path=${encodeURIComponent(path)}`);
      const newFile: OpenFileItem = {
        path: res.data.path,
        name: res.data.name,
        content: res.data.content,
        size: res.data.size,
        isDirty: false,
      };
      set((state) => ({
        openFiles: [...state.openFiles, newFile],
        activeFilePath: newFile.path,
        layoutMode: state.layoutMode === "chat-full" ? "split" : state.layoutMode,
      }));
    } catch (e) {
      console.error("openFile error", e);
    }
  },

  closeFile: (path) => {
    const openFiles = get().openFiles.filter((f) => f.path !== path);
    let activeFilePath = get().activeFilePath;
    if (activeFilePath === path) {
      activeFilePath = openFiles.length > 0 ? openFiles[openFiles.length - 1].path : null;
    }
    set({ openFiles, activeFilePath });
  },

  updateFileContent: (path, content) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, content, isDirty: true } : f
      ),
    }));
  },

  saveFile: async (path) => {
    const file = get().openFiles.find((f) => f.path === path);
    if (!file) return;
    try {
      await api.post("/api/workspace/file", { path: file.path, content: file.content });
      set((state) => ({
        openFiles: state.openFiles.map((f) =>
          f.path === path ? { ...f, isDirty: false } : f
        ),
      }));
    } catch (e) {
      console.error("saveFile error", e);
    }
  },

  // ─── Messages ───────────────────────────────────────────────
  deleteMessage: async (id) => {
    try {
      await api.delete(`/api/messages/${id}`);
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }));
    } catch (e) {
      console.error("deleteMessage failed", e);
    }
  },

  sendMessage: async (content, attachments?) => {
    let convId = get().currentConvId;
    if (!convId) {
      convId = await get().createConversation(content.slice(0, 30));
    }

    const optimisticMsg: MessageItem = {
      id: "opt-" + Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, optimisticMsg],
      isStreaming: true,
      streamingContent: "",
      pendingToolCall: null,
      activeCheckpoint: null,
    }));

    try {
      await api.post(`/api/conversations/${convId}/messages`, {
        content,
        thinking_level: get().thinkingLevel,
        model_config_id: get().selectedModelId,
        attachments: attachments || [],
      });

      const evtSource = new EventSource(
        `http://localhost:8000/api/conversations/${convId}/stream`
      );

      evtSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "token") {
            set((s) => ({ streamingContent: s.streamingContent + payload.data }));
          } else if (payload.type === "model_routed") {
            set({ activeRoutingInfo: payload.data });
          } else if (payload.type === "tool_approval") {
            set({ pendingToolCall: payload.data });
          } else if (payload.type === "checkpoint") {
            set({
              activeCheckpoint: {
                id: payload.data.checkpoint_id,
                created_at: new Date().toISOString(),
                stop_reason: "token_limit",
                is_resumed: 0,
                progress_summary: "Task saved at checkpoint.",
              },
            });
          } else if (payload.type === "done") {
            evtSource.close();
            set({ isStreaming: false, streamingContent: "" });
            get().selectConversation(convId!);
            get().fetchWorkspace();
          } else if (payload.type === "error") {
            evtSource.close();
            set({ isStreaming: false });
            alert("Error: " + payload.data);
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      evtSource.onerror = (e) => {
        console.error("SSE error", e);
        evtSource.close();
        set({ isStreaming: false });
      };
    } catch (e: any) {
      set({ isStreaming: false });
      alert(e?.response?.data?.detail || "Failed to send message");
    }
  },

  approveToolCall: async (id, allow) => {
    const convId = get().currentConvId;
    if (!convId) return;
    try {
      if (allow) {
        await api.post(`/api/tool-calls/${id}/approve?conv_id=${convId}`);
      } else {
        await api.post(`/api/tool-calls/${id}/deny?conv_id=${convId}`);
      }
      set({ pendingToolCall: null });
    } catch (e) {
      console.error("tool call approval error", e);
    }
  },

  resumeCheckpoint: async (_checkpointId, newModelId?) => {
    const convId = get().currentConvId;
    if (!convId) return;
    try {
      await api.post(`/api/conversations/${convId}/resume`, {
        model_config_id: newModelId || get().selectedModelId,
      });
      await get().selectConversation(convId);
      get().sendMessage("Lanjutkan pekerjaan dari checkpoint sekarang.");
    } catch (e: any) {
      alert("Resume failed: " + (e?.response?.data?.detail || e.message));
    }
  },
}));
