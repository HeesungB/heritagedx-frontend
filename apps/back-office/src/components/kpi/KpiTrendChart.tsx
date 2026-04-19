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
  Legend,
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
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
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
      <div className="h-[320px] flex items-center justify-center text-gray-400 text-sm">
        차트 데이터 로딩 중...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[320px] flex items-center justify-center text-gray-400 text-sm">
        데이터가 없습니다
      </div>
    );
  }

  const showTrade = metric === "all" || metric === "tradeCount";
  const showConsult = metric === "all" || metric === "consultationCount";
  const showProfit = metric === "all" || metric === "profit";
  const showCountAxis = showTrade || showConsult;
  const showProfitAxis = showProfit;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickLine={false}
        />
        {showCountAxis && (
          <YAxis
            yAxisId="count"
            orientation="left"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "건수",
              position: "insideTopLeft",
              offset: -5,
              style: { fontSize: 11, fill: "#9ca3af" },
            }}
          />
        )}
        {showProfitAxis && (
          <YAxis
            yAxisId="profit"
            orientation={showCountAxis ? "right" : "left"}
            tickFormatter={formatProfitTick}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "순이익",
              position: showCountAxis ? "insideTopRight" : "insideTopLeft",
              offset: -5,
              style: { fontSize: 11, fill: "#9ca3af" },
            }}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="square"
          iconSize={10}
        />
        {showTrade && (
          <Bar
            yAxisId="count"
            dataKey="tradeCount"
            name="거래 건수"
            fill="#6366f1"
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
        )}
        {showConsult && (
          <Bar
            yAxisId="count"
            dataKey="consultationCount"
            name="상담 건수"
            fill="#3b82f6"
            radius={[3, 3, 0, 0]}
            barSize={20}
          />
        )}
        {showProfit && (
          <Line
            yAxisId="profit"
            dataKey="profit"
            name="순이익"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e" }}
            activeDot={{ r: 5 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
