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
        // Gray 색상 - 순수 검은색/흰색 계열로 재정의
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
          900: "#000000",  // 순수 검은색
          950: "#000000",
        },
        // Primary 색상 - 주요 버튼, 강조 요소
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          disabled: "var(--color-primary-disabled)",
          foreground: "var(--color-primary-foreground)",
        },

        // Background 색상 - 배경
        background: {
          DEFAULT: "var(--color-background)",
          secondary: "var(--color-background-secondary)",
          tertiary: "var(--color-background-tertiary)",
          muted: "var(--color-background-muted)",
        },

        // Border 색상 - 테두리
        "border-theme": {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
          primary: "var(--color-border-primary)",
        },

        // Text 색상 - 텍스트
        "text-theme": {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
        },

        // Info 색상 - 정보 안내
        info: {
          background: "var(--color-info-background)",
          border: "var(--color-info-border)",
          text: "var(--color-info-text)",
        },

        // Success 색상 - 성공 상태
        success: {
          background: "var(--color-success-background)",
          border: "var(--color-success-border)",
          text: "var(--color-success-text)",
        },

        // Error 색상 - 오류 상태
        error: {
          background: "var(--color-error-background)",
          border: "var(--color-error-border)",
          text: "var(--color-error-text)",
        },

        // Link 색상
        link: {
          DEFAULT: "var(--color-link)",
          hover: "var(--color-link-hover)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
