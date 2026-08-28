/** @type {import('tailwindcss').Config} */
export default {
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
        danger: { 100: '#fee2e2', 700: '#b91c1c' },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
}