"use client";

import type { ApprovalStatus } from "@heritage-dx/store";

interface ApprovalPillButtonProps {
  status: ApprovalStatus | string;
  pending?: boolean;
  onRequest?: () => void;
}

interface Variant {
  label: string;
  cls: string;
  /** clickable = triggers REQUEST_APPROVAL */
  clickable: boolean;
}

function resolveVariant(status: ApprovalStatus | string): Variant {
  switch (status) {
    case "IN_CONSULTATION":
    case "DRAFT":
      return {
        label: "승인 요청",
        cls: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
        clickable: true,
      };
    case "PENDING_DEPOSIT":
    case "PENDING_APPROVAL":
      return {
        label: "요청됨",
        cls: "bg-amber-50 text-amber-700 border-amber-200 cursor-default",
        clickable: false,
      };
    case "DEPOSIT_APPROVED":
    case "FIRST_APPROVED":
      return {
        label: "승인 완료",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default",
        clickable: false,
      };
    case "ON_HOLD":
      return {
        label: "보류",
        cls: "bg-gray-50 text-gray-600 border-gray-200 cursor-default",
        clickable: false,
      };
    case "REJECTED":
      return {
        label: "반려",
        cls: "bg-red-50 text-red-700 border-red-200 cursor-default",
        clickable: false,
      };
    default:
      return {
        label: "승인 요청",
        cls: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
        clickable: true,
      };
  }
}

export default function ApprovalPillButton({ status, pending, onRequest }: ApprovalPillButtonProps) {
  const variant = resolveVariant(status);
  const disabled = pending || !variant.clickable;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (variant.clickable && !pending) onRequest?.();
      }}
      className={`inline-flex h-[26px] items-center rounded-full border px-3 text-[11.5px] font-semibold transition-colors disabled:opacity-80 ${variant.cls}`}
    >
      {pending ? "처리 중…" : variant.label}
    </button>
  );
}
