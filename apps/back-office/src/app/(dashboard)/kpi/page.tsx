"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  useKpi,
  useKpiSummary,
  useKpiSeries,
  useKpiByEmployee,
  type EmployeeEntity,
  type KpiFilters,
  type KpiMetric,
  type PeriodPreset,
  getDateRange,
} from "@heritage-dx/store";
import { formatManwon, wonToManwon } from "@heritage-dx/utils";
import { AlertCircle } from "lucide-react";

import KpiPageBar from "@/components/kpi/KpiPageBar";
import KpiRangeChips from "@/components/kpi/KpiRangeChips";
import KpiSummaryStrip from "@/components/kpi/KpiSummaryStrip";
import KpiTrendPanel from "@/components/kpi/KpiTrendPanel";
import KpiEmployeePanel from "@/components/kpi/KpiEmployeePanel";

const KpiTrendChart = dynamic(() => import("@/components/kpi/KpiTrendChart"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full bg-neutral-50 rounded animate-pulse"
      aria-label="추세 차트 로딩 중"
    />
  ),
});

export default function KpiPage() {
  const { fetchEmployees } = useKpi();

  const [filters, setFilters] = useState<KpiFilters>({
    preset: "thisMonth",
    dateField: "contractDate",
    employeeId: "",
  });
  const [employees, setEmployees] = useState<EmployeeEntity[]>([]);
  const [trendMetric, setTrendMetric] = useState<KpiMetric>("all");
  const [employeeMetric, setEmployeeMetric] = useState<KpiMetric>("all");

  useEffect(() => {
    fetchEmployees().then((res) => {
      if (res?.data) setEmployees(res.data);
    });
  }, [fetchEmployees]);

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

  const { startDate, endDate } = useMemo(
    () => getDateRange(filters.preset, filters.customStart, filters.customEnd),
    [filters.preset, filters.customStart, filters.customEnd],
  );
  const rangeText = `${startDate} ~ ${endDate}`;

  const handleRangeChipChange = (preset: PeriodPreset) => {
    setFilters((prev) => ({
      ...prev,
      preset,
      customStart: undefined,
      customEnd: undefined,
    }));
  };

  const handleApplyCustomRange = (start: string, end: string) => {
    setFilters((prev) => ({
      ...prev,
      preset: "custom",
      customStart: start,
      customEnd: end,
    }));
  };

  const handleDateFieldChange = (value: KpiFilters["dateField"]) => {
    setFilters((prev) => ({ ...prev, dateField: value }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    setFilters((prev) => ({ ...prev, employeeId }));
  };

  const pageError = summaryError ?? trendError ?? employeeError;
  const profitText = formatManwon(wonToManwon(summary.profit));

  return (
    <div className="min-h-screen bg-[#F4F4F2] flex flex-col">
      <KpiPageBar
        filters={filters}
        employees={employees}
        rangeText={rangeText}
        onApplyCustomRange={handleApplyCustomRange}
        onDateFieldChange={handleDateFieldChange}
        onEmployeeChange={handleEmployeeChange}
      />

      <main className="flex-1 min-h-0 px-3.5 py-2.5 flex flex-col gap-2.5 overflow-auto">
        {pageError && (
          <div className="flex items-start gap-2 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[12.5px] text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">KPI 데이터를 일부 또는 전부 불러오지 못했습니다.</p>
              <p className="text-[11.5px] mt-0.5 text-[#DC2626]">{pageError}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-[11.5px] font-semibold text-[#B91C1C] hover:text-[#7F1D1D] underline"
            >
              새로고침
            </button>
          </div>
        )}

        <KpiRangeChips value={filters.preset} onChange={handleRangeChipChange} />

        <KpiSummaryStrip
          tradeCount={summary.tradeCount}
          consultationCount={summary.consultationCount}
          profitText={profitText}
          isLoading={loadingSummary}
        />

        <div className="grid gap-2.5 min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <KpiTrendPanel
            data={trendData}
            isLoading={loadingTrend}
            metric={trendMetric}
            onMetricChange={setTrendMetric}
            rangeText={rangeText}
            ChartComponent={KpiTrendChart}
          />
          <KpiEmployeePanel
            data={employeeData}
            isLoading={loadingEmployees}
            metric={employeeMetric}
            onMetricChange={setEmployeeMetric}
          />
        </div>
      </main>
    </div>
  );
}
