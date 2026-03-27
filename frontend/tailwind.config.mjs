/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        surface: "#111118",
        bg: "#0a0a0f",
        "text-primary": "#f0f0f5",
        "text-secondary": "#8a8a9a",
        border: "#1e1e2e",
        accent: "#06b6d4",
        "accent-hover": "#22d3ee",
        "complexity-low": "#16a34a",
        "complexity-med": "#d97706",
        "complexity-high": "#dc2626",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      maxWidth: {
        content: "720px",
        landing: "1120px",
      },
    },
  },
  plugins: [],
};
