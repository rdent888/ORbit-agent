# Bug Tracker & QA Report — Antigravity IDE Clone
> Skill: `replica-test` · 2026-11-16

---

## Summary

| Severity | Meaning | Open | Fixed |
|---|---|---|---|
| **S1** | Core flow blocked, data loss, security hole | 0 | 0 |
| **S2** | Feature broken, no workaround | 0 | 0 |
| **S3** | Broken with workaround | 0 | 0 |
| **S4** | Minor cosmetic / polish | 0 | 0 |

**Total Open Bugs: 0**

---

## Test Execution Summary

| Flow | Test Case | Type | Result | Notes |
|---|---|---|---|---|
| **F01** | Add BYOK Account | Unit & UI | ✅ PASS | Form saves account with priority order & keychain reference |
| **F03** | Turbo Mode Hardware Access | Integration | ✅ PASS | Unsandboxed terminal execution tagged with `[Turbo]` |
| **F03** | Deny Rule Overlay Protection | Integration | ✅ PASS | Explicit deny rules block `.env` access even with Turbo ON |
| **F04** | Token Limit Auto-Pause | Flow | ✅ PASS | Transition to `token_limit` triggers resume notification |
| **F04** | Lossless Model Swap Resume | Flow | ✅ PASS | Goal text & conversation preserved 100% when swapping to Gemini Pro |
| **F05** | Multi-Account 429 Failover | Integration | ✅ PASS | Failing key flagged; backup key in pool seamlessly takes over |
| **F06** | Status Bar Model Selector | UI | ✅ PASS | Real-time dropdown model switcher |
| **F10** | Diff Artifact Code Approval | UI & Engine | ✅ PASS | Code diff applied directly to workspace file |
