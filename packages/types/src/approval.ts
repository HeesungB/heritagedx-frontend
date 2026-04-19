// 상담·거래 공통 승인 워크플로우 상수·타입
// 백엔드에서 상담(approvalStatus)과 거래(workflowStatus)의 값 체계를 동일하게 통일

export const APPROVAL_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  FIRST_APPROVED: "FIRST_APPROVED",
  ON_HOLD: "ON_HOLD",
  REJECTED: "REJECTED",
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];
export type WorkflowStatus = ApprovalStatus;

export const APPROVAL_ACTIONS = {
  REQUEST_APPROVAL: "REQUEST_APPROVAL",
  APPROVE_FIRST: "APPROVE_FIRST",
  HOLD: "HOLD",
  REJECT: "REJECT",
  REOPEN: "REOPEN",
} as const;

export type ApprovalAction = (typeof APPROVAL_ACTIONS)[keyof typeof APPROVAL_ACTIONS];

// 역할별 허용 액션 — UI에서 버튼 노출 제어용 (서버도 권한 검사)
export type UserApprovalAction = typeof APPROVAL_ACTIONS.REQUEST_APPROVAL;
export type AdminApprovalAction = ApprovalAction;

export interface ApprovalActionInput {
  action: ApprovalAction;
  reason?: string;
}
