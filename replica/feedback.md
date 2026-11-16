# User Feedback Analysis — Antigravity IDE
> Skill: `replica-entrepreneur` · 2026-11-16

---

## Ranked Themes

### 1. Quota Walls & Gated Subscription Limits (Weight: Critical)
* **Problem**: Developers hit "Individual quota reached. Resets in 167h" mid-refactoring session.
* **Evidence**: Reddit & Hacker News threads highlight subscription cost spikes ($20 Pro to $100-$200 Ultra).
* **Fix in Clone**: BYOK Multi-Account Pool with automatic rate-limit failover across free and developer keys.

### 2. Context Loss on Model Swap (Weight: High)
* **Problem**: Switching models after quota exhaustion often resets or corrupts task context and original goal.
* **Evidence**: "Why does the agent lose its context and goal when I switch models after hitting the rate limit?"
* **Fix in Clone**: Lossless Session Serialization with protected `goalText` preservation.

### 3. Permission Confirmation Fatigue (Weight: Medium)
* **Problem**: Clicking "Confirm" on dozens of local file edits stalls development velocity.
* **Evidence**: "Turbo mode is essential for local dev. Without it you are clicking confirm on 50 file diffs."
* **Fix in Clone**: Turbo Mode toggle for full local device access with customizable Deny-rules overlay.

### 4. Lack of Multi-Account Pooling (Weight: High)
* **Problem**: Users with multiple Google/Anthropic accounts cannot merge their quotas together.
* **Fix in Clone**: Unified BYOK priority queue that auto-rotates through N accounts seamlessly.
