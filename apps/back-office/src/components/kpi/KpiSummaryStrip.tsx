"use client";

import type { ReactNode } from "react";
import { FileText, MessageSquare, TrendingUp } from "lucide-react";

interface KpiSummaryStripProps {
  tradeCount: number;
  consultationCount: number;
  profitText: string;
  isLoading?: boolean;
}

export default function KpiSummaryStrip({
  tradeCount,
  consultationCount,
  profitText,
  isLoading = false,
}: KpiSummaryStripProps) {
  return (
    <div className="grid grid-cols-3 bg-surface border border-[#F0F0EE] rounded-[11px] overflow-hidden">
      <Cell
        variant="tx"
        icon={<FileText className="w-[17px] h-[17px]" strokeWidth={1.7} />}
        label="거래 건수"
        value={isLoading ? null : `${tradeCount}건`}
      />
      <Cell
        variant="profit"
        icon={<TrendingUp className="w-[17px] h-[17px]" strokeWidth={1.8} />}
        label="총 순이익"
        value={isLoading ? null : profitText}
      />
      <Cell
        variant="chat"
        icon={<MessageSquare className="w-[17px] h-[17px]" strokeWidth={1.7} />}
        label="상담 건수"
        value={isLoading ? null : `${consultationCount}건`}
      />
    </div>
  );
}

const VARIANT_STYLES: Record<
  "tx" | "profit" | "chat",
  { bg: string; border: string; text: string }
> = {
  tx: { bg: "bg-[#FEFCE8]", border: "border-[#FEF08A]", text: "text-[#CA8A04]" },
  profit: { bg: "bg-[#FEFCE8]", border: "border-[#FEF08A]", text: "text-[#854D0E]" },
  chat: { bg: "bg-[#FEFCE8]", border: "border-[#FEF08A]", text: "text-[#EAB308]" },
};

function Cell({
  variant,
  icon,
  label,
  value,
}: {
  variant: "tx" | "profit" | "chat";
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  const v = VARIANT_STYLES[variant];
  return (
    <div className="px-4 py-2.5 flex items-center gap-3 border-r border-[#F0F0EE] last:border-r-0">
      <div
        className={`w-8 h-8 rounded-[9px] border ${v.bg} ${v.border} ${v.text} grid place-items-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-px min-w-0">
        <span className="text-[11.5px] font-medium text-neutral-500 tracking-[-0.005em]">
          {label}
        </span>
        {value === null ? (
          <span className="h-[20px] w-20 bg-neutral-100 rounded animate-pulse mt-0.5" />
        ) : (
          <span className="text-[17px] font-bold text-neutral-900 tracking-[-0.03em] leading-[1.15] tabular-nums">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
