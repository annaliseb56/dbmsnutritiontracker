/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: '#9cb89e',
        'light-green': '#c8dac9',
        mint: '#e8f3e9',
        'dark-green': '#5a7a5c',
        cream: '#fdfbf7',
        tan: '#f5f1e8',
        'text-dark': '#2d3e2f',
      },
    },
  },
  plugins: [],
}
