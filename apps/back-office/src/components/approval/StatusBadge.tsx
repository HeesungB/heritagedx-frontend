import type { ApprovalStatus, WorkflowStatus } from "@heritage-dx/store";

// 거래 워크플로우는 단계 전환 상태(TAX_FILING/COMPLETED)가 추가됐다.
// 정확한 enum 이름은 백엔드 신규 스펙(Phase B)에서 확정 후 정렬한다.
const LABEL: Record<string, string> = {
  IN_CONSULTATION: "상담중",
  PENDING_DEPOSIT: "승인 대기",
  DEPOSIT_APPROVED: "계약 완료",
  DOCUMENT_AND_BALANCE: "잔금/문서 진행",
  TAX_FILING: "세무신고",
  COMPLETED: "완료",
  // deprecated: 과거 데이터 호환
  DRAFT: "상담중",
  PENDING_APPROVAL: "승인 대기",
  FIRST_APPROVED: "계약 완료",
  ON_HOLD: "보류",
  REJECTED: "반려",
};

const STYLE: Record<string, string> = {
  IN_CONSULTATION: "bg-gray-100 text-gray-700",
  PENDING_DEPOSIT: "bg-amber-100 text-amber-800",
  DEPOSIT_APPROVED: "bg-emerald-100 text-emerald-800",
  DOCUMENT_AND_BALANCE: "bg-neutral-100 text-neutral-700",
  TAX_FILING: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-200 text-emerald-900",
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  FIRST_APPROVED: "bg-emerald-100 text-emerald-800",
  ON_HOLD: "bg-orange-100 text-orange-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

interface Props {
  status: ApprovalStatus | WorkflowStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: Props) {
  const style = STYLE[status] ?? "bg-gray-100 text-gray-600";
  const label = LABEL[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
