import { create } from 'zustand';
import { Model, Account, Session, Message, Artifact, PermissionRule, WorkspaceFile } from '../types';

interface IDEState {
  // Navigation / Active View
  activeSidebarTab: 'explorer' | 'chat' | 'agents' | 'accounts' | 'settings';
  setActiveSidebarTab: (tab: 'explorer' | 'chat' | 'agents' | 'accounts' | 'settings') => void;

  // Workspace & Files
  workspacePath: string;
  files: WorkspaceFile[];
  activeFilePath: string | null;
  openFiles: string[];
  fileContents: Record<string, string>;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;

  // Turbo Mode & Permissions
  turboMode: boolean;
  setTurboMode: (enabled: boolean) => void;
  permissionRules: PermissionRule[];
  addPermissionRule: (rule: Omit<PermissionRule, 'id' | 'workspaceId'>) => void;
  removePermissionRule: (id: string) => void;

  // Models & Accounts (BYOK)
  models: Model[];
  accounts: Account[];
  activeModelId: string;
  activeAccountId: string;
  setActiveModel: (modelId: string) => void;
  setActiveAccount: (accountId: string) => void;
  addAccount: (account: Omit<Account, 'id' | 'quotaUsed' | 'status' | 'isActive'>) => void;
  removeAccount: (id: string) => void;
  updateAccountQuota: (id: string, used: number, status?: Account['status']) => void;
  rotateAccountForModel: (modelId: string) => boolean;

  // Sessions & Chat
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  artifacts: Artifact[];
  isStreaming: boolean;
  resumeDialogOpen: boolean;
  setResumeDialogOpen: (open: boolean) => void;
  
  createSession: (title: string, goal: string) => string;
  selectSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  resumeInterruptedSession: (sessionId: string, newModelId: string, newAccountId?: string) => Promise<void>;
  approveArtifact: (artifactId: string) => void;
  rejectArtifact: (artifactId: string) => void;
  compactCurrentSession: () => void;

  // Terminal
  terminalLines: { text: string; type: 'input' | 'output' | 'error' | 'system' }[];
  runTerminalCommand: (cmd: string) => void;
  clearTerminal: () => void;
}

// Initial Seed Models (Free, Pro, BYOK, Open Weights)
const INITIAL_MODELS: Model[] = [
  {
    id: 'google/gemini-2.5-flash',
    provider: 'google',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
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
    id: 'anthropic/claude-3-5-haiku',
    provider: 'anthropic',
    name: 'claude-3-5-haiku',
    displayName: 'Claude 3.5 Haiku',
    contextWindow: 200000,
    supportsThinking: false,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
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
];

// Initial Accounts configured by user
const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-google-1',
    provider: 'google',
    label: 'Personal Google AI Studio (Key #1)',
    apiKey: 'AIzaSyD-mock-google-studio-key-primary-9901',
    priorityOrder: 1,
    quotaUsed: 145000,
    quotaLimit: 200000, // Near limit to test rotation
    status: 'ok',
    isActive: true,
    supportedModelIds: ['google/gemini-2.5-flash', 'google/gemini-2.5-pro'],
  },
  {
    id: 'acc-google-2',
    provider: 'google',
    label: 'Backup Google AI Account (Key #2)',
    apiKey: 'AIzaSyD-mock-google-studio-key-backup-8823',
    priorityOrder: 2,
    quotaUsed: 12000,
    quotaLimit: 1000000,
    status: 'ok',
    isActive: true,
    supportedModelIds: ['google/gemini-2.5-flash', 'google/gemini-2.5-pro'],
  },
  {
    id: 'acc-anthropic-1',
    provider: 'anthropic',
    label: 'Anthropic BYOK (Work Account)',
    apiKey: 'sk-ant-mock-key-development-tier4-1144',
    priorityOrder: 3,
    quotaUsed: 198000,
    quotaLimit: 200000, // Exhausted/Rate-limited candidate
    quotaResetAt: 'Resets in 4h 12m',
    status: 'rate_limited',
    isActive: true,
    supportedModelIds: ['anthropic/claude-3-7-sonnet', 'anthropic/claude-3-5-haiku'],
  },
  {
    id: 'acc-openai-1',
    provider: 'openai',
    label: 'OpenAI Pay-as-you-go',
    apiKey: 'sk-proj-mock-openai-key-prod-5542',
    priorityOrder: 4,
    quotaUsed: 35000,
    quotaLimit: 500000,
    status: 'ok',
    isActive: true,
    supportedModelIds: ['openai/gpt-4o', 'openai/o3-mini'],
  },
];

const INITIAL_FILES: WorkspaceFile[] = [
  {
    name: 'src',
    path: 'src',
    type: 'directory',
    children: [
      {
        name: 'app.service.ts',
        path: 'src/app.service.ts',
        type: 'file',
      },
      {
        name: 'auth.controller.ts',
        path: 'src/auth.controller.ts',
        type: 'file',
      },
      {
        name: 'database.ts',
        path: 'src/database.ts',
        type: 'file',
      },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
  },
];

const INITIAL_FILE_CONTENTS: Record<string, string> = {
  'src/app.service.ts': `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Antigravity AI Engine!';
  }

  async processTask(taskId: string): Promise<{ status: string }> {
    // Background worker integration
    console.log('Processing task in Turbo Mode:', taskId);
    return { status: 'completed' };
  }
}
`,
  'src/auth.controller.ts': `import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() credentials: any) {
    // Multi-account credential verification
    return { token: 'jwt-auth-session-valid' };
  }
}
`,
  'src/database.ts': `// Local database configuration for Antigravity Replica
export const dbConfig = {
  driver: 'sqlite3',
  filename: './data/ide_replica.sqlite',
  walMode: true,
};
`,
  'package.json': `{
  "name": "enterprise-backend-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "sqlite3": "^5.1.7"
  }
}
`,
  'README.md': `# Enterprise Backend Service
Target project managed by Antigravity Replica with multi-model AI coding harness.
- Turbo Mode: Full local hardware and disk access enabled.
- Auto-failover: Seamless token rotation between provider keys.
`,
};

// Seed an initial interrupted session to demonstrate the resume feature right away!
const INITIAL_SESSION: Session = {
  id: 'sess-interrupted-01',
  workspaceId: 'ws-main',
  title: 'Implement Multi-Account Quota Failover',
  goalText: 'Build the token quota balancer that switches API keys when Anthropic 429 occurs, while preserving the full architectural diff.',
  modelId: 'anthropic/claude-3-7-sonnet',
  accountId: 'acc-anthropic-1',
  status: 'token_limit',
  tokenCount: 198500,
  createdAt: '2026-11-16T22:15:00Z',
  lastActiveAt: '2026-11-16T22:30:00Z',
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sessionId: 'sess-interrupted-01',
    role: 'user',
    content: 'Tolong buatkan fungsi failover otomatis untuk multi-account token manager di src/app.service.ts agar jika akun terkena 429 atau kuota habis, sesi coding bisa dilanjutkan ke akun cadangan.',
    createdAt: '2026-11-16T22:15:00Z',
    tokensUsed: 150,
  },
  {
    id: 'msg-2',
    sessionId: 'sess-interrupted-01',
    role: 'assistant',
    modelId: 'anthropic/claude-3-7-sonnet',
    accountId: 'acc-anthropic-1',
    content: 'Tentu! Saya sedang menyiapkan Implementation Plan dan perubahan kode pada `src/app.service.ts`. Saya akan menambahkan interceptor untuk error rate limit 429 dan automatic key cycling.',
    createdAt: '2026-11-16T22:16:10Z',
    tokensUsed: 850,
    artifacts: [
      {
        id: 'art-plan-1',
        sessionId: 'sess-interrupted-01',
        messageId: 'msg-2',
        type: 'plan',
        title: 'Plan: Token Pool & Auto-Rotation Architecture',
        content: `### Implementation Plan:
1. Definisikan Priority Queue untuk daftar API Keys.
2. Intercept HTTP 429 / InsufficientQuota error pada Vercel AI SDK runtime.
3. Automatically mark exhausted key as rate_limited with TTL from Retry-After header.
4. Hot-swap active credential and replay last prompt payload without user interruption.`,
        status: 'approved',
        createdAt: '2026-11-16T22:16:30Z',
      },
    ],
  },
  {
    id: 'msg-3',
    sessionId: 'sess-interrupted-01',
    role: 'tool',
    content: 'Error: Rate limit exceeded (429). Quota exhausted on account "Anthropic BYOK (Work Account)". Context window reached 198,500 tokens.',
    createdAt: '2026-11-16T22:17:00Z',
    tokensUsed: 40,
  },
  {
    id: 'msg-4',
    sessionId: 'sess-interrupted-01',
    role: 'assistant',
    modelId: 'anthropic/claude-3-7-sonnet',
    accountId: 'acc-anthropic-1',
    content: '⚠️ **Sesi terhenti karena kuota token habis (Rate Limit 429)** pada akun Anthropic.\n\nAnda dapat melanjutkan sesi ini dengan berpindah ke model atau akun cadangan (misalnya Gemini 2.5 Pro atau OpenAI) melalui tombol **Resume Session** tanpa kehilangan progres maupun rencana kode.',
    createdAt: '2026-11-16T22:17:15Z',
    tokensUsed: 95,
  },
];

export const useIDEStore = create<IDEState>((set, get) => ({
  activeSidebarTab: 'chat',
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  workspacePath: 'E:/.VSCODE/enterprise-backend',
  files: INITIAL_FILES,
  activeFilePath: 'src/app.service.ts',
  openFiles: ['src/app.service.ts', 'src/auth.controller.ts'],
  fileContents: INITIAL_FILE_CONTENTS,

  openFile: (path) => {
    const { openFiles } = get();
    if (!openFiles.includes(path)) {
      set({ openFiles: [...openFiles, path], activeFilePath: path });
    } else {
      set({ activeFilePath: path });
    }
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath } = get();
    const filtered = openFiles.filter((p) => p !== path);
    set({
      openFiles: filtered,
      activeFilePath: activeFilePath === path ? (filtered[0] || null) : activeFilePath,
    });
  },

  updateFileContent: (path, content) => {
    set((state) => ({
      fileContents: {
        ...state.fileContents,
        [path]: content,
      },
    }));
  },

  turboMode: true, // Default to true as user requested full local device access!
  setTurboMode: (enabled) => set({ turboMode: enabled }),

  permissionRules: [
    { id: 'rule-1', workspaceId: 'ws-main', toolName: 'fs.read', pattern: '**/*', action: 'allow' },
    { id: 'rule-2', workspaceId: 'ws-main', toolName: 'fs.write', pattern: '**/*', action: 'allow' },
    { id: 'rule-3', workspaceId: 'ws-main', toolName: 'terminal.exec', pattern: '*', action: 'allow' },
    { id: 'rule-4', workspaceId: 'ws-main', toolName: 'fs.write', pattern: '**/.env*', action: 'ask' },
  ],

  addPermissionRule: (rule) => {
    const newRule: PermissionRule = {
      ...rule,
      id: 'rule-' + Date.now(),
      workspaceId: 'ws-main',
    };
    set((state) => ({ permissionRules: [...state.permissionRules, newRule] }));
  },

  removePermissionRule: (id) => {
    set((state) => ({
      permissionRules: state.permissionRules.filter((r) => r.id !== id),
    }));
  },

  models: INITIAL_MODELS,
  accounts: INITIAL_ACCOUNTS,
  activeModelId: 'google/gemini-2.5-pro',
  activeAccountId: 'acc-google-1',

  setActiveModel: (modelId) => {
    const { accounts } = get();
    // Auto-select a valid account that supports this model
    const matchingAccount = accounts.find(
      (a) => a.supportedModelIds.includes(modelId) && a.status === 'ok'
    );
    set({
      activeModelId: modelId,
      activeAccountId: matchingAccount ? matchingAccount.id : get().activeAccountId,
    });
  },

  setActiveAccount: (accountId) => set({ activeAccountId: accountId }),

  addAccount: (accountData) => {
    const newAccount: Account = {
      ...accountData,
      id: 'acc-' + Date.now(),
      quotaUsed: 0,
      status: 'ok',
      isActive: true,
    };
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
  },

  removeAccount: (id) => {
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  updateAccountQuota: (id, used, status) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, quotaUsed: used, ...(status ? { status } : {}) } : acc
      ),
    }));
  },

  rotateAccountForModel: (modelId) => {
    const { accounts, activeAccountId } = get();
    const available = accounts.filter(
      (a) => a.id !== activeAccountId && a.supportedModelIds.includes(modelId) && a.status === 'ok'
    );
    if (available.length > 0) {
      // Pick next highest priority
      available.sort((a, b) => a.priorityOrder - b.priorityOrder);
      const nextAcc = available[0];
      set({ activeAccountId: nextAcc.id });
      return true;
    }
    return false;
  },

  sessions: [INITIAL_SESSION],
  activeSessionId: 'sess-interrupted-01',
  messages: INITIAL_MESSAGES,
  artifacts: INITIAL_MESSAGES.flatMap((m) => m.artifacts || []),
  isStreaming: false,
  resumeDialogOpen: false,
  setResumeDialogOpen: (open) => set({ resumeDialogOpen: open }),

  createSession: (title, goal) => {
    const newSession: Session = {
      id: 'sess-' + Date.now(),
      workspaceId: 'ws-main',
      title,
      goalText: goal,
      modelId: get().activeModelId,
      accountId: get().activeAccountId,
      status: 'active',
      tokenCount: 0,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    set((state) => ({
      sessions: [newSession, ...state.sessions],
      activeSessionId: newSession.id,
      messages: [],
      artifacts: [],
    }));
    return newSession.id;
  },

  selectSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  sendMessage: async (content) => {
    const { activeSessionId, activeModelId, activeAccountId, accounts, turboMode } = get();
    if (!activeSessionId) return;

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

    // Check account quota simulation
    const currentAccount = accounts.find((a) => a.id === activeAccountId);
    if (currentAccount && currentAccount.quotaLimit > 0 && currentAccount.quotaUsed >= currentAccount.quotaLimit) {
      // Quota limit hit! Test auto-rotation or trigger session pause
      const rotated = get().rotateAccountForModel(activeModelId);
      if (!rotated) {
        // Halt session with token_limit so user can resume
        set((state) => ({
          isStreaming: false,
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, status: 'token_limit' } : s
          ),
          messages: [
            ...state.messages,
            {
              id: 'msg-' + (Date.now() + 1),
              sessionId: activeSessionId,
              role: 'assistant',
              content: `⚠️ Kuota token pada akun "${currentAccount.label}" telah tercapai (100%). Sesi dijeda agar Anda dapat melanjutkan dengan akun atau model lain tanpa kehilangan progress.`,
              tokensUsed: 25,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return;
      }
    }

    // Simulate Agent autonomous response with real code modifications & artifacts
    setTimeout(() => {
      const isFileRequest = content.toLowerCase().includes('buat') || content.toLowerCase().includes('failover') || content.toLowerCase().includes('kode');
      
      const newArtifact: Artifact | undefined = isFileRequest ? {
        id: 'art-' + Date.now(),
        sessionId: activeSessionId,
        type: 'diff',
        title: 'Update src/app.service.ts — Auto-Rotation Logic',
        path: 'src/app.service.ts',
        diffBefore: get().fileContents['src/app.service.ts'],
        diffAfter: `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private keyPool = [
    { key: 'primary', quota: 200000, used: 145000 },
    { key: 'secondary', quota: 1000000, used: 12000 },
  ];

  getHello(): string {
    return 'Antigravity Replica: Token Pool Balanced & Ready';
  }

  async executeWithFailover(taskFn: Function) {
    for (const keyConfig of this.keyPool) {
      try {
        console.log(\`Executing via key pool entry: \${keyConfig.key}\`);
        return await taskFn(keyConfig);
      } catch (err: any) {
        if (err.status === 429) {
          console.warn('Rate limit hit. Rotating key pool seamlessly...');
          continue;
        }
        throw err;
      }
    }
  }
}
`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      } : undefined;

      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 2),
        sessionId: activeSessionId,
        role: 'assistant',
        modelId: activeModelId,
        accountId: activeAccountId,
        content: `Saya telah memproses permintaan Anda.\n\n${turboMode ? '⚡ **Turbo Mode Aktif:** Izin penuh local hardware & filesystem digunakan tanpa pembatasan sandbox.' : 'Standard Sandbox Mode.'}\n\nPerubahan kode telah disiapkan dalam bentuk **Diff Artifact**. Silakan review dan klik **Approve** untuk menerapkannya langsung ke file.`,
        tokensUsed: 620,
        artifacts: newArtifact ? [newArtifact] : undefined,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        artifacts: newArtifact ? [...state.artifacts, newArtifact] : state.artifacts,
        isStreaming: false,
      }));

      // If turbo mode, also simulate terminal activity
      if (turboMode) {
        get().runTerminalCommand(`npx tsc --noEmit --project ./tsconfig.json`);
      }
    }, 1200);
  },

  resumeInterruptedSession: async (sessionId, newModelId, newAccountId) => {
    set({ isStreaming: true });

    const { sessions, accounts, models } = get();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Pick suitable account for the selected model
    const accId = newAccountId || accounts.find((a) => a.supportedModelIds.includes(newModelId) && a.status === 'ok')?.id || get().activeAccountId;
    const model = models.find((m) => m.id === newModelId);
    const account = accounts.find((a) => a.id === accId);

    // Update session with new model and account
    set((state) => ({
      activeSessionId: sessionId,
      activeModelId: newModelId,
      activeAccountId: accId,
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'active',
              modelId: newModelId,
              accountId: accId,
              lastActiveAt: new Date().toISOString(),
            }
          : s
      ),
    }));

    // Inject system continuation turn
    const continuationMsg: Message = {
      id: 'msg-' + Date.now(),
      sessionId,
      role: 'system',
      content: `🔄 **Sesi Dilanjutkan:** Berpindah ke model **${model?.displayName}** menggunakan akun **${account?.label}**.\n\nKonteks sebelumnya tetap utuh. Melanjutkan progres menuju goal: "${session.goalText}"...`,
      tokensUsed: 120,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, continuationMsg],
    }));

    // Agent resumes generation toward the final goal
    setTimeout(() => {
      const resolvedArtifact: Artifact = {
        id: 'art-resumed-' + Date.now(),
        sessionId,
        type: 'diff',
        title: 'src/app.service.ts — Completed Implementation',
        path: 'src/app.service.ts',
        diffBefore: get().fileContents['src/app.service.ts'],
        diffAfter: `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Production Token Failover Engine
  private readonly accounts = [
    { id: 'primary', provider: 'google', rateLimitUntil: 0 },
    { id: 'backup', provider: 'openai', rateLimitUntil: 0 },
  ];

  async executeAutonomousTask(goal: string) {
    console.log(\`Running goal: "\${goal}" across active model stream.\`);
    return { success: true, timestamp: Date.now() };
  }
}
`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const finalAssistantMsg: Message = {
        id: 'msg-' + (Date.now() + 10),
        sessionId,
        role: 'assistant',
        modelId: newModelId,
        accountId: accId,
        content: `✅ **Progres Berhasil Dilanjutkan Tanpa Mengubah Goal Akhir!**\n\nMeskipun model sebelumnya (${session.modelId}) kehabisan kuota, saya telah membaca seluruh riwayat konteks dan merampungkan tugas sesuai rencana.\n\nDiff kode telah diperbarui dan siap di-approve ke workspace Anda.`,
        tokensUsed: 780,
        artifacts: [resolvedArtifact],
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, finalAssistantMsg],
        artifacts: [...state.artifacts, resolvedArtifact],
        isStreaming: false,
      }));
    }, 1500);
  },

  approveArtifact: (artifactId) => {
    const { artifacts } = get();
    const art = artifacts.find((a) => a.id === artifactId);
    if (!art) return;

    if (art.type === 'diff' && art.path && art.diffAfter) {
      set((state) => ({
        fileContents: {
          ...state.fileContents,
          [art.path!]: art.diffAfter!,
        },
        artifacts: state.artifacts.map((a) =>
          a.id === artifactId ? { ...a, status: 'approved' } : a
        ),
      }));
      get().runTerminalCommand(`git diff ${art.path}`);
      get().runTerminalCommand(`[Turbo File Write] Applied changes directly to ${art.path}`);
    } else {
      set((state) => ({
        artifacts: state.artifacts.map((a) =>
          a.id === artifactId ? { ...a, status: 'approved' } : a
        ),
      }));
    }
  },

  rejectArtifact: (artifactId) => {
    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === artifactId ? { ...a, status: 'rejected' } : a
      ),
    }));
  },

  compactCurrentSession: () => {
    const { activeSessionId, sessions } = get();
    if (!activeSessionId) return;

    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const summary = `Session goal: "${session.goalText}". Plan approved. Token failover logic written and ready for deployment.`;
    
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              compactSummary: summary,
              tokenCount: Math.max(1000, Math.floor(s.tokenCount * 0.2)),
            }
          : s
      ),
      messages: [
        ...state.messages,
        {
          id: 'msg-compact-' + Date.now(),
          sessionId: activeSessionId,
          role: 'system',
          content: `🧹 **Context Compaction Selesai:** 80% token historis telah diringkas menjadi rangkuman terstruktur. Sesi sekarang memiliki ruang konteks luas untuk melanjutkan instruksi berikutnya.`,
          tokensUsed: 150,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  terminalLines: [
    { text: 'Antigravity Local Environment v2.31.2 (Replica Native Engine)', type: 'system' },
    { text: 'Turbo Mode: Full Local Filesystem & Hardware Access ENABLED', type: 'system' },
    { text: 'Connected to local workspace: E:/.VSCODE/enterprise-backend', type: 'system' },
    { text: '$ git status --short', type: 'input' },
    { text: ' M src/app.service.ts', type: 'output' },
  ],

  runTerminalCommand: (cmd) => {
    const { turboMode } = get();
    set((state) => ({
      terminalLines: [
        ...state.terminalLines,
        { text: `$ ${cmd}`, type: 'input' },
        {
          text: turboMode
            ? `[Turbo Execution] Process completed on native host (exit code 0)`
            : `[Sandboxed] Command completed inside workspace boundary`,
          type: 'output',
        },
      ],
    }));
  },

  clearTerminal: () => set({ terminalLines: [] }),
}));
