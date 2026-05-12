"use client";

import type { ChangeEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface OwnerOption {
  id: string;
  name: string;
}

interface CustomerListPanelProps {
  countLabel: string | number;
  metaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  ownerFilter: string;
  ownerOptions: OwnerOption[];
  onOwnerFilterChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}

export default function CustomerListPanel({
  countLabel,
  metaLabel,
  searchValue,
  onSearchChange,
  ownerFilter,
  ownerOptions,
  onOwnerFilterChange,
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  onPrev,
  onNext,
  children,
}: CustomerListPanelProps) {
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) =>
    onSearchChange(e.target.value);
  const handleOwner = (e: ChangeEvent<HTMLSelectElement>) =>
    onOwnerFilterChange(e.target.value);

  return (
    <div className="border border-neutral-100 rounded-card bg-surface overflow-hidden">
      <div className="px-6 pt-[18px] pb-[14px] border-b border-neutral-100 flex items-baseline justify-between gap-4">
        <h2 className="text-[13.5px] font-semibold text-neutral-900 tracking-[-0.01em] m-0 inline-flex items-baseline gap-2.5">
          고객 목록
          <span className="text-[11px] font-semibold px-[7px] py-0.5 rounded bg-neutral-50 text-neutral-600 border border-neutral-200 font-mono">
            {countLabel}
          </span>
        </h2>
        {metaLabel && (
          <span className="text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
            {metaLabel}
          </span>
        )}
      </div>

      <div className="px-6 py-4 border-b border-neutral-100 bg-[#FAFAF9]">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3 items-center">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
              strokeWidth={1.7}
            />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder="고객명, 연락처, 메모 검색…"
              className="w-full h-[38px] pl-9 pr-3 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none tracking-[-0.005em] transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06]"
            />
          </div>
          <select
            value={ownerFilter}
            onChange={handleOwner}
            className="h-[38px] w-full pl-3.5 pr-9 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none tracking-[-0.005em] appearance-none cursor-pointer transition-colors focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/[0.06]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">전체 담당자</option>
            {ownerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {children}

      <div className="px-6 py-3.5 border-t border-neutral-100 bg-[#FAFAF9] relative flex items-center justify-center">
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
          {total > 0
            ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
            : "Showing 0 of 0"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            aria-label="이전"
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md border border-neutral-200 bg-surface text-neutral-600 text-[12px] font-medium tracking-[-0.005em] cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-600 disabled:hover:border-neutral-200"
          >
            <ChevronLeft className="w-3 h-3" strokeWidth={1.8} />
            <span>이전</span>
          </button>
          <span className="text-[12px] text-neutral-600 font-mono tracking-[0.02em] px-2.5">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            aria-label="다음"
            className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-md border border-neutral-200 bg-surface text-neutral-600 text-[12px] font-medium tracking-[-0.005em] cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-600 disabled:hover:border-neutral-200"
          >
            <span>다음</span>
            <ChevronRight className="w-3 h-3" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
