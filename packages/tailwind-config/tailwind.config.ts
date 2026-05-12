import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        primary: "#0A0A0A",
        canvas: "#E8E8E6",
        surface: "#FFFFFF",
        neutral: {
          50: "#F5F5F4",
          100: "#F0F0EE",
          200: "#ECECEA",
          300: "#E5E5E3",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#0A0A0A",
        },
        background: {
          DEFAULT: "#ffffff",
          secondary: "#f9fafb",
          tertiary: "#f3f4f6",
        },
        border: {
          DEFAULT: "#e5e7eb",
          dark: "#d1d5db",
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#525252",
          tertiary: "#737373",
        },
        success: {
          light: "#F0F8F0",
          DEFAULT: "#1F7A3F",
        },
        warning: {
          light: "#FFF8EC",
          DEFAULT: "#8A5A00",
        },
        error: {
          light: "#FDECEC",
          DEFAULT: "#B3261E",
        },
        info: {
          light: "#dbeafe",
          DEFAULT: "#3b82f6",
        },
      },
      borderRadius: {
        shell: "14px",
        card: "12px",
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
