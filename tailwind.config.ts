import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryForest: "#5E7A68",
        primaryCharcoal: "#1C1C1C",
        accentGold: "#D1A36F",
        accentCandle: "#E8D8C3",
        surfaceLight: "#FFFFFF",
        surfaceDark: "rgba(0,0,0,0.9)",
      },
      fontFamily: {
        ios: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
