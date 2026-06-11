/**
 * Tailwind consumes design tokens from CSS variables (src/styles/tokens.css).
 * Components reference these token-backed utilities — never hardcoded colours/spacing.
 *
 *  font-serif -> Libre Baskerville (headings)
 *  font-sans  -> DM Sans (body)
 *  font-mono  -> DM Mono (technical data / specs / part numbers)
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: 'rgb(var(--c-cream) / <alpha-value>)',
          200: 'rgb(var(--c-cream-200) / <alpha-value>)',
          300: 'rgb(var(--c-cream-300) / <alpha-value>)',
        },
        terracotta: {
          DEFAULT: 'rgb(var(--c-terracotta) / <alpha-value>)',
          light: 'rgb(var(--c-terracotta-light) / <alpha-value>)',
          dark: 'rgb(var(--c-terracotta-dark) / <alpha-value>)',
        },
        charcoal: {
          DEFAULT: 'rgb(var(--c-charcoal) / <alpha-value>)',
          light: 'rgb(var(--c-charcoal-light) / <alpha-value>)',
          muted: 'rgb(var(--c-charcoal-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-charcoal-faint) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          sunken: 'rgb(var(--c-surface-sunken) / <alpha-value>)',
        },
        status: {
          info: 'rgb(var(--c-info) / <alpha-value>)',
          warn: 'rgb(var(--c-warn) / <alpha-value>)',
          high: 'rgb(var(--c-high) / <alpha-value>)',
          good: 'rgb(var(--c-good) / <alpha-value>)',
        },
        // Client brand — product presentation only, overridden at runtime.
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
      },
      fontFamily: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      ringColor: {
        DEFAULT: 'var(--color-terracotta)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
}
