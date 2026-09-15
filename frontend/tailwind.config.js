/** @type {import('tailwindcss').Config} */
import flowbite from "flowbite/plugin";
import flowbiteReact from "flowbite-react/plugin/tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.js",
    ".flowbite-react\\class-list.json"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef0ff",
          100: "#e0e3ff",
          200: "#c7ccff",
          300: "#a5acff",
          400: "#8088ff",
          500: "#6366f1",
          600: "#5145e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
    },
  },
  plugins: [flowbite, flowbiteReact],
};