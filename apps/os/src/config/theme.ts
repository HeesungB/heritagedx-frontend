/**
 * Heritage OS 테마 설정 파일
 *
 * 이 파일에서 앱 전체의 색상 테마를 관리합니다.
 * 색상을 변경하려면 아래의 colors 객체를 수정하세요.
 */

export type ThemeColors = {
  // Primary 색상 - 주요 버튼, 강조 요소
  primary: {
    DEFAULT: string;
    hover: string;
    disabled: string;
    foreground: string;
  };

  // Background 색상 - 배경
  background: {
    DEFAULT: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };

  // Border 색상 - 테두리
  border: {
    DEFAULT: string;
    strong: string;
    primary: string;
  };

  // Text 색상 - 텍스트
  text: {
    DEFAULT: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
  };

  // Semantic 색상 - 상태 표시
  info: {
    background: string;
    border: string;
    text: string;
  };
  success: {
    background: string;
    border: string;
    text: string;
  };
  error: {
    background: string;
    border: string;
    text: string;
  };

  // Link 색상
  link: {
    DEFAULT: string;
    hover: string;
  };
};

// 기본 테마: 검은색/흰색 모노크롬
export const defaultTheme: ThemeColors = {
  primary: {
    DEFAULT: '#000000',     // 검은색
    hover: '#1f1f1f',       // 약간 밝은 검은색
    disabled: '#9ca3af',    // 회색
    foreground: '#ffffff',  // 흰색
  },

  background: {
    DEFAULT: '#ffffff',     // 흰색
    secondary: '#f9fafb',   // 매우 밝은 회색
    tertiary: '#f3f4f6',    // 밝은 회색
    muted: '#e5e7eb',       // 연한 회색
  },

  border: {
    DEFAULT: '#e5e7eb',     // 연한 회색
    strong: '#d1d5db',      // 중간 회색
    primary: '#000000',     // 검은색
  },

  text: {
    DEFAULT: '#111827',     // 거의 검은색
    secondary: '#4b5563',   // 어두운 회색
    muted: '#6b7280',       // 중간 회색
    disabled: '#9ca3af',    // 밝은 회색
    inverse: '#ffffff',     // 흰색
  },

  info: {
    background: '#f3f4f6',  // 밝은 회색 (기존 blue-50 대체)
    border: '#d1d5db',      // 중간 회색 (기존 blue-200 대체)
    text: '#374151',        // 어두운 회색
  },

  success: {
    background: '#f0fdf4',  // 연한 초록
    border: '#bbf7d0',      // 밝은 초록
    text: '#166534',        // 진한 초록
  },

  error: {
    background: '#fef2f2',  // 연한 빨강
    border: '#fecaca',      // 밝은 빨강
    text: '#dc2626',        // 빨강
  },

  link: {
    DEFAULT: '#000000',     // 검은색 (기존 blue-600 대체)
    hover: '#374151',       // 어두운 회색
  },
};

// CSS 변수 이름을 생성하는 헬퍼 함수
export function getCSSVariables(theme: ThemeColors): Record<string, string> {
  return {
    '--color-primary': theme.primary.DEFAULT,
    '--color-primary-hover': theme.primary.hover,
    '--color-primary-disabled': theme.primary.disabled,
    '--color-primary-foreground': theme.primary.foreground,

    '--color-background': theme.background.DEFAULT,
    '--color-background-secondary': theme.background.secondary,
    '--color-background-tertiary': theme.background.tertiary,
    '--color-background-muted': theme.background.muted,

    '--color-border': theme.border.DEFAULT,
    '--color-border-strong': theme.border.strong,
    '--color-border-primary': theme.border.primary,

    '--color-text': theme.text.DEFAULT,
    '--color-text-secondary': theme.text.secondary,
    '--color-text-muted': theme.text.muted,
    '--color-text-disabled': theme.text.disabled,
    '--color-text-inverse': theme.text.inverse,

    '--color-info-background': theme.info.background,
    '--color-info-border': theme.info.border,
    '--color-info-text': theme.info.text,

    '--color-success-background': theme.success.background,
    '--color-success-border': theme.success.border,
    '--color-success-text': theme.success.text,

    '--color-error-background': theme.error.background,
    '--color-error-border': theme.error.border,
    '--color-error-text': theme.error.text,

    '--color-link': theme.link.DEFAULT,
    '--color-link-hover': theme.link.hover,
  };
}

// 현재 사용 중인 테마
export const currentTheme = defaultTheme;
