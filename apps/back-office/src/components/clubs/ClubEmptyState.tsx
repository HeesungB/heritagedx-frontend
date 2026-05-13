"use client";

import type { ReactNode } from "react";
import { Building2, Search } from "lucide-react";

interface ClubEmptyStateProps {
  mode: "loading" | "no-results" | "no-clubs";
  action?: ReactNode;
}

export default function ClubEmptyState({ mode, action }: ClubEmptyStateProps) {
  if (mode === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
        <p className="mt-4 text-[12.5px] text-neutral-500">골프장을 불러오는 중...</p>
      </div>
    );
  }
  if (mode === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-500 mx-[18px] border border-dashed border-neutral-200 rounded-card bg-[#FAFAF9]">
        <Search className="w-10 h-10 mb-3 text-neutral-300" strokeWidth={1.5} />
        <p className="text-[12.5px]">검색 결과가 없습니다</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-500 mx-[18px] border border-dashed border-neutral-200 rounded-card bg-[#FAFAF9]">
      <Building2 className="w-10 h-10 mb-3 text-neutral-300" strokeWidth={1.5} />
      <p className="text-[12.5px]">등록된 골프장이 없습니다</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
