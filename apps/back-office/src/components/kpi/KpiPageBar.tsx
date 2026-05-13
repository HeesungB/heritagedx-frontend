"use client";

import { BarChart3 } from "lucide-react";
import type { EmployeeEntity, KpiFilters } from "@heritage-dx/store";

import KpiDateRangePopover from "./KpiDateRangePopover";

interface KpiPageBarProps {
  filters: KpiFilters;
  employees: EmployeeEntity[];
  rangeText: string;
  onApplyCustomRange: (start: string, end: string) => void;
  onDateFieldChange: (value: KpiFilters["dateField"]) => void;
  onEmployeeChange: (employeeId: string) => void;
}

export default function KpiPageBar({
  filters,
  employees,
  rangeText,
  onApplyCustomRange,
  onDateFieldChange,
  onEmployeeChange,
}: KpiPageBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 h-[54px] bg-surface border-b border-[#F0F0EE]">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary text-white grid place-items-center flex-shrink-0">
          <BarChart3 className="w-[15px] h-[15px]" strokeWidth={1.7} />
        </div>
        <h1 className="text-[17px] font-bold tracking-[-0.025em] text-neutral-900 m-0">
          통계
        </h1>
        <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
          <span className="text-[11.5px] text-neutral-500 font-mono tracking-[0.02em]">
            {rangeText}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <KpiDateRangePopover
          start={filters.customStart}
          end={filters.customEnd}
          isActive={filters.preset === "custom"}
          onApply={onApplyCustomRange}
        />
        <select
          value={filters.dateField}
          onChange={(e) => onDateFieldChange(e.target.value as KpiFilters["dateField"])}
          className="appearance-none h-[30px] pl-2.5 pr-7 text-[12px] font-medium text-neutral-900 bg-surface border border-neutral-200 rounded-[7px] cursor-pointer tracking-[-0.005em] hover:border-[#C7C7C5] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-neutral-900/[0.06] bg-no-repeat"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="contractDate">등록일</option>
          <option value="createdAt">생성일</option>
        </select>
        <select
          value={filters.employeeId}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className="appearance-none h-[30px] pl-2.5 pr-7 text-[12px] font-medium text-neutral-900 bg-surface border border-neutral-200 rounded-[7px] cursor-pointer tracking-[-0.005em] min-w-[130px] hover:border-[#C7C7C5] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-neutral-900/[0.06] bg-no-repeat"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="">전체 직원</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
