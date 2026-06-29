/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#5a9aff',
          500: '#2f78f6',
          600: '#1c5ce0',
          700: '#1748b5'
        },
        surface: {
          DEFAULT: '#0a0f1e',
          card: '#121d35',
          border: '#22304d',
          muted: '#1a2540'
        }
      }
    }
  },
  plugins: []
}
