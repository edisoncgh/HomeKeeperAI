import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4FBF8F",
        "primary-light": "#EAF8F1",
        warning: "#F6A04D",
        danger: "#E85D5A",
        surface: "#FFFFFF",
        "app-background": "#F7F5EF",
        "text-primary": "#333333",
        "text-secondary": "#666666",
        "text-tertiary": "#999999",
        "soft-border": "#E8E2D8"
      },
      borderRadius: {
        card: "8px"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
