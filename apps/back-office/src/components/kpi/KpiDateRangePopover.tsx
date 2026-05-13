"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

interface KpiDateRangePopoverProps {
  start?: string;
  end?: string;
  isActive: boolean;
  onApply: (start: string, end: string) => void;
}

export default function KpiDateRangePopover({
  start,
  end,
  isActive,
  onApply,
}: KpiDateRangePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(start ?? "");
  const [draftEnd, setDraftEnd] = useState(end ?? "");
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setDraftStart(start ?? "");
      setDraftEnd(end ?? "");
      setError(null);
    }
  }, [isOpen, start, end]);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const handleApply = () => {
    if (!draftStart || !draftEnd) {
      setError("시작일과 종료일을 모두 선택해 주세요.");
      return;
    }
    if (draftStart > draftEnd) {
      setError("시작일은 종료일보다 빠르거나 같아야 합니다.");
      return;
    }
    setError(null);
    onApply(draftStart, draftEnd);
    setIsOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 h-[30px] px-2.5 text-[12px] font-medium rounded-[7px] border cursor-pointer transition-colors ${
          isOpen || isActive
            ? "border-primary bg-neutral-50 text-neutral-900"
            : "border-neutral-200 bg-surface text-neutral-900 hover:border-[#C7C7C5]"
        }`}
      >
        <Calendar className="w-3 h-3" strokeWidth={1.8} />
        직접 선택
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="기간 직접 선택"
          className="absolute top-[calc(100%+6px)] right-0 min-w-[280px] bg-surface border border-neutral-200 rounded-[10px] p-3.5 z-50 flex flex-col gap-2.5"
          style={{
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <span className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-neutral-500 mb-0.5">
            기간 직접 선택
          </span>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-neutral-500" htmlFor="kpi-date-start">
              시작일
            </label>
            <input
              id="kpi-date-start"
              type="date"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className="h-8 px-2.5 text-[12.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-[7px] cursor-pointer transition-colors hover:border-[#C7C7C5] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-neutral-900/[0.06]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-medium text-neutral-500" htmlFor="kpi-date-end">
              종료일
            </label>
            <input
              id="kpi-date-end"
              type="date"
              value={draftEnd}
              onChange={(e) => setDraftEnd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className="h-8 px-2.5 text-[12.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-[7px] cursor-pointer transition-colors hover:border-[#C7C7C5] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-neutral-900/[0.06]"
            />
          </div>
          {error && (
            <div className="text-[11px] text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1.5 rounded-md">
              {error}
            </div>
          )}
          <div className="flex gap-1.5 justify-end pt-1.5 border-t border-neutral-50 mt-0.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-[30px] px-3.5 text-[12px] font-semibold rounded-[7px] cursor-pointer bg-surface text-neutral-500 border border-neutral-200 hover:text-neutral-900 hover:border-[#C7C7C5] transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-[30px] px-3.5 text-[12px] font-semibold rounded-[7px] cursor-pointer bg-primary text-white border border-primary hover:bg-[#2D2D2D] hover:border-[#2D2D2D] transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
