import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Semantic color tokens via CSS variables ──────────────────────────
      // CSS vars hold raw HSL channels (no hsl() wrapper), enabling Tailwind's
      // opacity modifier syntax: bg-accent/50, text-positive/80, etc.
      colors: {
        background:          'hsl(var(--color-background)       / <alpha-value>)',
        surface:             'hsl(var(--color-surface)           / <alpha-value>)',
        'surface-elevated':  'hsl(var(--color-surface-elevated)  / <alpha-value>)',
        'text-primary':      'hsl(var(--color-text-primary)      / <alpha-value>)',
        'text-secondary':    'hsl(var(--color-text-secondary)    / <alpha-value>)',
        accent: {
          DEFAULT: 'hsl(var(--color-accent)       / <alpha-value>)',
          muted:   'hsl(var(--color-accent-muted)  / <alpha-value>)',
        },
        positive: 'hsl(var(--color-positive) / <alpha-value>)',
        negative: 'hsl(var(--color-negative) / <alpha-value>)',
        warning:  'hsl(var(--color-warning)  / <alpha-value>)',
        border:   'hsl(var(--color-border)   / <alpha-value>)',
        overlay:  'hsl(var(--color-overlay)  / <alpha-value>)',
      },

      // ─── Font families ────────────────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },

      // ─── Border-radius scale ──────────────────────────────────────────────
      // sharp(2px) → default(6px) → lg(12px) → xl(16px)
      // No pill shapes except badges (rounded-full kept from Tailwind default)
      borderRadius: {
        sharp:   '2px',
        DEFAULT: '6px',
        lg:      '12px',
        xl:      '16px',
        '2xl':   '20px',
        full:    '9999px',
      },

      // ─── Amount / money typography sizes ─────────────────────────────────
      fontSize: {
        'amount-xl': ['2.5rem',   { lineHeight: '1',   letterSpacing: '-0.03em' }],
        'amount-lg': ['1.75rem',  { lineHeight: '1',   letterSpacing: '-0.02em' }],
        'amount-md': ['1.25rem',  { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'amount-sm': ['1rem',     { lineHeight: '1.2', letterSpacing: '-0.005em' }],
      },

      // ─── Semantic shadows ─────────────────────────────────────────────────
      boxShadow: {
        'card':          '0 1px 3px 0 hsl(var(--color-overlay) / 0.08), 0 1px 2px -1px hsl(var(--color-overlay) / 0.08)',
        'card-hover':    '0 4px 12px 0 hsl(var(--color-overlay) / 0.12), 0 2px 4px -2px hsl(var(--color-overlay) / 0.08)',
        'modal':         '0 20px 60px -10px hsl(var(--color-overlay) / 0.5)',
        'toast':         '0 8px 24px -4px hsl(var(--color-overlay) / 0.25)',
        'glow-accent':   '0 0 24px -6px hsl(var(--color-accent)   / 0.4)',
        'glow-positive': '0 0 24px -6px hsl(var(--color-positive) / 0.4)',
        'glow-negative': '0 0 24px -6px hsl(var(--color-negative) / 0.4)',
      },

      // ─── Animations ───────────────────────────────────────────────────────
      animation: {
        'skeleton-pulse': 'skeleton-pulse 1.8s ease-in-out infinite',
        'fade-in':        'fade-in 180ms ease-out both',
        'slide-up':       'slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down':     'slide-down 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in':       'toast-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'toast-out':      'toast-out 220ms ease-in both',
        'count-up':       'count-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%':      { opacity: '0.7'  },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0)    scale(1)'    },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-14px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0)     scale(1)'    },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(calc(100% + 24px))' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateX(0)',                 maxHeight: '200px' },
          to:   { opacity: '0', transform: 'translateX(calc(100% + 24px))', maxHeight: '0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
