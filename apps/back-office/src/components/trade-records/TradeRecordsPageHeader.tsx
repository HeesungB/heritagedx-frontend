"use client";

import { Plus } from "lucide-react";
import { Button } from "@heritage-dx/ui";
import type { TradeRecordCounts } from "@heritage-dx/store";

interface TradeRecordsPageHeaderProps {
  totalCount: number;
  counts: TradeRecordCounts;
  onAdd: () => void;
}

export default function TradeRecordsPageHeader({
  totalCount,
  counts,
  onAdd,
}: TradeRecordsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-neutral-100 bg-surface px-8 py-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-neutral-50 text-neutral-900">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 7h13l-3-3" />
            <path d="M17 17H4l3 3" />
          </svg>
        </div>
        <div>
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Transactions
          </span>
          <h1 className="m-0 text-[22px] font-bold leading-tight tracking-[-0.025em] text-neutral-900">
            거래 내역
          </h1>
        </div>
      </div>

      <div className="hidden items-center gap-3 xl:flex">
        <HeaderStat label="Total" value={totalCount} />
        <HeaderStat label="매수" value={counts.buy} tone="buy" />
        <HeaderStat label="매도" value={counts.sell} tone="sell" />
        <HeaderStat label="진행 중" value={counts.active} />
      </div>

      <Button type="button" onClick={onAdd} className="gap-1.5">
        <Plus className="h-4 w-4" />
        새 거래 등록
      </Button>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "buy" | "sell";
}) {
  const toneClass =
    tone === "buy"
      ? "text-[#2F6FEB]"
      : tone === "sell"
        ? "text-[#DC2626]"
        : "text-neutral-900";

  return (
    <div className="inline-flex items-baseline gap-1.5">
      <span
        className={`text-[18px] font-bold tabular-nums tracking-[-0.02em] ${toneClass}`}
      >
        {value.toLocaleString("ko-KR")}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-neutral-500">
        {label}
      </span>
    </div>
  );
}
