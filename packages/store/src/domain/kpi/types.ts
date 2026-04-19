export interface KpiSummary {
  tradeCount: number;
  profit: number; // 원 단위
  consultationCount: number;
}

export interface TrendDataPoint {
  label: string; // 버킷 라벨 (예: "2026-04", "4/14", "4월 첫째주")
  tradeCount: number;
  consultationCount: number;
  profit: number; // 원 단위
}

export interface EmployeeKpiData {
  id: string;
  name: string;
  tradeCount: number;
  consultationCount: number;
  profit: number; // 원 단위
}

export type KpiMetric = "all" | "tradeCount" | "consultationCount" | "profit";
