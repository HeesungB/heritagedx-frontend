"use client";

import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomerDetailHeaderProps {
  backHref: string;
  positionLabel: string | null;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function CustomerDetailCrumbRow({
  backHref,
  positionLabel,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: CustomerDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 px-3 py-[7px] rounded-lg bg-surface border border-neutral-200 text-neutral-600 text-[12.5px] font-medium tracking-[-0.005em] transition-colors hover:text-neutral-900 hover:border-[#D4D4D2]"
      >
        <ArrowLeft className="w-[13px] h-[13px]" strokeWidth={1.7} />
        고객 관리 목록으로
      </Link>
      {positionLabel && (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="이전 고객"
            className="w-7 h-7 rounded-md bg-surface border border-neutral-200 text-neutral-600 inline-flex items-center justify-center cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-600 disabled:hover:border-neutral-200"
          >
            <ChevronLeft className="w-[13px] h-[13px]" strokeWidth={1.8} />
          </button>
          <span className="text-[11.5px] text-neutral-500 font-mono tracking-[0.02em] px-1.5">
            {positionLabel}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="다음 고객"
            className="w-7 h-7 rounded-md bg-surface border border-neutral-200 text-neutral-600 inline-flex items-center justify-center cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-600 disabled:hover:border-neutral-200"
          >
            <ChevronRight className="w-[13px] h-[13px]" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}

