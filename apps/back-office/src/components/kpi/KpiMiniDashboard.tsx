"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ArrowRight,
  TrendingUp,
  MessageSquare,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useKpiSummary, useKpiSeries, type KpiFilters } from "@heritage-dx/store";
import { wonToManwon, formatManwon } from "@heritage-dx/utils";

const MINI_FILTERS: KpiFilters = {
  preset: "thisMonth",
  dateField: "contractDate",
  employeeId: "",
};

const TREND_FILTERS: KpiFilters = {
  preset: "6months",
  dateField: "contractDate",
  employeeId: "",
};

export default function KpiMiniDashboard() {
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useKpiSummary(MINI_FILTERS);
  const {
    data: trend,
    isLoading: trendLoading,
    error: trendError,
  } = useKpiSeries(TREND_FILTERS);

  const profitManwon = wonToManwon(summary.profit);
  const hasSummaryError = Boolean(summaryError) && !summaryLoading;
  const hasTrendError = Boolean(trendError) && !trendLoading;

  const chartData = trend.map((b) => ({
    month: b.label.slice(5), // "2026-04" → "04"
    trades: b.tradeCount,
    consultations: b.consultationCount,
  }));

  const handleRetry = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<FileText className="w-4 h-4" />}
          label="거래 건수"
          value={summaryLoading ? undefined : `${summary.tradeCount}건`}
          color="indigo"
          hasError={hasSummaryError}
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="총 순이익"
          value={summaryLoading ? undefined : formatManwon(profitManwon)}
          color="green"
          hasError={hasSummaryError}
        />
        <SummaryCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="상담 건수"
          value={summaryLoading ? undefined : `${summary.consultationCount}건`}
          color="blue"
          hasError={hasSummaryError}
        />
      </div>

      {/* Mini trend chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">최근 6개월 추이</h3>
          <Link
            href="/kpi"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            통계 더보기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {trendLoading ? (
          <div className="h-[140px] flex flex-col items-center justify-center gap-2">
            <div className="flex items-end gap-1.5">
              {[40, 60, 80, 50, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-5 bg-gray-200 rounded-sm animate-pulse"
                  style={{ height: h, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">차트 로딩 중...</p>
          </div>
        ) : hasTrendError ? (
          <div className="h-[140px] flex flex-col items-center justify-center gap-2 text-center px-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-xs text-gray-600">{trendError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-3 h-3" />
              다시 시도
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                formatter={(value, name) => [
                  `${value}건`,
                  name === "trades" ? "거래" : "상담",
                ]}
                labelFormatter={(label) => `${label}월`}
              />
              <Bar dataKey="trades" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={14} />
              <Bar dataKey="consultations" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  hasError,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  color: "indigo" | "green" | "blue";
  hasError?: boolean;
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };

  const isLoading = value === undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label} (이번 달)</p>
        {isLoading ? (
          <div className="mt-1.5 h-5 w-20 bg-gray-200 rounded animate-pulse" />
        ) : hasError ? (
          <p className="text-sm text-gray-400">데이터 로드 실패</p>
        ) : (
          <p className="text-lg font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}
