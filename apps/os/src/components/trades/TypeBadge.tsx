"use client";

interface TypeBadgeProps {
  tradeType: string | null | undefined;
  isUndecided?: boolean;
  isCompleted?: boolean;
}

const PALETTE = {
  매수: "bg-[#E6EFFB] text-[#1E429F] border-[#C7D9F4]",
  매도: "bg-[#FCE7E7] text-[#B23232] border-[#F4CDCD]",
  미정: "bg-gray-100 text-gray-500 border-gray-200",
} as const;

export default function TypeBadge({ tradeType, isUndecided, isCompleted }: TypeBadgeProps) {
  const key: keyof typeof PALETTE = isUndecided
    ? "미정"
    : tradeType === "매수" || tradeType === "매도"
    ? tradeType
    : "미정";
  const label = isUndecided ? "미정" : tradeType || "미정";
  const palette = isCompleted ? "bg-gray-100 text-gray-400 border-gray-200" : PALETTE[key];
  return (
    <span
      className={`inline-flex h-[22px] min-w-[40px] items-center justify-center rounded border px-2 text-[11.5px] font-bold tracking-tight ${palette}`}
    >
      {label}
    </span>
  );
}
