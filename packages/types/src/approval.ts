// 상담·거래 워크플로우 상수·타입
// 상담은 ApprovalStatus(DRAFT/PENDING_APPROVAL/FIRST_APPROVED), 거래는 추가로 단계 전환 상태를 갖는다.
// ON_HOLD/REJECTED는 더 이상 도달 불가하지만 과거 데이터 호환을 위해 enum에 남겨둔다.

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

// 거래 워크플로우 상태는 상담 + 단계 전환 상태(예: TAX_FILING/COMPLETED)를 포함한다.
// 백엔드 스펙 확정 전이라 일단 string으로 열어두고 비교는 string literal로 한다.
export type WorkflowStatus = ApprovalStatus | (string & {});

export const APPROVAL_ACTIONS = {
  REQUEST_APPROVAL: "REQUEST_APPROVAL",
  APPROVE_FIRST: "APPROVE_FIRST",
  REOPEN: "REOPEN",
  REJECT: "REJECT",
  ADVANCE_TO_TAX_FILING: "ADVANCE_TO_TAX_FILING",
  ADVANCE_TO_COMPLETED: "ADVANCE_TO_COMPLETED",
  /** @deprecated 신규 워크플로우에서 미사용. */
  HOLD: "HOLD",
} as const;

export type ApprovalAction = (typeof APPROVAL_ACTIONS)[keyof typeof APPROVAL_ACTIONS];

// 역할/엔드포인트별 허용 액션 (UI 버튼 노출 + 서버 검증과 일치)
export type UserConsultationAction = typeof APPROVAL_ACTIONS.REQUEST_APPROVAL;
export type AdminConsultationAction =
  | typeof APPROVAL_ACTIONS.APPROVE_FIRST
  | typeof APPROVAL_ACTIONS.REOPEN;
export type AdminTradeAction =
  | typeof APPROVAL_ACTIONS.ADVANCE_TO_TAX_FILING
  | typeof APPROVAL_ACTIONS.ADVANCE_TO_COMPLETED
  | typeof APPROVAL_ACTIONS.REJECT;

// 호환용: 과거에 사용되던 광역 alias. 신규 코드는 위의 좁은 union을 쓸 것.
export type UserApprovalAction = UserConsultationAction;

export interface ApprovalActionInput<A extends ApprovalAction = ApprovalAction> {
  action: A;
  reason?: string;
}
