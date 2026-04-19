"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  useKpi,
  useKpiSummary,
  useKpiSeries,
  useKpiByEmployee,
  type KpiFilters,
  type KpiMetric,
  type EmployeeEntity,
} from "@heritage-dx/store";
import { wonToManwon, formatManwon } from "@heritage-dx/utils";
import {
  TrendingUp,
  MessageSquare,
  FileText,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import KpiFilterBar from "@/components/kpi/KpiFilterBar";

// recharts 는 초기 번들 분리 — /kpi 진입 시점에만 로드 (1-2)
const KpiTrendChart = dynamic(() => import("@/components/kpi/KpiTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-gray-100 rounded animate-pulse" aria-label="추세 차트 로딩 중" />
  ),
});
const KpiEmployeeComparison = dynamic(
  () => import("@/components/kpi/KpiEmployeeComparison"),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 bg-gray-100 rounded animate-pulse" aria-label="담당자 비교 차트 로딩 중" />
    ),
  },
);

export default function KpiPage() {
  const { fetchEmployees } = useKpi();

  const [filters, setFilters] = useState<KpiFilters>({
    preset: "thisMonth",
    dateField: "contractDate",
    employeeId: "",
  });
  const [employees, setEmployees] = useState<EmployeeEntity[]>([]);
  const [viewMode, setViewMode] = useState<KpiMetric>("all");

  // 직원 목록 1회 로드
  useEffect(() => {
    fetchEmployees().then((res) => {
      if (res?.data) setEmployees(res.data);
    });
  }, [fetchEmployees]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
  } = useKpiSummary(filters);
  const {
    data: trendData,
    isLoading: loadingTrend,
    error: trendError,
  } = useKpiSeries(filters);
  const {
    data: employeeData,
    isLoading: loadingEmployees,
    error: employeeError,
  } = useKpiByEmployee(filters, employees);

  const profitManwon = wonToManwon(summary.profit);
  const pageError = summaryError ?? trendError ?? employeeError;

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
        </div>

        {/* Filter bar */}
        <div className="mb-6">
          <KpiFilterBar
            filters={filters}
            employees={employees}
            onChange={setFilters}
          />
        </div>

        {/* Error banner */}
        {pageError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">KPI 데이터를 일부 또는 전부 불러오지 못했습니다.</p>
              <p className="text-xs mt-0.5 text-red-600">{pageError}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              새로고침
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            icon={<FileText className="w-5 h-5" />}
            label="거래 건수"
            value={loadingSummary ? undefined : `${summary.tradeCount}건`}
            color="indigo"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="총 순이익"
            value={loadingSummary ? undefined : formatManwon(profitManwon)}
            color="green"
          />
          <SummaryCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="상담 건수"
            value={loadingSummary ? undefined : `${summary.consultationCount}건`}
            color="blue"
          />
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 mb-6">
          {([
            { key: "all", label: "종합" },
            { key: "tradeCount", label: "거래 건수" },
            { key: "consultationCount", label: "상담 건수" },
            { key: "profit", label: "순이익" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
                viewMode === key
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Trend chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            추이
          </h2>
          <KpiTrendChart data={trendData} isLoading={loadingTrend} metric={viewMode} />
        </div>

        {/* Employee comparison */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            직원별 비교
          </h2>
          <KpiEmployeeComparison
            data={employeeData}
            isLoading={loadingEmployees}
            metric={viewMode}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  color: "indigo" | "green" | "blue";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };

  const isLoading = value === undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        {isLoading ? (
          <div className="mt-1.5 h-6 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}
