// Data contracts mapped from replica/schema.sql

export type ProviderType = 'google' | 'anthropic' | 'openai' | 'custom';

export interface Model {
  id: string; // e.g. "google/gemini-2.5-pro", "anthropic/claude-3-7-sonnet"
  provider: ProviderType;
  name: string;
  displayName: string;
  contextWindow: number;
  supportsThinking: boolean;
  costPer1kInput: number;
  costPer1kOutput: number;
  isByok: boolean;
  isEnabled: boolean;
}

export interface Account {
  id: string;
  provider: ProviderType;
  label: string;
  apiKey: string; // masked in UI, stored in simulated secure vault
  baseUrl?: string;
  priorityOrder: number;
  quotaUsed: number;
  quotaLimit: number; // 0 for unlimited / pay-per-token
  quotaResetAt?: string;
  status: 'ok' | 'rate_limited' | 'error' | 'disabled';
  isActive: boolean;
  supportedModelIds: string[];
}

export interface Artifact {
  id: string;
  sessionId: string;
  messageId?: string;
  type: 'plan' | 'diff' | 'screenshot' | 'terminal' | 'generic';
  title: string;
  content?: string; // markdown, code, or JSON
  path?: string;
  diffBefore?: string;
  diffAfter?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  modelId?: string;
  accountId?: string;
  tokensUsed: number;
  artifacts?: Artifact[];
  createdAt: string;
}

export interface Session {
  id: string;
  workspaceId: string;
  parentId?: string; // forked from
  title: string;
  goalText: string;
  modelId: string;
  accountId: string;
  status: 'active' | 'paused' | 'completed' | 'token_limit' | 'compacting';
  tokenCount: number;
  compactSummary?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface PermissionRule {
  id: string;
  workspaceId: string;
  toolName: string;
  pattern: string; // glob
  action: 'allow' | 'deny' | 'ask';
}

export interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: WorkspaceFile[];
}
