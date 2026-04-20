import type { ApprovalStatus } from "@heritage-dx/types";

export interface ConsultationEntity {
  id: string;
  customerId: string | null;
  clubId: string | null;
  clubName: string;
  membershipId: string | null;
  membershipType: string;
  tradeType: "매수" | "매도";
  customerName: string;
  contact: string;
  offerPrice: number | null;
  offerPriceNote: string | null;
  desiredPrice: number | null;
  desiredPriceNote: string | null;
  depositAmount: number | null;
  customFields: Record<string, unknown>;
  notes: string | null;
  registrationDate: string | null;
  tradeDate: string | null;
  remarks: string | null;
  isDone: boolean;
  isShared: boolean;
  approvalStatus: ApprovalStatus;
  approvalRequestedAt: string | null;
  firstApprovedAt: string | null;
  holdReason: string | null;
  rejectionReason: string | null;
  linkedTradeId: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationApprovalStructuralField =
  | "tradeType"
  | "clubId"
  | "membershipId";

export type ConsultationApprovalFillableField =
  | "customerName"
  | "contact"
  | "offerPrice"
  | "depositAmount";

export interface ConsultationApprovalMissingFields {
  structural: ConsultationApprovalStructuralField[];
  fillable: ConsultationApprovalFillableField[];
}

type ApprovalCandidate = Pick<
  ConsultationEntity,
  | "tradeType"
  | "clubId"
  | "membershipId"
  | "customerName"
  | "contact"
  | "offerPrice"
  | "depositAmount"
>;

export function collectMissingConsultationApprovalFields(
  entity: ApprovalCandidate,
): ConsultationApprovalMissingFields {
  const structural: ConsultationApprovalStructuralField[] = [];
  if (!entity.tradeType) structural.push("tradeType");
  if (!entity.clubId) structural.push("clubId");
  if (!entity.membershipId) structural.push("membershipId");

  const fillable: ConsultationApprovalFillableField[] = [];
  if (!(entity.customerName ?? "").trim()) fillable.push("customerName");
  if (!(entity.contact ?? "").trim()) fillable.push("contact");
  if (entity.offerPrice == null || entity.offerPrice <= 0) fillable.push("offerPrice");
  if (entity.depositAmount == null || entity.depositAmount <= 0) fillable.push("depositAmount");

  return { structural, fillable };
}
