/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0E14',
          surface: '#151A22',
          card: '#181E27',
          hover: '#1E2533',
          border: '#242C3B',
          muted: '#2E384A'
        },
        athletic: {
          lime: '#00E599',
          limeHover: '#00C885',
          coral: '#FF5C38',
          cyan: '#00D2FF',
          gold: '#FFB800'
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#8B98AD',
          muted: '#5A6679'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
