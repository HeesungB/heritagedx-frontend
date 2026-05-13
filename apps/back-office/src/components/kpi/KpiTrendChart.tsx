"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { wonToManwon } from "@heritage-dx/utils";
import type { TrendDataPoint, KpiMetric } from "@heritage-dx/store";

export type { TrendDataPoint, KpiMetric };

interface KpiTrendChartProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  metric?: KpiMetric;
}

function formatProfitTick(value: number): string {
  const manwon = wonToManwon(value);
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    if (rem === 0) return `${eok}억`;
    return `${eok}.${Math.round(rem / 1000)}억`;
  }
  if (manwon >= 1000) {
    return `${(manwon / 1000).toFixed(1)}천만`;
  }
  return `${manwon}만`;
}

function formatTooltipProfit(value: number): string {
  const manwon = wonToManwon(value);
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rem = manwon % 10000;
    if (rem === 0) return `${eok}억원`;
    return `${eok}억 ${rem.toLocaleString("ko-KR")}만원`;
  }
  return `${manwon.toLocaleString("ko-KR")}만원`;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[10px] border border-neutral-200 bg-surface px-3 py-2 text-[12px]"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)" }}
    >
      <p className="font-semibold text-neutral-900 mb-1 text-[12.5px]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5 leading-[1.6]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-500">{entry.name}:</span>
          <span className="font-semibold text-neutral-900 tabular-nums">
            {entry.dataKey === "profit"
              ? formatTooltipProfit(entry.value)
              : `${entry.value}건`}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function KpiTrendChart({
  data,
  isLoading,
  metric = "all",
}: KpiTrendChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[12px]">
        차트 데이터 로딩 중...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[12px]">
        데이터가 없습니다
      </div>
    );
  }

  const showTrade = metric === "all" || metric === "tradeCount";
  const showConsult = metric === "all" || metric === "consultationCount";
  const showProfit = metric === "all" || metric === "profit";
  const showCountAxis = showTrade || showConsult;
  const showProfitAxis = showProfit;

  const axisTick = {
    fontSize: 11,
    fill: "#A3A3A3",
    fontFamily: "'JetBrains Mono', monospace",
  } as const;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 4" stroke="#F0F0EE" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#737373" }}
          tickLine={false}
          axisLine={{ stroke: "#D4D4D2" }}
        />
        {showCountAxis && (
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
        )}
        {showProfitAxis && (
          <YAxis
            yAxisId="profit"
            orientation={showCountAxis ? "right" : "left"}
            tickFormatter={formatProfitTick}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
          />
        )}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(10,10,10,0.04)" }} />
        {showTrade && (
          <Bar
            yAxisId="count"
            dataKey="tradeCount"
            name="거래 건수"
            fill="#CA8A04"
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
        )}
        {showConsult && (
          <Bar
            yAxisId="count"
            dataKey="consultationCount"
            name="상담 건수"
            fill="#EAB308"
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
        )}
        {showProfit && (
          <Line
            yAxisId="profit"
            dataKey="profit"
            name="순이익"
            stroke="#854D0E"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#FFFFFF", stroke: "#854D0E", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#FFFFFF", stroke: "#854D0E", strokeWidth: 2 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
