import type { ApprovalStatus, WorkflowStatus } from "@heritage-dx/store";

const LABEL: Record<ApprovalStatus, string> = {
  DRAFT: "작성중",
  PENDING_APPROVAL: "승인대기",
  FIRST_APPROVED: "승인",
  ON_HOLD: "보류",
  REJECTED: "반려",
};

const STYLE: Record<ApprovalStatus, string> = {
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
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]} ${className}`}
    >
      {LABEL[status]}
    </span>
  );
}
