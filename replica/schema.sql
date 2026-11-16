-- ============================================================
-- Antigravity IDE Clone — SQLite Schema (v2 — FINAL)
-- File: replica/schema.sql
-- ============================================================
-- Base: VS Code fork (microsoft/vscode open source) + Electron.
-- SQLite dialect. All timestamps stored as ISO-8601 text UTC.
-- Two storage layers:
--   1. LevelDB  — VS Code built-in; KV cache for token state,
--                 file index, quick metadata (via VS Code API).
--   2. SQLite   — this file; relational; sessions, messages,
--                 artifacts, checkpoints, accounts, plugins.
--                 Stored at: globalStorageUri/db.sqlite
--                 (compiled with electron-rebuild for VS Code ABI)
-- Sensitive fields: api_key_ref / auth_vars_ref store a keychain
-- reference key (keytar), NEVER the raw secret.
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- models  (seeded at startup, user can add custom)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  id              TEXT PRIMARY KEY,          -- e.g. "anthropic/claude-sonnet-4-5"
  provider        TEXT NOT NULL,             -- google | anthropic | openai | custom
  name            TEXT NOT NULL,             -- claude-sonnet-4-5
  display_name    TEXT NOT NULL,             -- Claude Sonnet 4.5
  context_window  INTEGER NOT NULL DEFAULT 200000,
  supports_thinking INTEGER NOT NULL DEFAULT 0, -- bool 0/1
  cost_per_1k_input  REAL NOT NULL DEFAULT 0,
  cost_per_1k_output REAL NOT NULL DEFAULT 0,
  is_byok         INTEGER NOT NULL DEFAULT 1,
  is_enabled      INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ------------------------------------------------------------
-- accounts  (BYOK — one row per API key / provider account)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  provider        TEXT NOT NULL,             -- google | anthropic | openai | custom
  label           TEXT NOT NULL,             -- user-chosen, e.g. "Work Claude"
  api_key_ref     TEXT NOT NULL,             -- keychain reference key, NOT the raw key
  base_url        TEXT,                      -- NULL = use provider default
  priority_order  INTEGER NOT NULL DEFAULT 0,-- lower = tried first
  quota_used      INTEGER NOT NULL DEFAULT 0,-- tokens used this window
  quota_limit     INTEGER NOT NULL DEFAULT 0,-- 0 = unknown / unlimited
  quota_reset_at  TEXT,                      -- ISO-8601 or NULL
  status          TEXT NOT NULL DEFAULT 'ok'
                  CHECK (status IN ('ok','rate_limited','error','disabled')),
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_accounts_priority ON accounts(priority_order, status);

-- ------------------------------------------------------------
-- account_model_support  (which accounts support which models)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_model_support (
  account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  model_id    TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  PRIMARY KEY (account_id, model_id)
);

-- ------------------------------------------------------------
-- workspaces  (one per local project folder)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT NOT NULL,
  path          TEXT NOT NULL UNIQUE,        -- absolute local path
  turbo_mode    INTEGER NOT NULL DEFAULT 0,
  config        TEXT NOT NULL DEFAULT '{}',  -- JSON blob
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ------------------------------------------------------------
-- permission_rules  (allow / deny / ask per workspace + tool)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permission_rules (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_name     TEXT NOT NULL,               -- e.g. "fs.write" or "*"
  pattern       TEXT NOT NULL DEFAULT '*',   -- glob, e.g. "/home/user/secrets/**"
  action        TEXT NOT NULL DEFAULT 'ask'
                CHECK (action IN ('allow','deny','ask')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_perm_workspace ON permission_rules(workspace_id, tool_name);

-- ------------------------------------------------------------
-- sessions  (one conversation / task)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id       TEXT REFERENCES sessions(id) ON DELETE SET NULL, -- fork parent
  title           TEXT NOT NULL DEFAULT 'New Session',
  goal_text       TEXT,
  model_id        TEXT REFERENCES models(id) ON DELETE SET NULL,
  account_id      TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','completed','token_limit','compacting')),
  token_count     INTEGER NOT NULL DEFAULT 0,
  compact_summary TEXT,                      -- compacted context summary text
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_active_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status    ON sessions(status);

-- ------------------------------------------------------------
-- messages  (each turn in a session)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content       TEXT NOT NULL,
  model_id      TEXT REFERENCES models(id) ON DELETE SET NULL,
  account_id    TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  tokens_used   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

-- ------------------------------------------------------------
-- artifacts  (agent-produced structured outputs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  message_id    TEXT REFERENCES messages(id) ON DELETE SET NULL,
  type          TEXT NOT NULL DEFAULT 'generic'
                CHECK (type IN ('plan','diff','screenshot','terminal','generic')),
  content       TEXT NOT NULL,               -- JSON or markdown
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id, type);

-- ------------------------------------------------------------
-- checkpoints  (rewind / fork points within a session)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkpoints (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'checkpoint',
  message_id    TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  token_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_checkpoints_session ON checkpoints(session_id, created_at);

-- ------------------------------------------------------------
-- plugins  (MCP servers, skills, subagents)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugins (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT NOT NULL UNIQUE,
  source_url    TEXT,
  type          TEXT NOT NULL DEFAULT 'mcp'
                CHECK (type IN ('mcp','skill','agent')),
  config        TEXT NOT NULL DEFAULT '{}',  -- JSON
  auth_vars_ref TEXT,                        -- keychain reference for secrets
  is_enabled    INTEGER NOT NULL DEFAULT 1,
  installed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ------------------------------------------------------------
-- slash_commands  (built-in + plugin-contributed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slash_commands (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name            TEXT NOT NULL UNIQUE,       -- e.g. "compact"
  description     TEXT NOT NULL DEFAULT '',
  plugin_id       TEXT REFERENCES plugins(id) ON DELETE CASCADE, -- NULL = built-in
  handler_type    TEXT NOT NULL DEFAULT 'builtin'
                  CHECK (handler_type IN ('builtin','skill','mcp')),
  keyboard_shortcut TEXT
);
