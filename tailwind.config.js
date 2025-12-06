/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        fantasy: ['Cinzel', 'serif'],
      },
      colors: {
        paladin: {
          cream: '#ECEBF1',
          dark: '#070A26',
          purple: '#853DFF',
          lightPurple: '#AD80FF',
          brown: '#6B4B30',
          orange: '#FF8F1F',
          green: '#00FF9B',
        }
      }
    }
  },
  plugins: [],
}
