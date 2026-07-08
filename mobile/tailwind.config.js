const { tailwindVanz } = require("./src/theme/tokens.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        'jakarta-medium': ['"Plus Jakarta Sans Medium"'],
        'jakarta-semibold': ['"Plus Jakarta Sans SemiBold"'],
        'jakarta-bold': ['"Plus Jakarta Sans Bold"'],
        'jakarta-extrabold': ['"Plus Jakarta Sans ExtraBold"'],
      },
      colors: {
        vanz: tailwindVanz,
        // Semantic role tokens — flip with the theme. Backed by CSS vars set at
        // the app root via vars(). Brand accents stay under `vanz-*`.
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        content: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          inverted: 'rgb(var(--text-inverted) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        inverted: 'rgb(var(--inverted) / <alpha-value>)',
        // Status roles — flip with the theme. Use with opacity for tints:
        // `bg-danger/10 border-danger/30 text-danger`.
        danger: 'rgb(var(--danger) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },
      borderRadius: {
        'card': '24px',
        '4xl': '32px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      boxShadow: {
        'card': '0 2px 16px rgba(11,16,33,0.06)',
        'elevated': '0 8px 32px rgba(11,16,33,0.10)',
        'glow-teal': '0 4px 24px rgba(56,182,255,0.25)',
        'glow-yellow': '0 4px 24px rgba(245,200,0,0.25)',
        'glow-green': '0 4px 24px rgba(34,197,94,0.25)',
      },
    },
  },
  plugins: [],
}
