// 상담·거래 워크플로우 상수·타입
// 상담 approvalStatus 와 거래 workflowStatus 는 분리된 enum 이며, Consultation 응답의
// progressStatus 는 두 단계를 합친 통합 진행 상태이다.

export const APPROVAL_STATUS = {
  // 2026-04 백엔드 신규 명세
  IN_CONSULTATION: "IN_CONSULTATION",     // 상담중 (디폴트)
  PENDING_DEPOSIT: "PENDING_DEPOSIT",     // 승인 요청됨, 계약금 입/송금 대기
  DEPOSIT_APPROVED: "DEPOSIT_APPROVED",   // 계약금 승인 완료, 거래내역 이관됨
  /** @deprecated PENDING_DEPOSIT 으로 대체됨. 과거 데이터/명세 호환용. */
  PENDING_APPROVAL: "PENDING_APPROVAL",
  /** @deprecated DEPOSIT_APPROVED 으로 대체됨. 과거 데이터/명세 호환용. */
  FIRST_APPROVED: "FIRST_APPROVED",
  /** @deprecated IN_CONSULTATION 으로 대체됨. 과거 데이터/명세 호환용. */
  DRAFT: "DRAFT",
  /** @deprecated 신규 워크플로우에서 도달 불가. 과거 데이터 호환용. */
  ON_HOLD: "ON_HOLD",
  /** @deprecated 신규 워크플로우에서 도달 불가. 과거 데이터 호환용. */
  REJECTED: "REJECTED",
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

// 거래(MembershipTrade) workflowStatus enum (스웨거 v1.0.0+57563d32 확정).
export const TRADE_WORKFLOW_STATUS = {
  DOCUMENT_AND_BALANCE: "DOCUMENT_AND_BALANCE",
  TAX_FILING: "TAX_FILING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;

export type TradeWorkflowStatus =
  (typeof TRADE_WORKFLOW_STATUS)[keyof typeof TRADE_WORKFLOW_STATUS];

// 상담↔거래 통합 진행 상태 (Consultation.progressStatus). 백엔드가 두 단계의 상태를
// 하나의 enum 으로 평탄화해 내려준다. REJECTED 단계는 거래쪽에만 존재해 여기엔 포함 안 됨.
export const PROGRESS_STATUS = {
  IN_CONSULTATION: "IN_CONSULTATION",
  DEPOSIT_REVIEW: "DEPOSIT_REVIEW",
  DOCUMENT_AND_BALANCE_IN_PROGRESS: "DOCUMENT_AND_BALANCE_IN_PROGRESS",
  BALANCE_REVIEW: "BALANCE_REVIEW",
  TAX_IN_PROGRESS: "TAX_IN_PROGRESS",
  TAX_REVIEW: "TAX_REVIEW",
  TRADE_COMPLETED: "TRADE_COMPLETED",
  /** @deprecated DEPOSIT_REVIEW 로 대체됨. 과거 데이터 호환용. */
  PENDING_DEPOSIT: "PENDING_DEPOSIT",
  /** @deprecated DOCUMENT_AND_BALANCE_IN_PROGRESS 로 대체됨. 과거 데이터 호환용. */
  DOCUMENT_AND_BALANCE: "DOCUMENT_AND_BALANCE",
  /** @deprecated TAX_IN_PROGRESS 로 대체됨. 과거 데이터 호환용. */
  TAX_FILING: "TAX_FILING",
  /** @deprecated TRADE_COMPLETED 로 대체됨. 과거 데이터 호환용. */
  COMPLETED: "COMPLETED",
} as const;

export type ProgressStatus = (typeof PROGRESS_STATUS)[keyof typeof PROGRESS_STATUS];

// 에디터가 REQUEST_APPROVAL 액션에 명시적으로 지정하는 요청 유형.
// 생략 시 서버가 현재 progressStatus 기준으로 자동 선택한다.
export const REQUEST_TYPES = {
  DEPOSIT: "DEPOSIT",
  BALANCE: "BALANCE",
  TAX: "TAX",
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

/** @deprecated TradeWorkflowStatus 로 대체. 다음 PR 에서 제거 예정. */
export type WorkflowStatus = TradeWorkflowStatus;

export const APPROVAL_ACTIONS = {
  REQUEST_APPROVAL: "REQUEST_APPROVAL",
  APPROVE_FIRST: "APPROVE_FIRST",
  REOPEN: "REOPEN",
  REJECT: "REJECT",
  ADVANCE_TO_TAX_FILING: "ADVANCE_TO_TAX_FILING",
  ADVANCE_TO_COMPLETED: "ADVANCE_TO_COMPLETED",
  // 2026-05 백엔드 신규 admin 액션
  CONFIRM_DEPOSIT: "CONFIRM_DEPOSIT",
  CONFIRM_DOCUMENT_AND_BALANCE: "CONFIRM_DOCUMENT_AND_BALANCE",
  COMPLETE_TAX_FILING: "COMPLETE_TAX_FILING",
  REQUEST_REREVIEW: "REQUEST_REREVIEW",
  /** @deprecated 신규 워크플로우에서 미사용. */
  HOLD: "HOLD",
} as const;

export type ApprovalAction = (typeof APPROVAL_ACTIONS)[keyof typeof APPROVAL_ACTIONS];

// 역할/엔드포인트별 허용 액션 (UI 버튼 노출 + 서버 검증과 일치)
export type UserConsultationAction = typeof APPROVAL_ACTIONS.REQUEST_APPROVAL;
export type AdminConsultationAction =
  | typeof APPROVAL_ACTIONS.CONFIRM_DEPOSIT
  | typeof APPROVAL_ACTIONS.CONFIRM_DOCUMENT_AND_BALANCE
  | typeof APPROVAL_ACTIONS.COMPLETE_TAX_FILING
  | typeof APPROVAL_ACTIONS.REQUEST_REREVIEW
  | typeof APPROVAL_ACTIONS.REOPEN
  | typeof APPROVAL_ACTIONS.APPROVE_FIRST;
export type AdminTradeAction =
  | typeof APPROVAL_ACTIONS.ADVANCE_TO_TAX_FILING
  | typeof APPROVAL_ACTIONS.ADVANCE_TO_COMPLETED
  | typeof APPROVAL_ACTIONS.REJECT;

// 호환용: 과거에 사용되던 광역 alias. 신규 코드는 위의 좁은 union을 쓸 것.
export type UserApprovalAction = UserConsultationAction;

export interface ApprovalActionInput<A extends ApprovalAction = ApprovalAction> {
  action: A;
  reason?: string;
  requestType?: RequestType;
}
