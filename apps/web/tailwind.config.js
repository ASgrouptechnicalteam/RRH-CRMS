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
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a192f',
          DEFAULT: '#334e68',
          deep: '#102a43'
        },
        gold: { DEFAULT: "#E0B040" },
        action: "#4268E8",
        primary: "#334e68"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
}