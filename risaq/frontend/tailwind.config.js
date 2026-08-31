/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        risaq: {
          bg: "#070B14",
          panel: "#0E1524",
          panel2: "#131B2E",
          border: "#1E2A42",
          text: "#E6ECF6",
          muted: "#8A9AB8",
          primary: "#00D9C0",
          primary2: "#22E5A8",
          accent: "#5B8CFF",
          danger: "#FF5470",
          warning: "#FFB020",
        },
      },
      fontFamily: {
        arabic: ["'IBM Plex Sans Arabic'", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,217,192,0.25), 0 0 24px rgba(0,217,192,0.15)",
      },
    },
  },
  plugins: [],
};
