import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        primary: "#000000",
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
          primary: "#111827",
          secondary: "#6b7280",
          tertiary: "#9ca3af",
        },
        success: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
        },
        error: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
        },
        info: {
          light: "#dbeafe",
          DEFAULT: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
