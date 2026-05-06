"use client";

interface SoldPriceBannerProps {
  /** 매도가 (예: "8,500" 또는 "8,500~9,200") */
  dealerPriceRange: string | null | undefined;
  /** "개인 · 정회원" 같은 컨텍스트 라벨 */
  contextLabel: string;
  /** "2026-05-04 기준" 같은 보조 텍스트 */
  asOf?: string | null;
}

export default function SoldPriceBanner({
  dealerPriceRange,
  contextLabel,
  asOf,
}: SoldPriceBannerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-3">
      <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-blue-700">
        매도
      </span>
      <span className="text-[24px] font-bold tabular-nums tracking-[-0.01em] text-blue-700">
        {dealerPriceRange ?? "-"}
      </span>
      <span className="text-[12px] text-[#6a7282]">만원</span>
      <span className="hidden h-4 w-px bg-[#e5e7eb] sm:inline-block" />
      <span className="text-[12px] text-[#4a5565]">{contextLabel} 기준</span>
      {asOf && (
        <span className="ml-auto text-[11px] text-[#99a1af]">{asOf}</span>
      )}
    </div>
  );
}
