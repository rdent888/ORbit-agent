# Test Plan — Antigravity IDE Clone
> Skill: `replica-test` · 2026-11-16

---

## 1. Test Cases per Flow

### Flow F01: First-time Setup & Add BYOK Accounts
* **F01-H1 (Happy Path)**: User opens Account Manager, enters custom label and valid API key, clicks "Simpan Akun". Account appears with "Active" badge and initial quota gauge.
* **F01-E1 (Edge Case)**: User enters whitespace-only label or key. Form validation blocks submission.
* **F01-E2 (Edge Case)**: User registers 5+ accounts with custom priority orders. Balancer sorts priority order strictly ascending.

### Flow F03: Turbo Mode Full Hardware & Filesystem Access
* **F03-H1 (Happy Path)**: User enables Turbo Mode. Toggle turns amber with `DEV ACCESS` badge. Terminal and file modifiers operate unsandboxed.
* **F03-E1 (Edge Case)**: User has an explicit rule `fs.write /**/.env* -> deny`. Even with Turbo Mode ON, attempts to modify `.env` are strictly blocked.
* **F03-E2 (Edge Case)**: User has an explicit rule `terminal.exec * -> ask`. Terminal prompts for confirmation before running sensitive command.

### Flow F04: Hit Token Limit → Context Compaction → Resume Session
* **F04-H1 (Happy Path)**: Session hits rate limit `429` on Account A. Session status transitions to `token_limit`. ResumeSessionDialog pops up with current goal retained. User selects Model B (e.g. Gemini 2.5 Pro) and Account B. Session continues toward target goal without losing prior diff.
* **F04-E1 (Edge Case)**: Historical messages exceed context limit of target replacement model. Compactor compresses context into `compact_summary` while preserving target goal.

### Flow F05: Multi-Account BYOK Auto-Rotation
* **F05-H1 (Happy Path)**: Account #1 reaches quota limit or receives HTTP 429. `QuotaBalancer` automatically marks Account #1 as `rate_limited` with reset timer and selects Account #2 in the pool. Request retries seamlessly.

### Flow F06: Switch Model Mid-Task
* **F06-H1 (Happy Path)**: User clicks Model Selector in Status Bar, changes model from Gemini 2.5 Flash to Claude 3.7 Sonnet. Session state updates model ID without clearing chat history.

### Flow F10: Review and Approve Agent Code Diff
* **F10-H1 (Happy Path)**: Agent generates a diff artifact for `src/app.service.ts`. User clicks "Approve Changes". File contents update directly in Monaco editor and terminal logs show file patch applied.
