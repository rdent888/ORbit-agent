# Component Specs — Antigravity IDE Clone
> `replica-design` · 2026-11-16
> Accessible base: **shadcn/ui** (Radix primitives) + custom Tailwind tokens.
> Never copy AGY icons/logos — use **Lucide React** (MIT) throughout.

---

## 1. Button

```
variants   primary | secondary | ghost | danger | turbo
sizes      sm 32px | md 36px | lg 40px
states     default | hover | active | focus-visible (2px ring accent) | disabled | loading
tokens     primary: bg-accent text-on-accent hover:bg-accent-hover
           secondary: bg-surface border border-border text hover:bg-surface-hover
           ghost: transparent text-muted hover:bg-surface hover:text-text
           danger: bg-danger text-on-danger hover:opacity-90
           turbo: bg-turbo-bg text-turbo border border-turbo hover:opacity-90
radius     md (6px)
font       sm/medium (12px/500) for sm; base/medium (14px/500) for md/lg
a11y       real <button>; aria-disabled (not HTML disabled) for loading;
           loading keeps label visible for screen readers (spinner is aria-hidden)
used on    S03, S06, S07, S10, S12, S13, S16
```

---

## 2. Chat Input Box

```
variants   normal | turbo-active (amber left border + turbo badge)
states     empty | typing | sending (spinner in send button) | disabled
tokens     bg-surface border border-border-input text focus:shadow-focus
           turbo-active: border-l-2 border-l-turbo
layout     min-height: 60px; max-height: 200px; auto-resize (textarea)
           send button: 32x32 icon button, right-aligned
           attach button: left of send, for file/image attach
font       base 14px/normal, font-ui
a11y       <textarea> with aria-label="Chat with agent"; Enter sends,
           Shift+Enter newline; role="textbox" aria-multiline="true"
used on    S03
```

---

## 3. Model Badge / Selector

```
variants   gemini | claude | openai | byok-custom
states     active | rate-limited (amber dot) | exceeded (red dot) | switching (spinner)
tokens     bg-surface border border-border text-sm radius-full px-3 py-1
           rate-limited: dot bg-warning; exceeded: dot bg-danger; active: dot bg-success
layout     compact pill in status bar; dropdown panel on click (S04)
           dropdown: bg-surface-raised border border-border shadow-md radius-lg
           each row: provider icon + model name + account label + quota gauge
a11y       button with aria-haspopup="listbox"; options as role="option"
used on    S03, S04, S11
```

---

## 4. Token / Quota Gauge

```
variants   per-account | aggregate
states     normal (< 70%) | warning (70–90%, amber) | exceeded (> 90%, red)
tokens     track: bg-surface-raised; fill: bg-accent (normal) bg-warning (warn) bg-danger (exceeded)
layout     height: 4px; full width of container; label: "X% used" text-xs text-muted
           reset countdown: "resets in Xh Xm" text-2xs text-muted
a11y       role="progressbar" aria-valuenow aria-valuemin="0" aria-valuemax="100"
           aria-label="Token quota: X%"
used on    S03, S05, S15
```

---

## 5. Agent Status Indicator

```
variants   idle | thinking | running | error | stalled
states     5 (see variants)
tokens     idle:     dot bg-agent-idle text-muted
           thinking: dot bg-agent-thinking animate-pulse text-muted
           running:  dot bg-success animate-pulse text-text
           error:    dot bg-agent-error text-danger
           stalled:  dot bg-warning text-warning
layout     12x12 circle dot + status label text-xs
           in status bar: dot only (no label); in Agent Manager: dot + label + elapsed time
a11y       aria-live="polite" for state changes; role="status"
used on    S03, S11, S19
```

---

## 6. Artifact Card

```
variants   plan | diff | screenshot | terminal | generic
states     preview (collapsed) | expanded | approved | rejected | loading
tokens     bg-surface border border-border radius-lg shadow-sm
           header: bg-surface-raised px-4 py-2 border-b border-border
           approved: border-l-2 border-l-success
           rejected: border-l-2 border-l-danger

plan:       markdown render; "Approve / Request changes" actions
diff:       Monaco Editor in diff mode (readonly); approve applies patch to file
screenshot: <img> fill; zoom on click
terminal:   monospace scroll area; bg-bg text-text font-mono text-sm

a11y        approve/reject: real <button>; diff region: role="region"
            aria-label="File diff: filename.ts"
used on     S10
```

---

## 7. Turbo Mode Toggle

```
variants   off | on | custom
states     3 + confirmation modal on first enable
tokens     off: bg-surface-raised text-muted
           on: bg-turbo-bg text-turbo border border-turbo
           custom: bg-surface-raised text-warning border border-warning
layout     32px tall pill toggle in toolbar; label "Turbo" text-xs
           on first enable: modal with warning (S06) — "Turbo grants full device access"
           buttons in modal: "Enable" (danger style) + "Cancel"
a11y       role="switch" aria-checked; aria-label="Turbo Mode"
           confirmation modal: role="alertdialog" focus-trap
used on    S06, status bar in S02
```

---

## 8. Session History Entry

```
variants   resumable | completed | token-limit
states     default | hovered | selected
tokens     bg-surface hover:bg-surface-hover radius-md px-3 py-2
           token-limit: badge bg-warning-bg text-warning text-xs "Token limit"
layout     title (text truncate 1 line) + timestamp text-xs text-muted
           model badge (small) + last message preview text-xs text-muted truncate
           "Resume" button (ghost sm) on hover
a11y       role="option"; aria-selected; keyboard navigable list
used on    S07
```

---

## 9. Account Row

```
variants   google | anthropic | openai | custom
states     active | quota-ok | rate-limited | error | disabled
tokens     bg-surface hover:bg-surface-hover radius-md px-3 py-2
           status dot: ok=success rate-limited=warning error=danger
layout     provider icon (Lucide) + label (font-medium) + provider tag text-xs text-muted
           quota gauge (compact 4px) + "rate limited — resets Xh" text-2xs
           drag handle (left, opacity-0 → show on hover) for reorder
           "Remove" icon button (ghost danger) on hover, right side
a11y       drag-and-drop reorder: keyboard alternative (Move up/down buttons)
           remove: aria-label="Remove [account label]"
used on    S05
```

---

## 10. Permission Rule Row

```
variants   allow | deny | ask
states     default | hovered | editing
tokens     allow: text-success bg-success-bg/30; deny: text-danger bg-danger-bg/30
           ask: text-warning bg-warning-bg/30
layout     action badge (Allow/Deny/Ask) + tool name text-mono text-sm + pattern text-xs text-muted
           edit icon + delete icon (ghost) on hover, right side
           inline edit: tool input + pattern input + action select + save/cancel buttons
a11y       row role="row"; action badge aria-label="Action: Allow"
used on    S12
```

---

## 11. Plugin Card

```
variants   installed | available | auth-needed
states     installed | enabled | disabled | auth-needed | installing
tokens     bg-surface border border-border radius-lg p-4
           auth-needed: border-l-2 border-l-warning
layout     icon (32x32) + name (font-semibold) + type badge (MCP/Skill/Agent) text-xs
           description text-sm text-muted truncate 2 lines
           install toggle (switch) right side — enabled/disabled
           "Configure" button (ghost sm) for auth-needed
a11y       toggle: role="switch" aria-checked aria-label="Enable [plugin name]"
used on    S13
```

---

## 12. Slash Command Item

```
variants   built-in | plugin-contributed
states     normal | hovered | selected | unavailable (plugin disabled)
tokens     px-3 py-2 hover:bg-surface-hover text-base
           unavailable: opacity-50 cursor-not-allowed
layout     "/" prefix text-muted + command name text-text font-mono
           description text-xs text-muted
           plugin badge text-2xs bg-surface-raised right side (if from plugin)
           keyboard shortcut badge right side (if any)
a11y       role="option"; aria-selected; aria-disabled for unavailable
used on    S14
```

---

## 13. Context Compaction Banner

```
variants   warning | compacting | done
states     near-limit | compacting (spinner) | done (auto-dismiss 3s)
tokens     warning: bg-warning-bg border-b border-warning text-warning
           compacting: bg-surface border-b border-border text-muted
           done: bg-success-bg border-b border-success text-success
layout     full-width sticky top of chat panel; height 32px
           warning: "Context 85% full — compact now?" + "Compact" button (sm) + "Dismiss"
           compacting: spinner + "Compacting context..."
           done: checkmark icon + "Context compacted — Xk tokens freed"
a11y       role="status" aria-live="polite"; dismiss button aria-label="Dismiss"
used on    S17 (inline in S03)
```

---

## 14. Checkpoint Tree Node

```
variants   fork-point | current | archived
states     active | archived
tokens     current: border-l-2 border-l-accent bg-surface-hover
           fork-point: border-l-2 border-l-muted
           archived: opacity-60
layout     vertical tree line (1px border-border) connecting nodes
           node: circle 10px + label text-sm + timestamp text-xs text-muted right
           "Fork from here" button (ghost xs) on hover
a11y       role="tree" / role="treeitem"; aria-expanded for branches
used on    S18
```

---

## Primitive Build Plan (M4 — before any screen)

Build all 14 components in isolation at `/design` route (or Storybook):

```
src/webview/components/
├── primitives/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Toggle.tsx           ← Turbo Mode
│   ├── ProgressBar.tsx      ← Quota Gauge
│   ├── StatusDot.tsx        ← Agent Status
│   └── Banner.tsx           ← Compaction Banner
├── chat/
│   ├── ChatInput.tsx
│   ├── ModelSelector.tsx
│   └── ArtifactCard.tsx
├── sessions/
│   ├── SessionHistoryEntry.tsx
│   └── CheckpointTree.tsx
├── accounts/
│   └── AccountRow.tsx
├── permissions/
│   └── PermissionRuleRow.tsx
└── plugins/
    ├── PluginCard.tsx
    └── SlashCommandItem.tsx
```

Accessible base: **shadcn/ui** (Radix primitives, MIT) — do NOT use AGY's own component library.
Icons: **Lucide React** (MIT) — do NOT copy AGY icon SVGs.
