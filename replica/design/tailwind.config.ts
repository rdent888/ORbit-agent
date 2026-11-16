// tailwind.config.ts
// Antigravity IDE Clone — Tailwind v4 token mapping
// Import tokens.css first in your entry CSS.
// Use semantic names (bg-bg, text-muted) — never raw hex in components.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './webview/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg:              'var(--color-bg)',
        'bg-sidebar':    'var(--color-bg-sidebar)',
        surface:         'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-raised':'var(--color-surface-raised)',
        border:          'var(--color-border)',
        'border-input':  'var(--color-border-input)',
        // Text
        text:            'var(--color-text)',
        muted:           'var(--color-text-muted)',
        disabled:        'var(--color-text-disabled)',
        // Accent
        accent:          'var(--color-accent)',
        'accent-hover':  'var(--color-accent-hover)',
        'on-accent':     'var(--color-on-accent)',
        // Semantic
        danger:          'var(--color-danger)',
        'danger-bg':     'var(--color-danger-bg)',
        success:         'var(--color-success)',
        'success-bg':    'var(--color-success-bg)',
        warning:         'var(--color-warning)',
        'warning-bg':    'var(--color-warning-bg)',
        // Turbo
        turbo:           'var(--color-turbo)',
        'turbo-bg':      'var(--color-turbo-bg)',
        // Agent
        'agent-thinking':'var(--color-agent-thinking)',
        'agent-idle':    'var(--color-agent-idle)',
        'agent-error':   'var(--color-agent-error)',
        'agent-done':    'var(--color-agent-done)',
        // Diff
        'diff-add-bg':   'var(--color-diff-add-bg)',
        'diff-add':      'var(--color-diff-add-text)',
        'diff-rem-bg':   'var(--color-diff-rem-bg)',
        'diff-rem':      'var(--color-diff-rem-text)',
      },
      fontFamily: {
        ui:     ['Inter', 'system-ui', 'sans-serif'],
        editor: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
        mono:   ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs:    'var(--text-xs)',
        sm:    'var(--text-sm)',
        md:    'var(--text-md)',
        base:  'var(--text-base)',
        lg:    'var(--text-lg)',
        xl:    'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      spacing: {
        1:  'var(--space-1)',
        2:  'var(--space-2)',
        3:  'var(--space-3)',
        4:  'var(--space-4)',
        5:  'var(--space-5)',
        6:  'var(--space-6)',
        8:  'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm:    'var(--shadow-sm)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
      },
      transitionDuration: {
        fast:   '100',
        normal: '150',
        slow:   '250',
      },
    },
  },
  plugins: [],
}

export default config
