"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { wonToManwon, formatManwon, formatProfitShort } from "@heritage-dx/utils";
import type { KpiMetric, EmployeeKpiData } from "@heritage-dx/store";

export type { EmployeeKpiData };

interface KpiEmployeeComparisonProps {
  data: EmployeeKpiData[];
  isLoading?: boolean;
  metric?: KpiMetric;
}

type SortField = "profit" | "tradeCount" | "consultationCount";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: EmployeeKpiData }>;
}
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as EmployeeKpiData | undefined;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900 mb-1">{d.name}</p>
      <p className="text-gray-600">
        순이익: <span className="font-medium text-gray-900">{formatManwon(wonToManwon(d.profit))}</span>
      </p>
      <p className="text-gray-600">
        거래: <span className="font-medium text-gray-900">{d.tradeCount}건</span>
      </p>
      <p className="text-gray-600">
        상담: <span className="font-medium text-gray-900">{d.consultationCount}건</span>
      </p>
    </div>
  );
}

const METRIC_TO_SORT: Record<KpiMetric, SortField> = {
  all: "profit",
  tradeCount: "tradeCount",
  consultationCount: "consultationCount",
  profit: "profit",
};

export default function KpiEmployeeComparison({
  data,
  isLoading,
  metric = "all",
}: KpiEmployeeComparisonProps) {
  const [sortField, setSortField] = useState<SortField>("profit");

  // 개별 지표 모드에서는 해당 지표로 자동 정렬
  useEffect(() => {
    setSortField(METRIC_TO_SORT[metric]);
  }, [metric]);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b[sortField] - a[sortField]),
    [data, sortField],
  );

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
        직원 데이터 로딩 중...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
        직원 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort control */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">정렬</label>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        >
          <option value="profit">순이익</option>
          <option value="tradeCount">거래 건수</option>
          <option value="consultationCount">상담 건수</option>
        </select>
      </div>

      {/* Horizontal bar chart */}
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 48)}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={
              sortField === "profit" ? formatProfitShort : (v: number) => `${v}`
            }
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={60}
            tick={{ fontSize: 12, fill: "#374151" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey={sortField}
            fill={sortField === "profit" ? "#22c55e" : sortField === "consultationCount" ? "#3b82f6" : "#6366f1"}
            radius={[0, 4, 4, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="text-left py-2 px-3 font-medium">직원</th>
              <th className={`text-right py-2 px-3 font-medium ${metric === "tradeCount" ? "text-indigo-600" : ""}`}>거래</th>
              <th className={`text-right py-2 px-3 font-medium ${metric === "consultationCount" ? "text-blue-600" : ""}`}>상담</th>
              <th className={`text-right py-2 px-3 font-medium ${metric === "profit" ? "text-green-600" : ""}`}>순이익</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((emp) => (
              <tr
                key={emp.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2.5 px-3 font-medium text-gray-900">
                  {emp.name}
                </td>
                <td className={`py-2.5 px-3 text-right ${metric === "tradeCount" ? "font-semibold text-indigo-700" : "text-gray-700"}`}>
                  {emp.tradeCount}건
                </td>
                <td className={`py-2.5 px-3 text-right ${metric === "consultationCount" ? "font-semibold text-blue-700" : "text-gray-700"}`}>
                  {emp.consultationCount}건
                </td>
                <td className={`py-2.5 px-3 text-right font-medium ${metric === "profit" ? "text-green-700" : "text-gray-900"}`}>
                  {formatManwon(wonToManwon(emp.profit))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
