"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import { wonToManwon, formatManwon } from "@heritage-dx/utils";
import {
  TrendingUp,
  MessageSquare,
  FileText,
  BarChart3,
} from "lucide-react";
import type { Employee } from "@/types";
import KpiFilterBar, {
  type KpiFilters,
  getDateRange,
  getTimeBuckets,
} from "@/components/kpi/KpiFilterBar";
import KpiTrendChart, {
  type TrendDataPoint,
  type KpiMetric,
} from "@/components/kpi/KpiTrendChart";
import KpiEmployeeComparison, {
  type EmployeeKpiData,
} from "@/components/kpi/KpiEmployeeComparison";

interface KpiSummary {
  tradeCount: number;
  profit: number;
  consultationCount: number;
}

export default function KpiPage() {
  const { kpi } = useAdminRepositories();

  const [filters, setFilters] = useState<KpiFilters>({
    preset: "thisMonth",
    dateField: "contractDate",
    employeeId: "",
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<KpiSummary>({
    tradeCount: 0,
    profit: 0,
    consultationCount: 0,
  });
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeKpiData[]>([]);
  const [viewMode, setViewMode] = useState<KpiMetric>("all");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const reqSummary = useRef(0);
  const reqTrend = useRef(0);
  const reqEmp = useRef(0);

  // Load employee list once
  useEffect(() => {
    kpi.getEmployees().then((res) => {
      if (res?.data) setEmployees(res.data);
    });
  }, [kpi]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    const id = ++reqSummary.current;
    setLoadingSummary(true);
    const { startDate, endDate } = getDateRange(filters.preset, filters.customStart, filters.customEnd);

    try {
      const [tradesRes, consultsRes] = await Promise.all([
        kpi.getTrades({
          startDate,
          endDate,
          dateField: filters.dateField,
          ...(filters.employeeId && { userId: filters.employeeId }),
        }),
        kpi.getConsultations({
          startDate,
          endDate,
          dateField: filters.dateField === "contractDate" ? "registrationDate" : "createdAt",
          ...(filters.employeeId && { userId: filters.employeeId }),
        }),
      ]);

      if (id !== reqSummary.current) return;

      console.log("[KPI 상세] 요약 trades 응답:", tradesRes);
      console.log("[KPI 상세] 요약 consultations 응답:", consultsRes);

      setSummary({
        tradeCount: tradesRes?.data?.totalCount ?? 0,
        profit: tradesRes?.data?.totalNetProfit ?? 0,
        consultationCount: consultsRes?.data?.totalCount ?? 0,
      });
    } catch {
      // ignore
    } finally {
      if (id === reqSummary.current) setLoadingSummary(false);
    }
  }, [kpi, filters]);

  // Fetch trend
  const fetchTrend = useCallback(async () => {
    const id = ++reqTrend.current;
    setLoadingTrend(true);
    const { startDate, endDate } = getDateRange(filters.preset, filters.customStart, filters.customEnd);
    const buckets = getTimeBuckets(filters.preset, startDate, endDate);

    try {
      const [tradeResults, consultResults] = await Promise.all([
        Promise.all(
          buckets.map((b) =>
            kpi.getTrades({
              startDate: b.startDate,
              endDate: b.endDate,
              dateField: filters.dateField,
              ...(filters.employeeId && { userId: filters.employeeId }),
            }),
          ),
        ),
        Promise.all(
          buckets.map((b) =>
            kpi.getConsultations({
              startDate: b.startDate,
              endDate: b.endDate,
              dateField: filters.dateField === "contractDate" ? "registrationDate" : "createdAt",
              ...(filters.employeeId && { userId: filters.employeeId }),
            }),
          ),
        ),
      ]);

      if (id !== reqTrend.current) return;

      console.log("[KPI 상세] 추이 trades 응답:", tradeResults.map((r, i) => ({
        label: buckets[i].label,
        raw: r,
        data: r?.data,
      })));

      setTrendData(
        buckets.map((b, i) => ({
          label: b.label,
          tradeCount: tradeResults[i]?.data?.totalCount ?? 0,
          consultationCount: consultResults[i]?.data?.totalCount ?? 0,
          profit: tradeResults[i]?.data?.totalNetProfit ?? 0,
        })),
      );
    } catch {
      // ignore
    } finally {
      if (id === reqTrend.current) setLoadingTrend(false);
    }
  }, [kpi, filters]);

  // Fetch employee comparison
  const fetchEmployeeComparison = useCallback(async () => {
    if (!employees.length) return;
    const id = ++reqEmp.current;
    setLoadingEmployees(true);
    const { startDate, endDate } = getDateRange(filters.preset, filters.customStart, filters.customEnd);

    try {
      const [tradeResults, consultResults] = await Promise.all([
        Promise.all(
          employees.map((emp) =>
            kpi.getTrades({
              startDate,
              endDate,
              dateField: filters.dateField,
              userId: emp.id,
            }),
          ),
        ),
        Promise.all(
          employees.map((emp) =>
            kpi.getConsultations({
              startDate,
              endDate,
              dateField: filters.dateField === "contractDate" ? "registrationDate" : "createdAt",
              userId: emp.id,
            }),
          ),
        ),
      ]);

      if (id !== reqEmp.current) return;

      console.log("[KPI 상세] 직원별 trades 응답:", employees.map((emp, i) => ({
        name: emp.name,
        userId: emp.id,
        raw: tradeResults[i],
        data: tradeResults[i]?.data,
      })));
      console.log("[KPI 상세] 직원별 consultations 응답:", employees.map((emp, i) => ({
        name: emp.name,
        userId: emp.id,
        raw: consultResults[i],
        data: consultResults[i]?.data,
      })));

      setEmployeeData(
        employees.map((emp, i) => ({
          id: emp.id,
          name: emp.name,
          tradeCount: tradeResults[i]?.data?.totalCount ?? 0,
          consultationCount: consultResults[i]?.data?.totalCount ?? 0,
          profit: tradeResults[i]?.data?.totalNetProfit ?? 0,
        })),
      );
    } catch {
      // ignore
    } finally {
      if (id === reqEmp.current) setLoadingEmployees(false);
    }
  }, [kpi, employees, filters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  useEffect(() => {
    fetchEmployeeComparison();
  }, [fetchEmployeeComparison]);

  const profitManwon = wonToManwon(summary.profit);

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
