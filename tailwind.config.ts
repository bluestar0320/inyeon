import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f6f7",
          200: "#d9dade",
          400: "#8b8d97",
          600: "#4b4d59",
          800: "#24252d",
          900: "#15161b",
        },
        accent: {
          50: "#fdf3ef",
          100: "#f9e2d8",
          400: "#d9805a",
          500: "#c4653e",
          600: "#a5502f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
