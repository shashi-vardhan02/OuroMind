/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HealthSense AI theme
        hsBg: "#050d1a",
        hsBgAlt: "#0a1628",
        hsCard: "#0f2040",
        hsTeal: "#00c9a7",
        hsTealHover: "#00e6bf",
        hsSky: "#0ea5e9",
        hsDanger: "#ef4444",
        hsWarning: "#f97316",
        hsSafe: "#22c55e",
        hsTextPrimary: "#ffffff",
        hsTextSecondary: "#94a3b8",
        // OuroMind legacy theme (keep for /app)
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
