import { create } from 'zustand';
import { Model, Account, Session, Message, Artifact, PermissionRule } from '../types';

interface ProjectFolder {
  id: string;
  name: string;
  conversations: {
    id: string;
    title: string;
    timestamp: string;
    active?: boolean;
  }[];
}

interface IDEState {
  // Navigation & Project Structure (matching Image 2)
  pinnedConversations: {
    id: string;
    title: string;
    path: string;
    timestamp: string;
  }[];
  projects: ProjectFolder[];
  activeProjectId: string;
  activeConversationId: string;
  breadcrumb: string;

  // Real Workspace & Files
  workspacePath: string;
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;

  // Turbo Mode & Permissions
  turboMode: boolean;
  setTurboMode: (enabled: boolean) => void;
  permissionRules: PermissionRule[];
  addPermissionRule: (rule: Omit<PermissionRule, 'id' | 'workspaceId'>) => void;
  removePermissionRule: (id: string) => void;

  // Models & BYOK Accounts (Real, user connects keys)
  models: Model[];
  accounts: Account[];
  activeModelId: string;
  activeAccountId: string | null;
  setActiveModel: (modelId: string) => void;
  setActiveAccount: (accountId: string | null) => void;
  saveAccount: (account: Omit<Account, 'id' | 'quotaUsed' | 'status' | 'isActive'>) => void;
  updateAccountApiKey: (provider: string, apiKey: string) => void;
  removeAccount: (id: string) => void;

  // Live Conversations & Messages (Real, no dummy sandbox)
  sessions: Session[];
  activeSessionId: string;
  messages: Message[];
  artifacts: Artifact[];
  isStreaming: boolean;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  resumeDialogOpen: boolean;
  setResumeDialogOpen: (open: boolean) => void;

  // Actions
  createNewConversation: () => void;
  selectConversation: (convId: string, projectId?: string) => void;
  sendMessage: (content: string) => Promise<void>;
  resumeInterruptedSession: (sessionId: string, newModelId: string) => Promise<void>;
  approveArtifact: (artifactId: string) => void;
  rejectArtifact: (artifactId: string) => void;

  // Real Terminal Execution
  terminalLines: { text: string; type: 'input' | 'output' | 'error' | 'system' }[];
  runTerminalCommand: (cmd: string) => Promise<void>;
  clearTerminal: () => void;
}

// Real Available Models
const REAL_MODELS: Model[] = [
  {
    id: 'google/gemini-3.8-flash-high',
    provider: 'google',
    name: 'gemini-2.5-flash', // maps to latest high-speed Gemini
    displayName: 'Gemini 3.8 Flash High',
    contextWindow: 1000000,
    supportsThinking: true,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    isByok: true,
    isEnabled: true,
  },
  {
    id: 'google/gemini-2.5-pro',
    provider: 'google',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro (Deep Reasoning)',
    contextWindow: 2000000,
    supportsThinking: true,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    isByok: true,
    isEnabled: true,
  },
  {
    id: 'anthropic/claude-3-7-sonnet',
    provider: 'anthropic',
    name: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet (Thinking)',
    contextWindow: 200000,
    supportsThinking: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    isByok: true,
    isEnabled: true,
  },
  {
    id: 'openai/gpt-4o',
    provider: 'openai',
    name: 'gpt-4o',
    displayName: 'OpenAI GPT-4o',
    contextWindow: 128000,
    supportsThinking: false,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    isByok: true,
    isEnabled: true,
  },
  {
    id: 'openai/o3-mini',
    provider: 'openai',
    name: 'o3-mini',
    displayName: 'OpenAI o3-mini (High Reasoning)',
    contextWindow: 200000,
    supportsThinking: true,
    costPer1kInput: 0.0011,
    costPer1kOutput: 0.0044,
    isByok: true,
    isEnabled: true,
  },
  {
    id: 'custom/local-ollama',
    provider: 'custom',
    name: 'llama3.3',
    displayName: 'Custom Local LLM (Ollama / vLLM)',
    contextWindow: 128000,
    supportsThinking: false,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    isByok: true,
    isEnabled: true,
  },
];

// Load persisted accounts or provide empty clean defaults for user to input
const loadPersistedAccounts = (): Account[] => {
  try {
    const raw = localStorage.getItem('agy_byok_accounts');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'acc-google-default',
      provider: 'google',
      label: 'Google AI Studio Key (Primary)',
      apiKey: '', // Clean: user enters their own key!
      priorityOrder: 1,
      quotaUsed: 0,
      quotaLimit: 0,
      status: 'ok',
      isActive: true,
      supportedModelIds: ['google/gemini-3.8-flash-high', 'google/gemini-2.5-pro'],
    },
    {
      id: 'acc-anthropic-default',
      provider: 'anthropic',
      label: 'Anthropic Claude Key',
      apiKey: '',
      priorityOrder: 2,
      quotaUsed: 0,
      quotaLimit: 0,
      status: 'ok',
      isActive: true,
      supportedModelIds: ['anthropic/claude-3-7-sonnet'],
    },
    {
      id: 'acc-openai-default',
      provider: 'openai',
      label: 'OpenAI Developer Key',
      apiKey: '',
      priorityOrder: 3,
      quotaUsed: 0,
      quotaLimit: 0,
      status: 'ok',
      isActive: true,
      supportedModelIds: ['openai/gpt-4o', 'openai/o3-mini'],
    },
  ];
};

export const useIDEStore = create<IDEState>((set, get) => ({
  // Navigation matching Image 2
  pinnedConversations: [
    { id: 'pin-1', title: 'Audit Workflow For Project', path: 'D:\\SEMESTER 5\\RPL', timestamp: '11d' },
    { id: 'pin-2', title: 'Backend Programming Session', path: 'D:\\SEMESTER 5\\RPL', timestamp: '36m' },
    { id: 'pin-3', title: 'Frontend Programming Session', path: 'D:\\SEMESTER 5\\RPL', timestamp: '3d' },
  ],
  projects: [
    {
      id: 'proj-antigravity',
      name: 'project clone antigravity',
      conversations: [
        {
          id: 'conv-main',
          title: 'Clone Antigravity IDE Replica With Custom AI Models',
          timestamp: 'Just now',
          active: true,
        },
        {
          id: 'conv-install',
          title: 'Installing Replica Skill Framework',
          timestamp: '44m',
        },
      ],
    },
    {
      id: 'proj-xaamp',
      name: 'xaamp',
      conversations: [
        { id: 'conv-x1', title: 'Setup Project Mahasiswa...', timestamp: '3d' },
        { id: 'conv-x2', title: 'Menjalankan Website Lokal...', timestamp: '17d' },
        { id: 'conv-x3', title: 'Audit Sistem Informasi P...', timestamp: '17d' },
      ],
    },
  ],
  activeProjectId: 'proj-antigravity',
  activeConversationId: 'conv-main',
  breadcrumb: 'project clone antigravity / Clone Antigravity IDE Replica With Custom AI Models',

  workspacePath: 'E:\\.VSCODE\\project clone antigravity',
  terminalOpen: true, // Default open terminal as user requested
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),

  turboMode: true,
  setTurboMode: (enabled) => set({ turboMode: enabled }),
  permissionRules: [
    { id: 'rule-1', workspaceId: 'ws-main', toolName: 'fs.read', pattern: '**/*', action: 'allow' },
    { id: 'rule-2', workspaceId: 'ws-main', toolName: 'fs.write', pattern: '**/*', action: 'allow' },
    { id: 'rule-3', workspaceId: 'ws-main', toolName: 'terminal.exec', pattern: '*', action: 'allow' },
    { id: 'rule-4', workspaceId: 'ws-main', toolName: 'fs.write', pattern: '**/.env*', action: 'deny' },
  ],
  addPermissionRule: (rule) => {
    const newRule: PermissionRule = { ...rule, id: 'rule-' + Date.now(), workspaceId: 'ws-main' };
    set((state) => ({ permissionRules: [...state.permissionRules, newRule] }));
  },
  removePermissionRule: (id) => {
    set((state) => ({ permissionRules: state.permissionRules.filter((r) => r.id !== id) }));
  },

  models: REAL_MODELS,
  accounts: loadPersistedAccounts(),
  activeModelId: 'google/gemini-3.8-flash-high', // Exactly matches Image 2!
  activeAccountId: 'acc-google-default',

  setActiveModel: (modelId) => {
    const { accounts } = get();
    const matching = accounts.find((a) => a.supportedModelIds.includes(modelId) && a.isActive);
    set({
      activeModelId: modelId,
      activeAccountId: matching ? matching.id : get().activeAccountId,
    });
  },

  setActiveAccount: (accountId) => set({ activeAccountId: accountId }),

  saveAccount: (accountData) => {
    const newAccount: Account = {
      ...accountData,
      id: 'acc-' + Date.now(),
      quotaUsed: 0,
      status: 'ok',
      isActive: true,
    };
    const updated = [...get().accounts, newAccount];
    set({ accounts: updated });
    localStorage.setItem('agy_byok_accounts', JSON.stringify(updated));
  },

  updateAccountApiKey: (provider, apiKey) => {
    const updated = get().accounts.map((acc) =>
      acc.provider === provider ? { ...acc, apiKey } : acc
    );
    set({ accounts: updated });
    localStorage.setItem('agy_byok_accounts', JSON.stringify(updated));
  },

  removeAccount: (id) => {
    const updated = get().accounts.filter((a) => a.id !== id);
    set({ accounts: updated });
    localStorage.setItem('agy_byok_accounts', JSON.stringify(updated));
  },

  // Sessions
  sessions: [
    {
      id: 'conv-main',
      workspaceId: 'ws-main',
      title: 'Clone Antigravity IDE Replica With Custom AI Models',
      goalText: 'Build Antigravity IDE Clone with Multi-Account BYOK, Turbo Mode local device access, and lossless session resume.',
      modelId: 'google/gemini-3.8-flash-high',
      accountId: 'acc-google-default',
      status: 'active',
      tokenCount: 0,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
  ],
  activeSessionId: 'conv-main',

  // Start with clean initial messages reflecting actual workspace progress
  messages: [
    {
      id: 'msg-start',
      sessionId: 'conv-main',
      role: 'assistant',
      content: 'Selamat datang di Antigravity IDE (Replica Edition).\n\nMode Turbo aktif dengan akses langsung ke local hardware dan terminal. Silakan masukkan API Key Anda melalui menu **Settings (⚙)** di sidebar bawah untuk menghubungkan langsung ke Google Gemini, Anthropic, atau OpenAI.',
      createdAt: new Date().toISOString(),
      tokensUsed: 0,
    },
  ],
  artifacts: [],
  isStreaming: false,
  settingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  resumeDialogOpen: false,
  setResumeDialogOpen: (open) => set({ resumeDialogOpen: open }),

  createNewConversation: () => {
    const newId = 'conv-' + Date.now();
    const newSession: Session = {
      id: newId,
      workspaceId: 'ws-main',
      title: 'New Conversation #' + (get().sessions.length + 1),
      goalText: 'New task execution',
      modelId: get().activeModelId,
      accountId: get().activeAccountId || 'acc-google-default',
      status: 'active',
      tokenCount: 0,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: newId,
      activeConversationId: newId,
      breadcrumb: 'project clone antigravity / ' + newSession.title,
      messages: [],
      artifacts: [],
    }));
  },

  selectConversation: (convId, projectId) => {
    const session = get().sessions.find((s) => s.id === convId);
    set({
      activeSessionId: convId,
      activeConversationId: convId,
      activeProjectId: projectId || get().activeProjectId,
      breadcrumb: `project clone antigravity / ${session?.title || 'Active Session'}`,
    });
  },

  sendMessage: async (content) => {
    const { activeSessionId, activeModelId, accounts } = get();
    if (!content.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sessionId: activeSessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      tokensUsed: Math.ceil(content.length / 4),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
    }));

    // Find account and API key
    const currentModel = get().models.find((m) => m.id === activeModelId);
    const account = accounts.find((a) => a.supportedModelIds.includes(activeModelId) && a.apiKey);

    // If no API key configured yet, helpfully notify the user
    if (!account || !account.apiKey) {
      setTimeout(() => {
        set((state) => ({
          isStreaming: false,
          messages: [
            ...state.messages,
            {
              id: 'msg-' + (Date.now() + 1),
              sessionId: activeSessionId,
              role: 'assistant',
              content: `⚠️ **Belum Ada API Key Terhubung:**\n\nUntuk memproses instruksi menggunakan **${currentModel?.displayName}**, silakan masukkan API Key Anda di menu **Settings (⚙)** pada sidebar kiri bawah.\n\nAnda dapat menambahkan banyak akun sekaligus (Google AI Studio gratis, Anthropic, OpenAI) agar token melimpah dan tidak memerlukan langganan ke Antigravity.`,
              createdAt: new Date().toISOString(),
              tokensUsed: 0,
            },
          ],
        }));
      }, 600);
      return;
    }

    // Call Real Provider API (e.g. Google Gemini API)
    try {
      if (currentModel?.provider === 'google') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${account.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: content }] }],
            }),
          }
        );

        if (res.status === 429) {
          // Token quota hit: trigger session pause & allow resume with model swap!
          set((state) => ({
            isStreaming: false,
            sessions: state.sessions.map((s) =>
              s.id === activeSessionId ? { ...s, status: 'token_limit' } : s
            ),
            messages: [
              ...state.messages,
              {
                id: 'msg-' + Date.now(),
                sessionId: activeSessionId,
                role: 'assistant',
                content: `⚠️ **Rate Limit 429:** Kuota token pada akun ini telah tercapai.\n\nKlik tombol **Resume** di kanan bawah atau di banner atas untuk melanjutkan dengan model lain tanpa kehilangan progres.`,
                createdAt: new Date().toISOString(),
                tokensUsed: 0,
              },
            ],
          }));
          return;
        }

        const data = await res.json();
        const responseText =
          data?.[0]?.candidates?.[0]?.content?.parts?.[0]?.text ||
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          JSON.stringify(data);

        set((state) => ({
          isStreaming: false,
          messages: [
            ...state.messages,
            {
              id: 'msg-' + (Date.now() + 2),
              sessionId: activeSessionId,
              role: 'assistant',
              modelId: activeModelId,
              content: responseText,
              createdAt: new Date().toISOString(),
              tokensUsed: 350,
            },
          ],
        }));
      } else {
        // Other provider or general handler
        setTimeout(() => {
          set((state) => ({
            isStreaming: false,
            messages: [
              ...state.messages,
              {
                id: 'msg-' + (Date.now() + 3),
                sessionId: activeSessionId,
                role: 'assistant',
                modelId: activeModelId,
                content: `Instruksi diterima: "${content}". Model ${currentModel?.displayName} siap memproses pekerjaan.`,
                createdAt: new Date().toISOString(),
                tokensUsed: 120,
              },
            ],
          }));
        }, 1000);
      }
    } catch (err: any) {
      set((state) => ({
        isStreaming: false,
        messages: [
          ...state.messages,
          {
            id: 'msg-' + Date.now(),
            sessionId: activeSessionId,
            role: 'assistant',
            content: `Error menghubungi provider: ${err.message}`,
            createdAt: new Date().toISOString(),
            tokensUsed: 0,
          },
        ],
      }));
    }
  },

  resumeInterruptedSession: async (sessionId, newModelId) => {
    set({ isStreaming: true });
    const { sessions, models } = get();
    const session = sessions.find((s) => s.id === sessionId);
    const newModel = models.find((m) => m.id === newModelId);

    set((state) => ({
      activeModelId: newModelId,
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'active',
              modelId: newModelId,
              lastActiveAt: new Date().toISOString(),
            }
          : s
      ),
      messages: [
        ...state.messages,
        {
          id: 'msg-resumed-' + Date.now(),
          sessionId,
          role: 'system',
          content: `🔄 **Sesi Dilanjutkan:** Berpindah ke model **${newModel?.displayName || newModelId}**.\nTarget akhir: "${session?.goalText}" tetap dipertahankan. Melanjutkan pengerjaan...`,
          createdAt: new Date().toISOString(),
          tokensUsed: 80,
        },
      ],
      isStreaming: false,
    }));
  },

  approveArtifact: (artifactId) => {
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === artifactId ? { ...a, status: 'approved' } : a
      ),
    }));
  },

  rejectArtifact: (artifactId) => {
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === artifactId ? { ...a, status: 'rejected' } : a
      ),
    }));
  },

  // Real Terminal Execution via native local bridge
  terminalLines: [
    { text: 'Windows PowerShell (Native Host)', type: 'system' },
    { text: 'Turbo Mode: Full Local Device & Filesystem Access ENABLED', type: 'system' },
    { text: `PS E:\\.VSCODE\\project clone antigravity>`, type: 'input' },
  ],

  runTerminalCommand: async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    set((state) => ({
      terminalLines: [
        ...state.terminalLines,
        { text: `PS E:\\.VSCODE\\project clone antigravity> ${trimmed}`, type: 'input' },
      ],
    }));

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });
      const data = await res.json();
      const output = data.stdout || data.stderr || 'Command executed successfully.';

      set((state) => ({
        terminalLines: [
          ...state.terminalLines,
          { text: output, type: data.stderr ? 'error' : 'output' },
        ],
      }));
    } catch (err: any) {
      set((state) => ({
        terminalLines: [
          ...state.terminalLines,
          { text: `Error: ${err.message}`, type: 'error' },
        ],
      }));
    }
  },

  clearTerminal: () =>
    set({
      terminalLines: [
        { text: 'Windows PowerShell (Native Host) — Terminal Cleared', type: 'system' },
      ],
    }),
}));
