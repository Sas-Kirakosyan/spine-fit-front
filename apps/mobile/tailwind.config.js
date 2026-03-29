/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        main: "#e77d10",
        background: {
          primary: "#132f54",
          secondary: "#0E1326",
          tertiary: "#1B1E2B",
        },
        card: {
          primary: "#1B1E2B",
          secondary: "#161827",
          tertiary: "#1F2232",
        },
      },
      borderRadius: {
        card: "14px",
        input: "18px",
        sheet: "30px",
      },
    },
  },
  plugins: [],
};
