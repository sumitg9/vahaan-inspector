import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Navy Navigation Surfaces
        sidebar: {
          DEFAULT: "#0F172A", // Slate 900
          hover: "#1E293B",   // Slate 800
          border: "#334155",  // Slate 700
          muted: "#94A3B8",   // Slate 400
        },
        // Clean Canvas Backgrounds
        canvas: {
          DEFAULT: "#F8FAFC", // Slate 50
          card: "#FFFFFF",
          subtle: "#F1F5F9",  // Slate 100
          border: "#E2E8F0",  // Slate 200
        },
        // Brand Action Colors
        brand: {
          DEFAULT: "#2563EB", // Blue 600
          hover: "#1D4ED8",   // Blue 700
          subtle: "#EFF6FF",  // Blue 50
        },
        // Semantic Status Colors
        semantic: {
          teal: "#0D9488",    // Teal 600 (Pass, Approved, Clean)
          tealBg: "#F0FDFA",  // Teal 50
          amber: "#D97706",   // Amber 600 (Attention, Disposed)
          amberBg: "#FFFBEB", // Amber 50
          red: "#DC2626",     // Red 600 (Fail, Blacklisted, Pending)
          redBg: "#FEF2F2",   // Red 50
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
