/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0a0a0a",
        darkAccent: "#1a0a00",
        orangePrimary: "#ff5500",
        orangeHover: "#ff6a00",
        cardDark: "#1a1a1a",
        cardDarker: "#222222"
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
