"use client";

import type { ComponentType } from "react";
import type { KpiMetric, TrendDataPoint } from "@heritage-dx/store";

import KpiViewTabs from "./KpiViewTabs";

interface KpiTrendPanelProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  metric: KpiMetric;
  onMetricChange: (metric: KpiMetric) => void;
  rangeText: string;
  ChartComponent: ComponentType<{
    data: TrendDataPoint[];
    isLoading?: boolean;
    metric?: KpiMetric;
  }>;
}

export default function KpiTrendPanel({
  data,
  isLoading,
  metric,
  onMetricChange,
  rangeText,
  ChartComponent,
}: KpiTrendPanelProps) {
  return (
    <section className="flex flex-col min-h-0 border border-[#F0F0EE] rounded-[11px] bg-surface overflow-hidden">
      <header className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3.5 border-b border-neutral-50">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[13px] font-bold text-neutral-900 tracking-[-0.005em] whitespace-nowrap m-0">
            주차별 추이
          </h2>
          <span className="text-[11px] text-neutral-500 font-mono truncate">
            {rangeText}
          </span>
        </div>
        <KpiViewTabs value={metric} onChange={onMetricChange} />
      </header>
      <div className="flex-1 min-h-0 px-3.5 pt-1.5 pb-2 flex flex-col gap-1.5">
        <div className="flex-1 min-h-[200px] w-full">
          <ChartComponent data={data} isLoading={isLoading} metric={metric} />
        </div>
        <div className="flex-shrink-0 flex justify-center items-center gap-[18px] pt-2 border-t border-dashed border-neutral-200">
          <Legend swatch="bg-[#CA8A04]" label="거래 건수" />
          <Legend swatch="bg-[#EAB308]" label="상담 건수" />
          <LegendLine label="순이익" />
        </div>
      </div>
    </section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 tracking-[-0.005em]">
      <span className={`w-[11px] h-[11px] rounded-[3px] ${swatch}`} />
      {label}
    </span>
  );
}

function LegendLine({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 tracking-[-0.005em]">
      <span className="relative w-[14px] h-0 border-t-[2.5px] border-[#854D0E]">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-white border-2 border-[#854D0E]" />
      </span>
      {label}
    </span>
  );
}
