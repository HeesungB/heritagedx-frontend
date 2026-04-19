"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarketPrices } from "@heritage-dx/store";
import type { MarketPricePeriod } from "@heritage-dx/store";

interface PriceChartProps {
  membershipId: string;
}

const PERIODS: { key: MarketPricePeriod; label: string }[] = [
  { key: "1w", label: "1주" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "1y", label: "1년" },
];

export default function PriceChart({ membershipId }: PriceChartProps) {
  const [period, setPeriod] = useState<MarketPricePeriod>("3m");
  const { prices, isLoading, isError } = useMarketPrices(membershipId, period);

  const data = useMemo(
    () =>
      prices.map((item) => ({
        date: item.date.slice(5).replace("-", "/"),
        price: Math.round(item.marketPrice / 10000),
      })),
    [prices],
  );

  const { yMin, yMax } = useMemo(() => {
    if (data.length === 0) return { yMin: 0, yMax: 0 };
    const vals = data.map((d) => d.price);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const padding = Math.round((max - min) * 0.15) || 500;
    return {
      yMin: Math.floor((min - padding) / 1000) * 1000,
      yMax: Math.ceil((max + padding) / 1000) * 1000,
    };
  }, [data]);

  const formatManwon = (value: number) => `${value.toLocaleString()}`;

  return (
    <div className="border-t border-gray-300">
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          시세 추이 (단위: 만원)
        </span>
        <div className="flex gap-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                period === key
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-gray-500">
            시세 데이터 로딩 중...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-gray-500">
            시세 데이터를 불러올 수 없습니다
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-gray-500">
            해당 기간의 시세 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={{ stroke: "#d1d5db" }}
                axisLine={{ stroke: "#d1d5db" }}
                tickFormatter={formatManwon}
                width={52}
              />
              <Tooltip
                formatter={(value?: number) => {
                  if (value == null) return ["-", "시세"];
                  return [`${value.toLocaleString()}만원`, "시세"];
                }}
                labelFormatter={(label) => `날짜: ${label}`}
                contentStyle={{
                  fontSize: 12,
                  borderColor: "#d1d5db",
                  borderRadius: 4,
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#111827"
                strokeWidth={2}
                dot={{ r: 3, fill: "#111827" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
