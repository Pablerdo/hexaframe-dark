const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import("'tailwindcss'").Config} */
module.exports = {
  darkMode: ["class"],
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0D1117",
        foreground: "#C9D1D9",
        primary: {
          DEFAULT: "#238636",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#21262D",
          foreground: "#C9D1D9",
        },
        destructive: {
          DEFAULT: "#DA3633",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#21262D",
          foreground: "#8B949E",
        },
        accent: {
          DEFAULT: "#30363D",
          foreground: "#C9D1D9",
        },
        popover: {
          DEFAULT: "#161B22",
          foreground: "#C9D1D9",
        },
        card: {
          DEFAULT: "#161B22",
          foreground: "#C9D1D9",
        },
      },
      borderRadius: {
        lg: "6px",
        md: "6px",
        sm: "4px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

