import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        coral: {
          50: "#FFF5F2",
          100: "#FFE5DC",
          200: "#FFC8B5",
          300: "#FFA689",
          400: "#FF8463",
          500: "#FF6B47",
          600: "#E85234",
          700: "#C13D24",
        },
        teal: {
          50: "#EEFBF8",
          100: "#D2F5EC",
          200: "#A7EBD9",
          300: "#6FDCC0",
          400: "#3FC7A5",
          500: "#1FAE89",
          600: "#168D6E",
        },
        butter: {
          100: "#FFF6D6",
          200: "#FFEDA8",
          300: "#FFE17A",
        },
        ink: {
          50: "#FAF7F2",
          100: "#F2EDE4",
          200: "#E0D9CB",
          300: "#BAB0A0",
          400: "#8A8170",
          500: "#5D5447",
          600: "#3F3729",
          700: "#2A241B",
          800: "#1A1610",
          900: "#100D08",
        },
        // Legacy aliases kept for any leftover references
        mochi: {
          cream: "#FFF8EE",
          pink: "#FF8463",
          peach: "#FFC8B5",
          mint: "#6FDCC0",
          sky: "#A0E7E5",
          lemon: "#FFE17A",
          brown: "#3F3729",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        rounded: ["var(--font-sans)", "Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        jp: ["'Zen Maru Gothic'", "'Hiragino Sans'", "'Yu Gothic UI'", "system-ui", "sans-serif"],
        display: ["'Zen Maru Gothic'", "var(--font-sans)", "Pretendard Variable", "system-ui", "sans-serif"],
      },
      boxShadow: {
        clay: "0 1px 0 0 rgba(255,255,255,0.4) inset, 0 -3px 0 0 rgba(0,0,0,0.06) inset, 0 8px 24px -8px rgba(63,55,41,0.18)",
        pop: "0 2px 0 0 rgba(0,0,0,0.06), 0 4px 14px -2px rgba(63,55,41,0.10)",
        pressed: "0 1px 0 0 rgba(0,0,0,0.06) inset, 0 -1px 0 0 rgba(255,255,255,0.3) inset",
        glow: "0 0 0 4px rgba(255,107,71,0.14)",
        card: "0 1px 2px rgba(63,55,41,0.04), 0 12px 32px -12px rgba(63,55,41,0.16)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        bounceSoft: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        pop: { "0%": { transform: "scale(0.92)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(120px) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        wiggle: "wiggle 0.6s ease-in-out infinite",
        bounceSoft: "bounceSoft 2.4s ease-in-out infinite",
        pop: "pop 0.3s ease-out",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
