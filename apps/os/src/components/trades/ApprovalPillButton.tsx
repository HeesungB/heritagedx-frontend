"use client";

import { useRef } from "react";
import type { RequestType } from "@heritage-dx/store";

interface ApprovalPillButtonProps {
  progressStatus: string;
  pending?: boolean;
  onRequest: (requestType: RequestType) => void;
}

const COMPLETED_STATES = new Set(["TRADE_COMPLETED", "COMPLETED"]);
const REVIEW_STATES = new Set(["DEPOSIT_REVIEW", "BALANCE_REVIEW", "TAX_REVIEW", "PENDING_DEPOSIT"]);
const REQUESTABLE_STATES = new Set(["IN_CONSULTATION", "DOCUMENT_AND_BALANCE_IN_PROGRESS", "TAX_IN_PROGRESS"]);

export default function ApprovalPillButton({
  progressStatus,
  pending,
  onRequest,
}: ApprovalPillButtonProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  if (COMPLETED_STATES.has(progressStatus)) {
    return (
      <span className="inline-flex h-[26px] items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[11.5px] font-semibold text-emerald-700">
        완료
      </span>
    );
  }

  if (REVIEW_STATES.has(progressStatus)) {
    return (
      <span className="inline-flex h-[26px] items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[11.5px] font-semibold text-amber-700">
        검토중
      </span>
    );
  }

  if (REQUESTABLE_STATES.has(progressStatus)) {
    return (
      <select
        ref={selectRef}
        disabled={pending}
        defaultValue=""
        onChange={(e) => {
          const type = e.target.value as RequestType;
          if (type) {
            onRequest(type);
            if (selectRef.current) selectRef.current.value = "";
          }
        }}
        className="h-[26px] cursor-pointer rounded-full border border-orange-200 bg-orange-50 px-2 text-[11.5px] font-semibold text-orange-700 outline-none transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="" disabled>
          {pending ? "처리 중…" : "승인 요청 ▾"}
        </option>
        <option value="DEPOSIT">계약금 확인 요청</option>
        <option value="BALANCE">잔금 확인 요청</option>
        <option value="TAX">세무 확인 요청</option>
      </select>
    );
  }

  return null;
}
