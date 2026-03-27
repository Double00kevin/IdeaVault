/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        bg: "#fafafa",
        "text-primary": "#1a1a1a",
        "text-secondary": "#666666",
        border: "#e5e5e5",
        accent: "#2563eb",
        "complexity-low": "#16a34a",
        "complexity-med": "#d97706",
        "complexity-high": "#dc2626",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      maxWidth: {
        content: "720px",
      },
    },
  },
  plugins: [],
};
