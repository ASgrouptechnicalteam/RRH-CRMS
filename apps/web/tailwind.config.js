/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e',
          dark: '#0d5c56',
        },
        accent: '#0ea5e9',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        background: '#f0fdfa',
        surface: '#ffffff',
        muted: '#475569',
        text: '#0f172a'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
