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
        webx: {
          bg: '#06060a',
          card: '#0d0d14',
          surface: '#13131e',
          elevated: '#1a1a2a',
          border: '#2a1a24',
          'border-active': '#e11d48',
          crimson: '#dc2626',
          maroon: '#4c0519',
          scarlet: '#ff1a40',
          glow: '#ff003c',
          text: '#f1f1f5',
          muted: '#8e8ea0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-crimson': '0 0 25px -5px rgba(220, 38, 38, 0.4), 0 0 10px -2px rgba(225, 29, 72, 0.3)',
        'glow-scarlet': '0 0 35px -5px rgba(255, 26, 64, 0.5), 0 0 15px -2px rgba(255, 0, 60, 0.4)',
        'glow-subtle': '0 0 20px -3px rgba(136, 19, 55, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'inner-crimson': 'inset 0 0 15px 0 rgba(225, 29, 72, 0.2)'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'web-spin': 'spin 60s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
