import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        typefully: {
          blue: "#1D9BF0",
          indigo: "#4F46E5",
          linkedin: "#0A66C2",
          threads: "#101010",
          bluesky: "#0085FF",
          mastodon: "#6364FF",
          substack: "#FF6719",
          surface: "#FAF9F6",
          card: "#FFFFFF",
          obsidian: "#0F1115",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
