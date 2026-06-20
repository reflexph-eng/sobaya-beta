import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sobaya: {
          ink: "#111827",
          muted: "#6B7280",
          border: "#E5E7EB",
          soft: "#F9FAFB",
          primary: "#0F766E",
          primaryDark: "#115E59"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(17, 24, 39, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
