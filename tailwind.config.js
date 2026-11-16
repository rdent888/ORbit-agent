/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: 'var(--color-bg)',
        'bg-sidebar': 'var(--color-bg-sidebar)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        'border-input': 'var(--color-border-input)',
        // Text
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        disabled: 'var(--color-text-disabled)',
        // Accent
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-text': 'var(--color-accent-text)',
        'on-accent': 'var(--color-on-accent)',
        // Semantic
        danger: 'var(--color-danger)',
        'danger-bg': 'var(--color-danger-bg)',
        'danger-text': 'var(--color-danger-text)',
        success: 'var(--color-success)',
        'success-bg': 'var(--color-success-bg)',
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)',
        // Turbo
        turbo: 'var(--color-turbo)',
        'turbo-bg': 'var(--color-turbo-bg)',
        // Agent status
        'agent-thinking': 'var(--color-agent-thinking)',
        'agent-idle': 'var(--color-agent-idle)',
        'agent-error': 'var(--color-agent-error)',
        'agent-done': 'var(--color-agent-done)',
        // Diff
        'diff-add-bg': 'var(--color-diff-add-bg)',
        'diff-add': 'var(--color-diff-add-text)',
        'diff-rem-bg': 'var(--color-diff-rem-bg)',
        'diff-rem': 'var(--color-diff-rem-text)',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        editor: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': '10px',
        xs: '11px',
        sm: '12px',
        md: '13px',
        base: '14px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
