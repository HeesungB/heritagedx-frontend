import type { Config } from "tailwindcss";
import sharedConfig from "@heritage-dx/tailwind-config/tailwind.config";

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      ...sharedConfig.theme?.extend,
      colors: {
        ...(sharedConfig.theme?.extend as Record<string, unknown>)?.colors as Record<string, unknown>,
        // OS-specific: gray scale overrides + CSS variable-based colors
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#000000",
          950: "#000000",
        },
        // CSS variable-based theme colors (OS-specific)
        "border-theme": {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
          primary: "var(--color-border-primary)",
        },
        "text-theme": {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
        },
        link: {
          DEFAULT: "var(--color-link)",
          hover: "var(--color-link-hover)",
        },
      },
    },
  },
};

export default config;
