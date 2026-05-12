// 거래 workflowStatus / 상담 approvalStatus 를 동일 4구간으로 분류.
// `packages/types/src/approval.ts` 의 APPROVAL_STATUS enum 과 deprecated 값까지 커버한다.

export type TradeStatusKey = "done" | "active" | "pending" | "canceled";

export function classifyTradeStatus(status: string): TradeStatusKey {
  if (status === "COMPLETED" || status === "TAX_FILING") return "done";
  if (status === "DEPOSIT_APPROVED" || status === "FIRST_APPROVED")
    return "active";
  if (
    status === "PENDING_DEPOSIT" ||
    status === "PENDING_APPROVAL" ||
    status === "IN_CONSULTATION" ||
    status === "DRAFT"
  )
    return "pending";
  return "canceled";
}

export const TRADE_STATUS_LABEL: Record<TradeStatusKey, string> = {
  done: "완료",
  active: "진행",
  pending: "대기",
  canceled: "취소",
};

export const TRADE_STATUS_COLOR: Record<TradeStatusKey, string> = {
  done: "#7BD4A5",
  active: "#7AABE8",
  pending: "#FFC15E",
  canceled: "#B5B5B5",
};
