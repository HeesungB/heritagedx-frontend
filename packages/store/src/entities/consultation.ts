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
