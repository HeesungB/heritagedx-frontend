"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  useKpiSeries,
  type KpiFilters,
  type TrendDataPoint,
} from "@heritage-dx/store";
import { formatProfitShort, wonToManwon } from "@heritage-dx/utils";

type Range = "6months" | "1year";

const BASE_FILTERS: Omit<KpiFilters, "preset"> = {
  dateField: "contractDate",
  employeeId: "",
};

const CHART_HEIGHT = 170;

interface BarStat {
  label: string;
  year: string;
  monthLabel: string;
  value: number; // 원 단위
  isCurrent: boolean;
}

function deriveStats(series: TrendDataPoint[]): BarStat[] {
  return series.map((point, idx) => {
    const [y, m] = point.label.split("-");
    return {
      label: point.label,
      year: y,
      monthLabel: `${m}월`,
      value: point.profit,
      isCurrent: idx === series.length - 1,
    };
  });
}

export default function MonthlyTrendPanel() {
  const [range, setRange] = useState<Range>("1year");

  const filters: KpiFilters = useMemo(
    () => ({ ...BASE_FILTERS, preset: range }),
    [range],
  );

  const { data: trend, isLoading, error } = useKpiSeries(filters);

  const bars = useMemo(() => deriveStats(trend), [trend]);
  const peak = useMemo(
    () => bars.reduce((a, b) => (b.value > a.value ? b : a), bars[0] ?? { label: "", value: 0 } as BarStat),
    [bars],
  );
  const peakValue = peak?.value ?? 0;
  const current = bars[bars.length - 1];
  const ytd = useMemo(
    () => bars.reduce((sum, b) => sum + b.value, 0),
    [bars],
  );

  const half = peakValue / 2;
  const rangeLabel = `${trend[0]?.label ?? "—"} — ${trend[trend.length - 1]?.label ?? "—"} · ${trend.length} months`;

  const handleRetry = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="rounded-card border border-neutral-100 bg-surface p-[22px] px-[26px] pb-6">
      <div className="flex justify-between items-end mb-[22px] flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
            Profit / Month
          </span>
          <h2 className="text-lg font-bold tracking-[-0.02em] text-neutral-900 m-0">
            월별 순이익 추이
          </h2>
          <div className="text-xs text-neutral-500 mt-0.5 font-mono">
            {rangeLabel}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-baseline gap-[22px]">
            <Stat label="This Month" value={current?.value ?? 0} sub="이번 달 진행 중" />
            <Stat
              label="Peak"
              value={peakValue}
              sub={peak?.label ?? "—"}
            />
            <Stat
              label={range === "1year" ? "YTD" : "Period"}
              value={ytd}
              sub={`누적 ${bars.length}개월`}
            />
          </div>
          {/* range toggle */}
          <div className="inline-flex bg-neutral-50 rounded-lg p-0.5 border border-neutral-100">
            <button
              type="button"
              onClick={() => setRange("6months")}
              className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-colors ${
                range === "6months"
                  ? "bg-surface text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              6개월
            </button>
            <button
              type="button"
              onClick={() => setRange("1year")}
              className={`px-2.5 py-1 text-[11.5px] font-medium rounded-md transition-colors ${
                range === "1year"
                  ? "bg-surface text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              12개월
            </button>
          </div>
        </div>
      </div>

      {error && !isLoading ? (
        <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-center px-4">
          <AlertCircle className="w-5 h-5 text-error" />
          <p className="text-xs text-neutral-600">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="w-3 h-3" />
            다시 시도
          </button>
        </div>
      ) : (
        <div className="relative h-[220px] pl-9">
          {/* Y-axis ticks */}
          <div className="absolute left-9 right-0 h-0 bottom-9 border-t border-neutral-200">
            <span className="absolute -left-8 -top-2 text-[10.5px] text-neutral-400 font-mono">
              0
            </span>
          </div>
          <div
            className="absolute left-9 right-0 h-0 border-t border-dashed border-neutral-100"
            style={{ bottom: 36 + CHART_HEIGHT / 2 }}
          >
            <span className="absolute -left-8 -top-2 text-[10.5px] text-neutral-400 font-mono">
              {formatProfitShort(half)}
            </span>
          </div>
          <div
            className="absolute left-9 right-0 h-0 border-t border-dashed border-neutral-100"
            style={{ bottom: 36 + CHART_HEIGHT }}
          >
            <span className="absolute -left-8 -top-2 text-[10.5px] text-neutral-400 font-mono">
              {formatProfitShort(peakValue)}
            </span>
          </div>

          {/* Bars */}
          <div
            className="grid gap-2 h-[170px] items-end relative"
            style={{ gridTemplateColumns: `repeat(${bars.length}, 1fr)` }}
          >
            {isLoading && bars.length === 0
              ? Array.from({ length: range === "1year" ? 12 : 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    <div className="w-[70%] bg-neutral-100 animate-pulse rounded" style={{ height: 40 + (i % 4) * 20 }} />
                  </div>
                ))
              : bars.map((b) => {
                  const ratio = peakValue > 0 ? b.value / peakValue : 0;
                  const h = Math.max(2, ratio * CHART_HEIGHT);
                  return (
                    <div
                      key={b.label}
                      className="flex flex-col items-center justify-end h-full relative"
                    >
                      <div
                        className={`w-[70%] rounded relative ${
                          b.isCurrent
                            ? "bg-neutral-900 outline outline-[3px] outline-neutral-900/[0.06]"
                            : b.value > 0
                            ? "bg-neutral-600"
                            : "bg-neutral-200"
                        }`}
                        style={{ height: `${h}px` }}
                      >
                        {b.value > 0 && (
                          <span
                            className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[11.5px] font-semibold font-sans whitespace-nowrap ${
                              b.isCurrent ? "text-neutral-900" : "text-neutral-600"
                            }`}
                          >
                            {formatProfitShort(b.value)}
                          </span>
                        )}
                        {b.isCurrent && (
                          <span className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 -translate-y-[22px] text-[9.5px] font-semibold tracking-[0.1em] uppercase text-neutral-500 whitespace-nowrap">
                            NOW
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* X-axis labels */}
          <div
            className="grid gap-2 mt-3"
            style={{ gridTemplateColumns: `repeat(${bars.length || (range === "1year" ? 12 : 6)}, 1fr)` }}
          >
            {bars.map((b, idx) => {
              const showYear = idx === 0 || bars[idx - 1]?.year !== b.year;
              return (
                <div
                  key={b.label}
                  className="flex flex-col items-center gap-px"
                >
                  <span
                    className={`text-[11px] font-mono ${
                      b.isCurrent
                        ? "text-neutral-900 font-semibold"
                        : "text-neutral-500 font-medium"
                    }`}
                  >
                    {b.monthLabel}
                  </span>
                  {showYear && (
                    <span className="text-[9.5px] text-neutral-400 font-mono tracking-[0.04em]">
                      {b.year}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  const manwon = wonToManwon(value);
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
        {label}
      </span>
      <span className="text-lg font-bold tracking-[-0.02em] mt-1 font-sans text-neutral-900">
        {formatProfitShort(value)}{" "}
        <span className="text-xs text-neutral-500 font-medium">
          {manwon >= 10000 ? "" : "만원"}
        </span>
      </span>
      <span className="text-[11px] text-neutral-500 mt-0.5">{sub}</span>
    </div>
  );
}
