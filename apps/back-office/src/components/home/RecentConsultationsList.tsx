"use client";

import type { ConsultationEntity } from "@heritage-dx/store";

interface RecentConsultationsListProps {
  items: ConsultationEntity[];
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function consultationTitle(c: ConsultationEntity): string {
  if (c.remarks && c.remarks.trim()) return c.remarks.trim();
  const type = c.tradeType ? `${c.tradeType} 상담` : "상담";
  const club = c.clubName ? ` · ${c.clubName}` : "";
  return `${type}${club}`;
}

function consultationMeta(c: ConsultationEntity): string {
  const name = c.customerName ?? "";
  const club = c.clubName ?? "";
  return [name, club].filter(Boolean).join(" · ");
}

export default function RecentConsultationsList({
  items,
}: RecentConsultationsListProps) {
  if (items.length === 0) {
    return <p className="text-xs text-neutral-400 py-2">최근 상담이 없습니다.</p>;
  }

  return (
    <div>
      {items.map((c, idx) => (
        <div
          key={c.id}
          className={`grid grid-cols-[46px_1fr_auto] items-baseline gap-2.5 py-[7px] ${
            idx === 0 ? "" : "border-t border-neutral-50"
          }`}
        >
          <span className="text-[11.5px] text-neutral-400 font-mono font-medium">
            {shortDate(c.registrationDate ?? c.createdAt)}
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-neutral-900 overflow-hidden text-ellipsis whitespace-nowrap">
              {consultationTitle(c)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {consultationMeta(c)}
            </div>
          </div>
          {c.isDone ? (
            <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-success-light text-success border border-success/20">
              완료
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-warning-light text-warning border border-warning/20">
              진행중
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
