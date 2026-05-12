"use client";

import { formatManwon, wonToManwon } from "@heritage-dx/utils";

interface ProfitBreakdownProps {
  profitThisMonthWon: number;
  commissionWon?: number | null;
  ytdProfitWon: number;
}

function fmt(won: number): string {
  return formatManwon(wonToManwon(won));
}

export default function ProfitBreakdown({
  profitThisMonthWon,
  commissionWon,
  ytdProfitWon,
}: ProfitBreakdownProps) {
  return (
    <div className="flex flex-col gap-2.5 mt-1">
      <div className="flex justify-between text-[12.5px]">
        <span className="text-neutral-600">거래 수익</span>
        <span className="font-semibold text-neutral-900 font-sans">
          {fmt(profitThisMonthWon)}
        </span>
      </div>
      <div className="flex justify-between text-[12.5px]">
        <span className="text-neutral-600">수수료 차감</span>
        <span className="font-semibold text-neutral-500 font-sans">
          {commissionWon ? fmt(commissionWon) : "—"}
        </span>
      </div>
      <div className="flex justify-between text-[12.5px] pt-2.5 border-t border-neutral-50">
        <span className="text-neutral-900 font-medium">12개월 누적</span>
        <span className="font-bold text-neutral-900 font-sans">
          {fmt(ytdProfitWon)}
        </span>
      </div>
    </div>
  );
}
