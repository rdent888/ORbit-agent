# Recon Map — Antigravity IDE Clone
> Generated: 2026-11-16 | Skill: replica-recon

---

## Scope

| Field | Value |
|---|---|
| **App** | Google Antigravity IDE (Desktop App + IDE Extensions) |
| **Platform** | Desktop (Windows / macOS / Linux), VS Code Extension, CLI |
| **Slice** | Core agentic coding loop: multi-model AI, Turbo Mode, session resume, BYOK multi-account |
| **Who it is for** | Developers who want unlimited AI coding assistant without subscription lock-in |

---

## Sources

| Source | URL / Location | What it gives |
|---|---|---|
| Official docs | antigravity.google | Feature list, MCP config, permissions, slash commands |
| Pricing page | antigravity.google/pricing | Tier gating, what matters |
| Changelog | antigravity.google/changelog | Recent additions |
| GitHub (community) | github.com/google/antigravity-* | Public API, CLI flags, config schema |
| Community extensions | open-vsx.org, marketplace.visualstudio.com | AG Switchboard, Multi-ID Quota |
| Reddit / HN | reddit.com/r/antigravity | Real user pain points |
| Public walkthrough videos | youtube.com | Real flows |
| CLI help | `agy --help` | All flags, commands |

---

## Screen Inventory

| ID | Screen | Route / Entry | Purpose | Key Components | States |
|---|---|---|---|---|---|
| S01 | Welcome / Onboarding | App launch, first run | Sign-in, account setup | Sign-in button, model selector, permissions prompt | First run, returning user |
| S02 | Main IDE Layout | After sign-in | Code editor + agent panel | Editor pane, Agent sidebar, file tree, terminal, status bar | Empty project, active session |
| S03 | Agent Chat Panel | Sidebar / S02 | Conversation with AI agent | Chat input, message history, model badge, token counter, artifact cards | Idle, thinking, streaming, error, token-limit |
| S04 | Model Selector | Status bar click / S03 dropdown | Switch active AI model | Model list (Gemini, Claude, GPT, custom), account label, quota badge | Available, rate-limited, BYOK |
| S05 | Account Manager | Settings → Accounts | Add/remove/switch AI provider accounts | Account list, provider logos, API key field, quota gauge, priority order | 0 accounts, 1 account, N accounts |
| S06 | Turbo Mode Panel | Settings → Permissions / toolbar toggle | Configure full-device access | Toggle switch, permission presets, allow/deny/ask rule list, warning banner | Off, On, Custom rules |
| S07 | Session Resume Dialog | On startup / token-limit hit | Resume interrupted session | Session history list, model selector, "Continue from" timestamp, goal summary | No prior session, 1 session, N sessions |
| S08 | Workspace / Project View | File tree panel | Browse and manage project files | File tree, breadcrumb, search, git status | Empty, populated, dirty |
| S09 | Terminal Panel | Bottom panel | Run commands, see agent shell output | Terminal instance, command history, Turbo badge | Standard, Turbo (no sandbox) |
| S10 | Artifact Viewer | Inline in chat / floating | View agent-produced plans, diffs, screenshots | Markdown render, diff viewer, image preview, approval buttons | Plan, diff, screenshot, approved |
| S11 | Agent Manager | Sidebar view / command palette | Manage multiple parallel agents (swarm) | Agent list, status badges, spawn button, kill button, model per-agent | 0 agents, running, stalled |
| S12 | Permissions Settings | Settings → Permissions | Fine-grained tool allow/deny rules | Rule list, glob patterns, tool checkboxes, Turbo override warning | Default, custom, locked |
| S13 | Plugin / MCP Manager | Settings → Plugins | Add/remove MCP servers and skills | Plugin cards, install toggle, auth fields, marketplace search | No plugins, installed, auth-needed |
| S14 | Slash Command Palette | `/` in chat input | Trigger built-in and plugin commands | Command list, search, description, keyboard shortcut | Empty query, filtered |
| S15 | Token / Quota Dashboard | Status bar → usage panel | Monitor live token usage across accounts | Per-account gauge, model usage breakdown, reset countdown, BYOK indicator | Under limit, warning, exceeded |
| S16 | BYOK Configuration | Settings → Models → Add Provider | Add custom API keys for any provider | Provider dropdown, API key input, base URL (optional), test button | Unconfigured, testing, valid, invalid |
| S17 | Context Compaction Banner | Inline in chat (auto) | Alert when context is near limit and auto-compact | Warning bar, manual compact button, /compact hint | Near-limit, compacting, done |
| S18 | Fork / Rewind Panel | Command palette / chat `/rewind` | Branch conversation state to safe point | Session tree, checkpoint list, fork button | 1 checkpoint, N checkpoints |
| S19 | Swarm Dashboard | Agent Manager → Swarm tab | Orchestrate parallel agent workers | Worker cards, shared message board, coordinator controls, model per-worker | Idle swarm, active, stalled |
| S20 | Settings / Configuration | Settings icon | Global and workspace config | Tabbed settings, JSON editor, schema validation | Default, customized |

---

## User Flows

```
F01  First-time setup & sign-in
     S01 → S05 (add account) → S16 (add BYOK key) → S04 (select model) → S02

F02  Start a coding task (normal mode)
     S02 → S03 (type prompt) → S10 (review artifact/plan) → S09 (agent runs terminal) → S02

F03  Enable Turbo Mode for full device access
     S02 → S06 (toggle Turbo) → S12 (review/set rules) → S09 (unrestricted terminal) → S02

F04  Hit token limit → resume session
     S03 (token-limit error) → S17 (compaction banner) → S07 (resume dialog) → S04 (switch model) → S03 (continue)

F05  Add a second AI account for extra quota
     S05 → S16 (add provider + key) → S15 (see combined quota) → S04 (auto-rotate accounts)

F06  Switch AI model mid-task without losing progress
     S03 (rate-limit or manual) → S04 (pick new model) → S03 (agent resumes with same context)

F07  Run a swarm (parallel agents)
     S11 → S19 (configure workers) → S02 (each worker edits own scope) → S19 (aggregate results)

F08  Install an MCP plugin / skill
     S13 → search marketplace → install → S14 (new slash command appears) → S03

F09  Fork conversation to safe checkpoint
     S18 (pick checkpoint) → S03 (branched session, original intact)

F10  Review and approve agent diff
     S10 (diff artifact) → approve / request changes → S09 (agent applies or revises)
```

---

## Components

| Component | Variants | States | Screens |
|---|---|---|---|
| Chat input box | Normal, Turbo-active | Empty, typing, sending, disabled | S03, S14 |
| Model badge / selector | Gemini, Claude, GPT, Custom BYOK | Active, rate-limited, exceeded, switching | S03, S04, S11 |
| Token / quota gauge | Per-account, aggregate | Under, warning (80%), exceeded | S03, S15 |
| Agent status indicator | Idle, Thinking, Running, Error, Stalled | 5 states | S03, S11, S19 |
| Artifact card | Plan, Diff, Screenshot, Terminal output | Preview, expanded, approved, rejected | S10 |
| Turbo mode toggle | On, Off, Custom | 3 states + warning modal | S06, S09 status bar |
| Session history entry | Resume candidate | With model, timestamp, goal snippet | S07 |
| Account row | Google, Anthropic, OpenAI, Custom | Active, quota-ok, rate-limited, error | S05 |
| Permission rule row | Allow, Deny, Ask | 3 rule types + glob scope | S12 |
| Plugin card | Installed, Available, Auth-needed | 3 install states | S13 |
| Worker card (swarm) | Coordinator, Worker | Idle, Working, Stalled, Done | S19 |
| Slash command item | Built-in, Plugin-contributed | Normal, hovered, unavailable | S14 |
| Context compaction banner | Warning, Compacting, Done | 3 states | S17 |
| Checkpoint tree node | Fork point, Current | Active, archived | S18 |

---

## Inferred Data Model

```
Account
  id, provider (google|anthropic|openai|custom), label, api_key (encrypted),
  base_url (optional, for custom endpoints), priority_order (int),
  quota_used (int tokens), quota_limit (int tokens), quota_reset_at (timestamptz),
  is_active (bool), created_at, updated_at
  evidence: S05, S15, S16
  confidence: high

Session
  id, workspace_id, title, goal_text, model_id (last used), account_id (last used),
  status (active|paused|completed|token-limit), context_snapshot (jsonb),
  token_count (int), created_at, last_active_at
  evidence: S03, S07, F04
  confidence: high

Message
  id, session_id, role (user|assistant|tool), content (text), model_id,
  account_id, tokens_used (int), created_at
  evidence: S03 chat history
  confidence: high

Artifact
  id, session_id, message_id, type (plan|diff|screenshot|terminal|generic),
  content (jsonb/text), status (pending|approved|rejected), created_at
  evidence: S10, F10
  confidence: high

Workspace
  id, path (local dir), name, turbo_mode (bool), config (jsonb), created_at
  evidence: S08, S20
  confidence: high

PermissionRule
  id, workspace_id, tool_name, pattern (glob), action (allow|deny|ask),
  created_at
  evidence: S12, S06
  confidence: high

Model
  id, provider, name, display_name, context_window (int), is_byok (bool),
  supports_thinking (bool), cost_per_1k_input, cost_per_1k_output
  evidence: S04, S16
  confidence: medium (inferred from public model cards)

AgentWorker (swarm)
  id, session_id, name, role (coordinator|worker|verifier), model_id,
  account_id, status (idle|working|stalled|done), workspace_branch,
  created_at, last_heartbeat_at
  evidence: S19, F07
  confidence: medium

Plugin
  id, name, source_url, type (mcp|skill|agent), config (jsonb),
  is_enabled (bool), auth_vars (jsonb encrypted), installed_at
  evidence: S13
  confidence: high

SlashCommand
  id, name, description, plugin_id (nullable, null = built-in), handler_type,
  keyboard_shortcut
  evidence: S14
  confidence: high
```

---

## What Cannot Be Cloned

| Item | Reason |
|---|---|
| Google AI model weights | Proprietary; use public API endpoints (Gemini API, Vertex AI) |
| Anthropic / OpenAI model weights | Proprietary; use their public APIs with user's own keys |
| Antigravity marketplace catalog | Proprietary content; build an open plugin registry instead |
| Google account OAuth session tokens | Cannot impersonate; use user's own BYOK API keys |
| Existing conversation data from user's AGY account | Privacy; user starts fresh or imports manually |
| AGY binary / electron shell | Proprietary; rebuild on Electron or Tauri |

---

## Size Estimate

| Metric | Count |
|---|---|
| Screens | 20 |
| Flows | 10 |
| Entities | 10 |
| Hard parts | Multi-model BYOK rotation, context compaction engine, Turbo mode permission system, session resume with model swap, swarm worker orchestration |

**Size: L (a quarter) — or M if scoped to core loop only (F01–F06, skip swarm)**

Hard parts ranked:
1. **Context persistence + model-swap resume** — serialize full context, replay on new model
2. **BYOK multi-account quota rotation** — rotate accounts automatically on rate-limit
3. **Turbo Mode permission system** — OS-level file + process permissions, safe override layering

Out of scope (v1): Swarm (F07), voice mode, mobile surface, IDE extension marketplace publishing

---

## Summary

**Core loop:** User adds N AI accounts with their own API keys → starts coding session → agent edits files, runs terminal → hits token limit → resumes on a different model/account without losing context.

- **20 screens, 10 flows, 10 entities**
- **3 hardest parts:** Context resume across model swap · BYOK multi-account rotation · Turbo Mode OS permissions
- **Out of scope v1:** Swarm orchestration, voice mode, mobile, publishing to extension stores
- **Next step:** `/replica-architect`
