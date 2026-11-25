import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#F36B32", dark: "#D9581F", soft: "#FEF0E9" },
        ink: { DEFAULT: "#171A1D", 2: "#252B30" },
        paper: "#F7F7F5",
        muted: "#737B83",
        line: "#E4E7EB",
        ok: "#2E8B57",
        warn: "#E6A23C",
        bad: "#D64545",
      },
      fontFamily: {
        heading: ["'Manrope Variable'", "Manrope", "system-ui", "sans-serif"],
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(23,26,29,0.05), 0 1px 3px rgba(23,26,29,0.04)" },
    },
  },
  plugins: [],
};
export default config;
