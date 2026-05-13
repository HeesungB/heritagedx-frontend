"use client";

import { useMemo } from "react";
import { wonToManwon } from "@heritage-dx/utils";
import type { EmployeeKpiData, KpiMetric } from "@heritage-dx/store";

import KpiViewTabs from "./KpiViewTabs";

interface KpiEmployeePanelProps {
  data: EmployeeKpiData[];
  isLoading?: boolean;
  metric: KpiMetric;
  onMetricChange: (metric: KpiMetric) => void;
}

type MetricKey = "tradeCount" | "consultationCount" | "profit";

const METRIC_FILL: Record<MetricKey, string> = {
  tradeCount: "bg-[#CA8A04]",
  consultationCount: "bg-[#EAB308]",
  profit: "bg-[#854D0E]",
};

const METRIC_UNIT: Record<MetricKey, string> = {
  tradeCount: "건",
  consultationCount: "건",
  profit: "만원",
};

function formatRank(idx: number): string {
  return String(idx + 1).padStart(2, "0");
}

function getValue(emp: EmployeeKpiData, key: MetricKey): number {
  if (key === "profit") return wonToManwon(emp.profit);
  return emp[key];
}

export default function KpiEmployeePanel({
  data,
  isLoading,
  metric,
  onMetricChange,
}: KpiEmployeePanelProps) {
  const isAll = metric === "all";
  const metricKey: MetricKey | null = isAll ? null : metric;

  const sorted = useMemo(() => {
    const arr = [...data];
    if (isAll) {
      arr.sort((a, b) => {
        const sumA = a.tradeCount + a.consultationCount + wonToManwon(a.profit);
        const sumB = b.tradeCount + b.consultationCount + wonToManwon(b.profit);
        return sumB - sumA;
      });
    } else if (metricKey) {
      arr.sort((a, b) => getValue(b, metricKey) - getValue(a, metricKey));
    }
    return arr;
  }, [data, isAll, metricKey]);

  const axisMax = useMemo(() => {
    if (!metricKey) return 0;
    const max = Math.max(0, ...data.map((d) => getValue(d, metricKey)));
    if (max <= 2) return 2;
    return Math.ceil(max);
  }, [data, metricKey]);

  return (
    <section className="flex flex-col min-h-0 border border-[#F0F0EE] rounded-[11px] bg-surface overflow-hidden">
      <header className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3.5 border-b border-neutral-50">
        <h2 className="text-[13px] font-bold text-neutral-900 tracking-[-0.005em] m-0">
          직원별 비교
        </h2>
        <KpiViewTabs value={metric} onChange={onMetricChange} />
      </header>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 px-4 pt-2.5 pb-2 overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-[12px]">
              직원 데이터 로딩 중...
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-[12px]">
              직원 데이터가 없습니다
            </div>
          ) : isAll ? (
            <AllList rows={sorted} />
          ) : (
            <MetricList rows={sorted} metricKey={metricKey!} axisMax={axisMax} />
          )}
        </div>
        <footer className="flex-shrink-0 px-4 py-2.5 border-t border-[#F0F0EE] bg-[#FAFAF9] flex items-center justify-between">
          <span className="text-[11.5px] text-neutral-500">
            총{" "}
            <strong className="text-neutral-900 font-bold tabular-nums">
              {data.length}
            </strong>
            명
          </span>
          {!isAll && (
            <div className="relative h-[14px] flex-1 max-w-[110px] ml-3 font-mono text-[10px] text-neutral-400">
              <span className="absolute top-0 left-0">0</span>
              <span className="absolute top-0 left-1/2 -translate-x-1/2">
                {Math.round(axisMax / 2)}
              </span>
              <span className="absolute top-0 right-0">{axisMax}</span>
            </div>
          )}
        </footer>
      </div>
    </section>
  );
}

function AllList({ rows }: { rows: EmployeeKpiData[] }) {
  return (
    <div className="flex flex-col">
      <div
        className="grid gap-2 pb-1.5 border-b border-neutral-200 mb-0.5 text-[10px] font-bold text-neutral-500 tracking-[0.06em] uppercase"
        style={{ gridTemplateColumns: "20px minmax(0,1fr) 46px 46px 64px" }}
      >
        <span />
        <span>직원</span>
        <span className="text-right text-[#CA8A04]">거래</span>
        <span className="text-right text-[#EAB308]">상담</span>
        <span className="text-right text-[#854D0E]">순이익</span>
      </div>
      {rows.map((emp, idx) => (
        <div
          key={emp.id}
          className="grid gap-2 items-center py-1.5 border-b border-dashed border-neutral-200 last:border-b-0"
          style={{ gridTemplateColumns: "20px minmax(0,1fr) 46px 46px 64px" }}
        >
          <span className="text-[10.5px] font-mono text-neutral-400 font-medium">
            {formatRank(idx)}
          </span>
          <span className="text-[11.5px] font-medium text-neutral-800 truncate tracking-[-0.005em]">
            {emp.name}
          </span>
          <ValueCell
            value={emp.tradeCount}
            color={emp.tradeCount > 0 ? "#CA8A04" : "#A3A3A3"}
            unit="건"
          />
          <ValueCell
            value={emp.consultationCount}
            color={emp.consultationCount > 0 ? "#2D2D2D" : "#A3A3A3"}
            unit="건"
          />
          <ValueCell
            value={wonToManwon(emp.profit)}
            color={emp.profit > 0 ? "#2D2D2D" : "#A3A3A3"}
            unit="만원"
          />
        </div>
      ))}
    </div>
  );
}

function MetricList({
  rows,
  metricKey,
  axisMax,
}: {
  rows: EmployeeKpiData[];
  metricKey: MetricKey;
  axisMax: number;
}) {
  return (
    <div className="flex flex-col">
      {rows.map((emp, idx) => {
        const v = getValue(emp, metricKey);
        const pct = axisMax > 0 ? Math.min(100, (v / axisMax) * 100) : 0;
        return (
          <div
            key={emp.id}
            className="grid gap-2.5 items-center py-1.5 border-b border-dashed border-neutral-200 last:border-b-0"
            style={{ gridTemplateColumns: "20px minmax(0,1fr) 110px 48px" }}
          >
            <span className="text-[10.5px] font-mono text-neutral-400 font-medium">
              {formatRank(idx)}
            </span>
            <span className="text-[11.5px] font-medium text-neutral-800 truncate tracking-[-0.005em]">
              {emp.name}
            </span>
            <div className="relative h-2 flex items-center">
              <span
                className="absolute inset-0 -z-10"
                style={{
                  backgroundImage: "linear-gradient(to right, #E5E5E3 1px, transparent 1px)",
                  backgroundSize: "25% 100%",
                  backgroundPosition: "0 50%",
                  backgroundRepeat: "repeat-x",
                  height: "7px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              {v > 0 && (
                <div
                  className={`h-1.5 rounded-sm transition-all duration-200 ${METRIC_FILL[metricKey]}`}
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
            <span
              className={`font-mono text-[11px] font-semibold text-right tabular-nums ${
                v === 0 ? "text-neutral-400 font-medium" : "text-neutral-800"
              }`}
            >
              {v}
              {METRIC_UNIT[metricKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ValueCell({
  value,
  color,
  unit,
}: {
  value: number;
  color: string;
  unit: string;
}) {
  return (
    <span
      className="font-mono text-[11px] font-semibold text-right tabular-nums"
      style={{ color }}
    >
      {value}
      {unit}
    </span>
  );
}
