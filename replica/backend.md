# Backend Architecture & Integrations — Antigravity IDE Clone
> Skill: `replica-backend` · 2026-11-16

---

## 1. Multi-Provider AI Harness (BYOK)

All AI interactions run through standard, official provider REST / SSE protocols:

| Provider | Official Endpoint | Auth Header | Supported Models |
|---|---|---|---|
| **Google AI Studio** | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` | `gemini-2.5-flash`, `gemini-2.5-pro` |
| **Anthropic** | `https://api.anthropic.com/v1` | `x-api-key` + `anthropic-version: 2023-06-01` | `claude-3-7-sonnet`, `claude-3-5-haiku` |
| **OpenAI** | `https://api.openai.com/v1` | `Authorization: Bearer <key>` | `gpt-4o`, `o3-mini` |
| **Custom / Ollama** | User-defined URL (`http://localhost:11434/v1`) | Optional Bearer | Custom open-weights |

---

## 2. Token Quota & Auto-Failover Balancer

When multiple accounts are registered in the pool:
1. **Priority Scheduling**: Requests route to the account with lowest `priority_order` that is in status `ok`.
2. **429 Interception**: If an HTTP 429 (Rate Limit / Quota Exhaustion) is returned:
   - The failing account status is set to `rate_limited`.
   - `quota_reset_at` is parsed from headers (`retry-after` or `x-ratelimit-reset`).
   - The balancer instantly switches to the next account in the priority queue.
   - The active request payload is retried automatically without interrupting the user.
3. **Session Recovery (Model Swap)**:
   - When all accounts for a specific model are exhausted, the session enters `token_limit`.
   - The user opens `ResumeSessionDialog (S07)` to switch to a different model (e.g., from Claude to Gemini Pro).
   - The session serializer passes the entire conversation context to the new provider adapter without modifying `goal_text`.

---

## 3. Turbo Mode Hardware & Filesystem Access

In standard mode, file writes are bounded by the workspace root.
When **Turbo Mode** is enabled:
- Tool calls (`fs.read`, `fs.write`, `terminal.exec`) can access any path on the host machine.
- Security boundary is enforced by **Permission Rules (`permission_rules` table)**:
  - Rules with action `deny` always block execution (e.g., `**/.env*` or system keys).
  - Rules with action `ask` prompt the developer before execution.
  - Remaining operations execute with zero-friction automation.

---

## 4. Security Checklist

- [x] Secrets stored only in `.env.local` or OS Keychain; `.env*` in `.gitignore`
- [x] No private Antigravity endpoints; only official Google, Anthropic, and OpenAI APIs
- [x] User BYOK API keys are masked in UI and never logged
- [x] Input validation with Zod schemas
- [x] Permission rule overlay takes strict precedence over Turbo Mode defaults
- [x] Lossless conversation serialization for session resume across model architectures
