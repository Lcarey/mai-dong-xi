/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "Noto Sans SC", "system-ui", "sans-serif"],
      },
      colors: {
        leaf: "#166534",
        mint: "#ecfdf5",
        paper: "#ffffff",
      },
    },
  },
  plugins: [],
};
