/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A0F1E',
          900: '#0D1526',
          800: '#111D35',
          700: '#172344',
        },
        gold: {
          400: '#D4A843',
          500: '#C49A2E',
          300: '#E8C265',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        dmsans: ['DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
