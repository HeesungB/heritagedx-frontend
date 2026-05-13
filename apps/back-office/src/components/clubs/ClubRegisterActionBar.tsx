"use client";

import { Check, Info } from "lucide-react";

interface ClubRegisterActionBarProps {
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ClubRegisterActionBar({
  onCancel,
  isLoading = false,
  submitLabel = "등록",
}: ClubRegisterActionBarProps) {
  return (
    <div className="sticky bottom-0 -mx-7 md:-mx-10 bg-surface border-t border-neutral-200 px-7 md:px-10 py-3.5 flex items-center justify-between gap-3 z-10">
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-400">
        <Info className="w-3 h-3 text-[#C4C4C2]" strokeWidth={1.7} />
        <span>저장하지 않은 변경 사항은 사라집니다</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-surface text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#C4C4C2] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-primary text-white border border-primary hover:bg-[#1F1F1F] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check className="w-3 h-3" strokeWidth={2} />
          <span>{isLoading ? "등록 중..." : submitLabel}</span>
        </button>
      </div>
    </div>
  );
}
