-- AGY Local — SQLite Schema
-- Generated: 2026-11-17

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  path        TEXT NOT NULL,
  settings    TEXT NOT NULL DEFAULT '{}',
  is_active   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);

-- ============================================================
-- MODEL ACCOUNTS  [FITUR UNIK]
-- ============================================================
CREATE TABLE IF NOT EXISTS model_accounts (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  provider            TEXT NOT NULL
    CHECK (provider IN ('gemini','claude','openai','openrouter','ollama','custom')),
  account_label       TEXT NOT NULL,
  api_key_encrypted   TEXT NOT NULL,
  base_url            TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  priority            INTEGER NOT NULL DEFAULT 0,
  token_limit_per_day INTEGER NOT NULL DEFAULT 0,
  tokens_used_today   INTEGER NOT NULL DEFAULT 0,
  last_used_at        TEXT,
  last_reset_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_model_accounts_provider
  ON model_accounts(provider, is_active, priority);

-- ============================================================
-- MODEL CONFIGS
-- ============================================================
CREATE TABLE IF NOT EXISTS model_configs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  display_name    TEXT NOT NULL,
  provider        TEXT NOT NULL,
  model_id        TEXT NOT NULL,
  context_window  INTEGER NOT NULL DEFAULT 128000,
  is_enabled      INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default models
INSERT OR IGNORE INTO model_configs (id, display_name, provider, model_id, context_window, sort_order) VALUES
  ('mc-gemini-flash',  'Gemini 3.8 Flash',       'gemini',   'gemini/gemini-3.8-flash',           1000000, 0),
  ('mc-gemini-25-flash','Gemini 2.5 Flash',      'gemini',   'gemini/gemini-2.5-flash',           1000000, 1),
  ('mc-gemini-pro',    'Gemini 2.5 Pro',          'gemini',   'gemini/gemini-2.5-pro',             1000000, 2),
  ('mc-claude-sonnet', 'Claude Sonnet 4.5',       'claude',   'anthropic/claude-sonnet-4-5',       200000,  3),
  ('mc-claude-opus',   'Claude Opus 4',           'claude',   'anthropic/claude-opus-4',           200000,  4),
  ('mc-gpt4o',         'GPT-4o',                  'openai',   'openai/gpt-4o',                     128000,  5),
  ('mc-gpt4o-mini',    'GPT-4o Mini',             'openai',   'openai/gpt-4o-mini',                128000,  6),
  ('mc-deepseek',      'DeepSeek R1',             'openrouter','openrouter/deepseek/deepseek-r1',  64000,   7);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT 'New Conversation',
  model_config_id TEXT REFERENCES model_configs(id) ON DELETE SET NULL,
  goal            TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','error','checkpoint_available')),
  token_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_project
  ON conversations(project_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations(status);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id   TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL
    CHECK (role IN ('user','assistant','tool','system')),
  content           TEXT NOT NULL,
  model_account_id  TEXT REFERENCES model_accounts(id) ON DELETE SET NULL,
  model_id          TEXT,
  token_count       INTEGER NOT NULL DEFAULT 0,
  sequence_index    INTEGER NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, sequence_index);

-- ============================================================
-- TOOL CALLS
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_calls (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  message_id      TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,
  arguments       TEXT NOT NULL DEFAULT '{}',
  result          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','denied','running','done','error')),
  approved_by_user INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  started_at      TEXT,
  completed_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_calls_message ON tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_status  ON tool_calls(status);

-- ============================================================
-- ARTIFACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
    CHECK (type IN ('plan','report','code','generative-ui','file-list','markdown')),
  title           TEXT NOT NULL DEFAULT 'Artifact',
  content         TEXT NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation ON artifacts(conversation_id);

-- ============================================================
-- CHECKPOINTS  [FITUR UNIK]
-- ============================================================
CREATE TABLE IF NOT EXISTS checkpoints (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id     TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_index       INTEGER NOT NULL,
  goal_snapshot       TEXT NOT NULL,
  progress_summary    TEXT NOT NULL,
  context_snapshot    TEXT NOT NULL,
  pending_tool_calls  TEXT NOT NULL DEFAULT '[]',
  model_id_at_stop    TEXT,
  stop_reason         TEXT NOT NULL DEFAULT 'token_limit'
    CHECK (stop_reason IN ('token_limit','rate_limit','error','user_pause','model_switch')),
  is_resumed          INTEGER NOT NULL DEFAULT 0,
  resumed_at          TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkpoints_conversation
  ON checkpoints(conversation_id, is_resumed);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('tool_execution_policy',        '"request-review"'),
  ('turbo_mode',                   'false'),
  ('nonworkspace_file_access',     '"ask"'),
  ('internet_access',              '"allow"'),
  ('theme',                        '"dark"'),
  ('default_model_config_id',      'null'),
  ('command_allowlist',            '[]'),
  ('command_denylist',             '[]'),
  ('keep_awake',                   'false'),
  ('context_compaction_threshold', '0.8'),
  ('auto_checkpoint',              'true'),
  ('checkpoint_threshold',         '0.75');

-- ============================================================
-- PERMISSION RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS permission_rules (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  scope       TEXT NOT NULL CHECK (scope IN ('global','project')),
  project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('command','file','url')),
  pattern     TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('allow','deny')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SCHEDULED TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id            TEXT REFERENCES projects(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  cron_expression       TEXT,
  delay_seconds         INTEGER,
  conversation_template TEXT NOT NULL DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','failed')),
  last_run_at           TEXT,
  next_run_at           TEXT,
  last_error            TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN ('builtin','local')),
  folder_path TEXT,
  enabled     INTEGER NOT NULL DEFAULT 1,
  config      TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- SUBAGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subagents (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  parent_conv_id    TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  model_config_id   TEXT REFERENCES model_configs(id),
  status            TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','done','error','killed')),
  brief             TEXT NOT NULL,
  result            TEXT,
  started_at        TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_subagents_parent ON subagents(parent_conv_id, status);
