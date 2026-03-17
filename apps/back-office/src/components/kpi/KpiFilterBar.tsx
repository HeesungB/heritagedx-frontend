"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { Employee } from "@/types";

export type PeriodPreset =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "3months"
  | "6months"
  | "thisYear"
  | "lastYear"
  | "1year"
  | "custom";

export type DateField = "contractDate" | "createdAt";

export interface KpiFilters {
  preset: PeriodPreset;
  dateField: DateField;
  employeeId: string; // "" = 전체
  customStart?: string; // YYYY-MM-DD (preset === "custom"일 때)
  customEnd?: string;
}

interface KpiFilterBarProps {
  filters: KpiFilters;
  employees: Employee[];
  onChange: (filters: KpiFilters) => void;
}

const PRESET_GROUPS: { key: PeriodPreset; label: string; group: "short" | "mid" | "long" }[] = [
  { key: "thisWeek", label: "이번 주", group: "short" },
  { key: "lastWeek", label: "지난 주", group: "short" },
  { key: "thisMonth", label: "이번 달", group: "short" },
  { key: "lastMonth", label: "지난 달", group: "short" },
  { key: "3months", label: "3개월", group: "mid" },
  { key: "6months", label: "6개월", group: "mid" },
  { key: "1year", label: "1년", group: "mid" },
  { key: "thisYear", label: "올해", group: "long" },
  { key: "lastYear", label: "작년", group: "long" },
];

export function getDateRange(preset: PeriodPreset, customStart?: string, customEnd?: string): {
  startDate: string;
  endDate: string;
  months: number;
} {
  if (preset === "custom" && customStart && customEnd) {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    const months = Math.max(
      1,
      (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1,
    );
    return { startDate: customStart, endDate: customEnd, months };
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const d = now.getDay(); // 0=Sun

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
  const firstOfMonth = (year: number, month: number) =>
    new Date(year, month, 1);
  const lastOfMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0);

  switch (preset) {
    case "thisWeek": {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((d + 6) % 7)); // 이번 주 월요일
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), months: 1 };
    }
    case "lastWeek": {
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((d + 6) % 7) - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { startDate: fmt(mon), endDate: fmt(sun), months: 1 };
    }
    case "thisMonth":
      return {
        startDate: fmt(firstOfMonth(y, m)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 1,
      };
    case "lastMonth":
      return {
        startDate: fmt(firstOfMonth(y, m - 1)),
        endDate: fmt(lastOfMonth(y, m - 1)),
        months: 1,
      };
    case "3months":
      return {
        startDate: fmt(firstOfMonth(y, m - 2)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 3,
      };
    case "6months":
      return {
        startDate: fmt(firstOfMonth(y, m - 5)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 6,
      };
    case "1year":
      return {
        startDate: fmt(firstOfMonth(y, m - 11)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 12,
      };
    case "thisYear":
      return {
        startDate: fmt(firstOfMonth(y, 0)),
        endDate: fmt(lastOfMonth(y, m)),
        months: m + 1,
      };
    case "lastYear":
      return {
        startDate: fmt(firstOfMonth(y - 1, 0)),
        endDate: fmt(lastOfMonth(y - 1, 11)),
        months: 12,
      };
    case "custom":
      // fallback — customStart/customEnd 없는 경우
      return {
        startDate: fmt(firstOfMonth(y, m)),
        endDate: fmt(lastOfMonth(y, m)),
        months: 1,
      };
  }
}

export function getMonthBuckets(
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string; label: string }[] {
  const buckets: { startDate: string; endDate: string; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const cy = cursor.getFullYear();
    const cm = cursor.getMonth();
    const first = new Date(cy, cm, 1);
    const last = new Date(cy, cm + 1, 0);
    buckets.push({
      startDate: first.toISOString().slice(0, 10),
      endDate: last.toISOString().slice(0, 10),
      label: `${cy}-${String(cm + 1).padStart(2, "0")}`,
    });
    cursor = new Date(cy, cm + 1, 1);
  }
  return buckets;
}

export function getDailyBuckets(
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string; label: string }[] {
  const buckets: { startDate: string; endDate: string; label: string }[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    buckets.push({
      startDate: iso,
      endDate: iso,
      label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

const WEEK_ORDINALS = ["첫째주", "둘째주", "셋째주", "넷째주", "다섯째주"];

export function getWeeklyBuckets(
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string; label: string }[] {
  const buckets: { startDate: string; endDate: string; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  let cursor = new Date(start);
  const monthWeekCount: Record<string, number> = {};

  while (cursor <= end) {
    const day = cursor.getDay(); // 0=Sun
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const weekEnd = new Date(cursor);
    weekEnd.setDate(cursor.getDate() + daysUntilSunday);

    const clampedEnd = weekEnd > end ? end : weekEnd;

    // 해당 주의 월요일 → 수요일을 구해서 그 월에 귀속
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(cursor);
    monday.setDate(cursor.getDate() + mondayOffset);
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);

    const ownerMonth = wednesday.getMonth();
    const ownerYear = wednesday.getFullYear();
    const monthKey = `${ownerYear}-${ownerMonth}`;

    const weekIndex = monthWeekCount[monthKey] ?? 0;
    monthWeekCount[monthKey] = weekIndex + 1;

    const label = `${ownerMonth + 1}월 ${WEEK_ORDINALS[weekIndex] ?? `${weekIndex + 1}째주`}`;

    buckets.push({
      startDate: fmt(cursor),
      endDate: fmt(clampedEnd),
      label,
    });

    cursor = new Date(clampedEnd);
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

export function getTimeBuckets(
  preset: PeriodPreset,
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string; label: string }[] {
  switch (preset) {
    case "thisWeek":
    case "lastWeek":
      return getDailyBuckets(startDate, endDate);
    case "thisMonth":
    case "lastMonth":
      return getWeeklyBuckets(startDate, endDate);
    case "3months":
    case "6months":
    case "1year":
    case "thisYear":
    case "lastYear":
      return getMonthBuckets(startDate, endDate);
    case "custom": {
      const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 14) return getDailyBuckets(startDate, endDate);
      if (diffDays <= 62) return getWeeklyBuckets(startDate, endDate);
      return getMonthBuckets(startDate, endDate);
    }
  }
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

        {/* Date field */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">날짜 기준</label>
          <select
            value={filters.dateField}
            onChange={(e) =>
              onChange({ ...filters, dateField: e.target.value as DateField })
            }
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          >
            <option value="contractDate">계약일</option>
            <option value="createdAt">등록일</option>
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
