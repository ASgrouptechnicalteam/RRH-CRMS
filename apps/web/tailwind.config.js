/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas, #F4FAFC)",
        surface: "#F4F6FA",
        navy: {
          50: '#F0F4FA',
          100: '#E1E9F4',
          200: '#C3D3E9',
          300: '#A4BCE0',
          400: '#86A6D6',
          500: '#6890CD',
          600: '#4D73AB',
          700: '#203873',
          800: '#1B2F5E',
          900: '#172A52',
          950: '#0E1A33',
          DEFAULT: '#203873',
          deep: '#172A52'
        },
        gold: {
          50: '#FDFBF6',
          100: '#F6EACB',
          200: '#EED99E',
          300: '#E5C671',
          400: '#DDB344',
          500: '#D5A017',
          600: '#C9A227',
          700: '#A1821F',
          800: '#796217',
          900: '#51410F',
          950: '#3D310B',
          DEFAULT: '#C9A227'
        },
        action: "#4268E8",
        primary: "#203873",
        hot: { 100: '#ffe4e6', 600: '#e11d48' },
        warm: { 100: '#fef3c7', 700: '#b45309' },
        cold: { 100: '#e0f2fe', 700: '#0369a1' },
        success: { 100: '#d1fae5', 700: '#047857' },
        pending: { 100: '#fef3c7', 700: '#b45309' },
        // Full 50/100/200/600/700 ramp -- the danger-50/200/600 shades used by
        // the shared "Unable to load X" error banner (MDExecutiveDashboard and
        // friends) were previously missing, so that banner rendered with no
        // background, border, or icon color anywhere it was used.
        danger: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 600: '#dc2626', 700: '#b91c1c' },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      },
      boxShadow: {
        // Single source of truth for card/table elevation -- previously each
        // screen picked its own shadow weight (shadow-sm, shadow-xl,
        // shadow-2xl) for conceptually the same "card" container.
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
      },
      // `animate-fadeIn` and `animate-scaleUp` are used 70+ times across the
      // app (every modal and wizard step transition) but were never actually
      // defined anywhere -- Tailwind silently generates no rule for an
      // unrecognized animate-* class, so every one of those transitions has
      // been rendering with zero animation. Defining them here retroactively
      // animates every existing call site with no per-component changes.
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleUp: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    }
  },
  plugins: []
}