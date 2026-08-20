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
        navy: { DEFAULT: "#203873", deep: "#172A52" },
        gold: { DEFAULT: "#E0B040" },
        action: "#4268E8",
        primary: "#203873"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      }
    }
  },
  plugins: []
}