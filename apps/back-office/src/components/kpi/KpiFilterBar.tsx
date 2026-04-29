"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { EmployeeEntity } from "@heritage-dx/store";
import {
  type PeriodPreset,
  type KpiFilters,
  PRESET_GROUPS,
  getDateRange,
} from "@heritage-dx/store";

interface KpiFilterBarProps {
  filters: KpiFilters;
  employees: EmployeeEntity[];
  onChange: (filters: KpiFilters) => void;
}

export default function KpiFilterBar({
  filters,
  employees,
  onChange,
}: KpiFilterBarProps) {
  const [showCustom, setShowCustom] = useState(filters.preset === "custom");

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [employees],
  );

  const handlePreset = (key: PeriodPreset) => {
    if (key === "custom") {
      setShowCustom(true);
      // 현재 프리셋의 날짜 범위를 그대로 복사 → 데이터 변동 없음
      const { startDate, endDate } = getDateRange(filters.preset, filters.customStart, filters.customEnd);
      onChange({
        ...filters,
        preset: "custom",
        customStart: startDate,
        customEnd: endDate,
      });
    } else {
      setShowCustom(false);
      onChange({ ...filters, preset: key, customStart: undefined, customEnd: undefined });
    }
  };

  const { startDate, endDate } = getDateRange(filters.preset, filters.customStart, filters.customEnd);

  return (
    <div className="space-y-3">
      {/* Row 1: Presets + Custom toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {PRESET_GROUPS.map(({ key, label }, i) => {
            const prev = PRESET_GROUPS[i - 1];
            const showDivider = prev && prev.group !== PRESET_GROUPS[i].group;
            return (
              <span key={key} className="contents">
                {showDivider && (
                  <span className="hidden sm:inline-block w-px h-5 bg-gray-200 mx-0.5" />
                )}
                <button
                  onClick={() => handlePreset(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    filters.preset === key
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              </span>
            );
          })}
          <span className="hidden sm:inline-block w-px h-5 bg-gray-200 mx-0.5" />
          <button
            onClick={() => handlePreset("custom")}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1 ${
              filters.preset === "custom"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            직접 선택
          </button>
        </div>
      </div>

      {/* Row 2: Custom date range + other filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {showCustom && (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.customStart || ""}
              onChange={(e) =>
                onChange({ ...filters, preset: "custom", customStart: e.target.value })
              }
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={filters.customEnd || ""}
              onChange={(e) =>
                onChange({ ...filters, preset: "custom", customEnd: e.target.value })
              }
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
            <span className="hidden sm:block w-px h-6 bg-gray-200" />
          </div>
        )}

        {/* 선택 기간 표시 */}
        {!showCustom && (
          <span className="text-xs text-gray-400">
            {startDate} ~ {endDate}
          </span>
        )}

        <div className="hidden sm:block w-px h-6 bg-gray-200" />

        {/* Date field — 상담 KPI 에만 적용 (거래 KPI 는 백엔드 기본값 사용) */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">상담 날짜 기준</label>
          <select
            value={filters.dateField}
            onChange={(e) =>
              onChange({ ...filters, dateField: e.target.value as KpiFilters["dateField"] })
            }
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            <option value="contractDate">등록일</option>
            <option value="createdAt">생성일</option>
          </select>
        </div>

        {/* Employee filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">직원</label>
          <select
            value={filters.employeeId}
            onChange={(e) =>
              onChange({ ...filters, employeeId: e.target.value })
            }
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            <option value="">전체</option>
            {sortedEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
