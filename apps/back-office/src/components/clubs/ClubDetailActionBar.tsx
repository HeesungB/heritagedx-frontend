"use client";

import Link from "next/link";
import { Check, Info, Loader2 } from "lucide-react";

interface ClubDetailActionBarProps {
  note?: string;
  isSaving?: boolean;
  isDirty?: boolean;
  onSave: () => void;
  backHref?: string;
}

export default function ClubDetailActionBar({
  note,
  isSaving = false,
  isDirty = true,
  onSave,
  backHref = "/clubs",
}: ClubDetailActionBarProps) {
  return (
    <div className="sticky bottom-0 -mx-7 md:-mx-10 bg-surface border-t border-neutral-200 px-7 md:px-10 py-3.5 flex items-center justify-between gap-3 z-10">
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-400">
        <Info className="w-3 h-3 text-[#C4C4C2]" strokeWidth={1.7} />
        <span>{note ?? "저장하지 않은 변경 사항은 사라집니다"}</span>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-surface text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#C4C4C2]"
        >
          목록으로
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-[18px] text-[13px] font-semibold rounded-lg cursor-pointer transition-colors bg-primary text-white border border-primary hover:bg-[#1F1F1F] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          <span>{isSaving ? "저장 중..." : "저장"}</span>
        </button>
      </div>
    </div>
  );
}
