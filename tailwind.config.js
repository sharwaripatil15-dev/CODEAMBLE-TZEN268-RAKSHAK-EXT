/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thirdeye: {
          dark: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          cyan: '#00F2FE',
          blue: '#4FACFE',
          purple: '#7F00FF',
          hazard: '#EF4444',
          warning: '#F59E0B',
          safe: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
