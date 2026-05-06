import type { CSSProperties } from "react";

// 시안(`~/Desktop/customer detail.html`) 의 cdStyles 를 1:1 로 옮긴 모듈.
// CSS 변수(`--bg` 등)는 globals.css 에 정의되어 있다.
export const cd = {
  page: {
    flex: 1,
    background: "var(--bg)",
    padding: "24px 28px 60px",
    overflowX: "hidden",
  } as CSSProperties,
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  } as CSSProperties,
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--text-2)",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  } as CSSProperties,
  pager: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--text-3)",
    fontSize: 12.5,
  } as CSSProperties,
  pagerBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--text-2)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as CSSProperties,
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 16,
  } as CSSProperties,
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
    letterSpacing: "-0.01em",
  } as CSSProperties,
  subtitle: {
    fontSize: 12.5,
    color: "var(--text-3)",
    marginTop: 6,
  } as CSSProperties,
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #1a1a1a",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  } as CSSProperties,

  personCard: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid var(--line)",
    padding: "18px 22px",
    marginBottom: 18,
  } as CSSProperties,
  personRow1: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "space-between",
  } as CSSProperties,
  personLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  } as CSSProperties,
  personName: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "-0.01em",
  } as CSSProperties,
  personRow2: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 22,
    flexWrap: "wrap",
    fontSize: 12.5,
    color: "var(--text-2)",
  } as CSSProperties,
  metaItem: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 6,
  } as CSSProperties,
  metaLabel: {
    color: "var(--text-3)",
    fontSize: 11.5,
  } as CSSProperties,
  metaVal: {
    color: "var(--text)",
    fontWeight: 500,
  } as CSSProperties,

  tabs: {
    marginTop: 16,
    display: "flex",
    gap: 22,
    borderBottom: "1px solid var(--line)",
    paddingBottom: 0,
    marginBottom: 16,
  } as CSSProperties,
  tab: (active: boolean, disabled: boolean): CSSProperties => ({
    padding: "10px 2px 12px",
    fontSize: 13,
    color: active ? "var(--text)" : disabled ? "#cbd5e1" : "var(--text-3)",
    fontWeight: active ? 600 : 500,
    borderBottom: active ? "2px solid #1a1a1a" : "2px solid transparent",
    marginBottom: -1,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: active ? "#1a1a1a" : "transparent",
  }),

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 16,
    alignItems: "start",
  } as CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 14,
  } as CSSProperties,
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  } as CSSProperties,
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  } as CSSProperties,
  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "#fff",
    color: "var(--text-2)",
    fontSize: 11.5,
    fontWeight: 500,
    cursor: "pointer",
  } as CSSProperties,

  infoTableWrap: {
    border: "1px solid var(--line)",
    borderRadius: 10,
    overflow: "hidden",
  } as CSSProperties,
  infoTable: {
    width: "100%",
    borderCollapse: "collapse",
    borderSpacing: 0,
    tableLayout: "fixed",
  } as CSSProperties,
  thLabel: {
    width: 130,
    padding: "12px 14px",
    fontSize: 12.5,
    color: "var(--text-3)",
    fontWeight: 500,
    textAlign: "left",
    background: "#fafafa",
    borderRight: "1px solid var(--line)",
    verticalAlign: "middle",
  } as CSSProperties,
  td: {
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--text)",
    verticalAlign: "middle",
  } as CSSProperties,

  emptyBox: {
    border: "1px dashed var(--line)",
    borderRadius: 10,
    padding: "20px 14px",
    fontSize: 12.5,
    color: "var(--text-3)",
    textAlign: "center",
    background: "#fafafa",
  } as CSSProperties,

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 0",
    fontSize: 12.5,
  } as CSSProperties,
  summaryLabel: { color: "var(--text-3)" } as CSSProperties,
  summaryVal: {
    color: "var(--text)",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  } as CSSProperties,
} as const;

type TagColor =
  | "slate"
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "indigo"
  | "teal"
  | "rose"
  | "yellow"
  | "purple";

const TAG_PALETTE: Record<TagColor, { bg: string; text: string; dot: string }> = {
  slate: { bg: "#f3f4f6", text: "#475569", dot: "#94a3b8" },
  green: { bg: "#dcfce7", text: "#166534", dot: "#16a34a" },
  blue: { bg: "#dbeafe", text: "#1e3a8a", dot: "#2563eb" },
  amber: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  red: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  indigo: { bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  teal: { bg: "#ccfbf1", text: "#115e59", dot: "#14b8a6" },
  rose: { bg: "#ffe4e6", text: "#9f1239", dot: "#f43f5e" },
  yellow: { bg: "#fef9c3", text: "#854d0e", dot: "#eab308" },
  purple: { bg: "#f3e8ff", text: "#6b21a8", dot: "#a855f7" },
};

export function tagStyle(
  color: TagColor,
  size: "sm" | "md" = "md",
): { wrap: CSSProperties; dot: CSSProperties } {
  const palette = TAG_PALETTE[color];
  return {
    wrap: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: palette.bg,
      color: palette.text,
      padding: size === "sm" ? "2px 7px" : "3px 9px",
      borderRadius: 999,
      fontSize: size === "sm" ? 10.5 : 11.5,
      fontWeight: 500,
      whiteSpace: "nowrap",
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: palette.dot,
      flexShrink: 0,
    },
  };
}

export type { TagColor };

// 백엔드 customerGrade enum → 태그 색상.
// PersonCard / BasicInfoCard 의 거래 의사 칩에서 동일 색을 쓰도록 한곳에 정의.
// ACTIVE_DEAL: 거래 진행 중 의미 → amber.  HIGH_INTENT: 의사 강함 → green.
const CUSTOMER_GRADE_COLOR: Record<string, TagColor> = {
  ACTIVE_DEAL: "amber",
  HIGH_INTENT: "green",
};

export function getCustomerGradeColor(grade: string | null | undefined): TagColor {
  if (!grade) return "slate";
  return CUSTOMER_GRADE_COLOR[grade.trim()] ?? "slate";
}
