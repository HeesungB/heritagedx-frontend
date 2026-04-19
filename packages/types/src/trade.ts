import type { ApprovalStatus, WorkflowStatus } from "./approval";
import type { Pagination } from "./api";

// 거래 유형 (OpenAPI 스펙 enum)
export type TradeType = "매도" | "매수";

// 상담 (OpenAPI ConsultationResponseDto)
export interface Consultation {
  id: string;
  customerId: string | null;
  clubId: string | null;
  clubName: string;
  membershipId: string | null;
  membershipName: string;
  isShared?: boolean;
  tradeType: TradeType;
  customerName: string;
  contact: string;
  offerPrice: string | number | null;
  offerPriceNote: string | null;
  desiredPrice: string | number | null;
  desiredPriceNote: string | null;
  depositAmount: number | null;
  customFields: Record<string, unknown>;
  notes: string | null;
  registrationDate: string | null;
  tradeDate: string | null;
  remarks: string | null;
  isDone: boolean;
  approvalStatus: ApprovalStatus;
  approvalRequestedAt: string | null;
  firstApprovedAt: string | null;
  holdReason: string | null;
  rejectionReason: string | null;
  linkedTradeId: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationsResponse {
  trades: Consultation[];
  pagination: Pagination;
}

export interface ConsultationInput {
  club: string;
  membership: string;
  tradeType: TradeType;
  customerName: string;
  contact: string;
  offerPrice?: number | null;
  offerPriceNote?: string | null;
  desiredPrice?: number | null;
  desiredPriceNote?: string | null;
  depositAmount?: number | null;
  customFields?: Record<string, unknown>;
  notes?: string | null;
  registrationDate?: string | null;
  tradeDate?: string | null;
  remarks?: string | null;
  isDone?: boolean;
  isShared?: boolean;
}

// 거래 내역 (OpenAPI MembershipTradeResponseDto)
export interface MembershipTrade {
  id: string;
  customerId: string | null;
  sourceConsultationId: string | null;
  clubId: string | null;
  clubName?: string;
  membershipId: string | null;
  customerName: string;
  contact: string;
  tradeType: TradeType;
  membershipName: string;
  workflowStatus: WorkflowStatus;
  contractDate: string | null;
  amount: number | null;
  depositAmount: number | null;
  tradingPartner: string | null;
  tradeAmount: number | null;
  commission: number | null;
  marketProfit: number | null;
  total: number | null;
  expense: number | null;
  description: string | null;
  netProfit: number | null;
  balanceDate: string | null;
  balanceCompleted: boolean;
  manager: string | null;
  taxTransfer: boolean;
  taxAcquisition: boolean;
  invoiceSales: number | null;
  invoicePurchase: number | null;
  remarks: string | null;
  actualTransactionDate: string | null;
  submittedForFinalReviewAt: string | null;
  finalApprovedAt: string | null;
  finalRejectedAt: string | null;
  finalRejectionReason: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipTradesResponse {
  trades: MembershipTrade[];
  pagination: Pagination;
}

export interface MembershipTradeInput {
  clubId: string;
  membershipId: string;
  customerId?: string | null;
  customerName: string;
  contact?: string;
  tradeType: TradeType;
  contractDate?: string | null;
  amount?: number | null;
  depositAmount?: number | null;
  tradingPartner?: string | null;
  tradeAmount?: number | null;
  commission?: number | null;
  marketProfit?: number | null;
  total?: number | null;
  expense?: number | null;
  description?: string | null;
  netProfit?: number | null;
  balanceDate?: string | null;
  balanceCompleted?: boolean;
  manager?: string | null;
  taxTransfer?: boolean;
  taxAcquisition?: boolean;
  invoiceSales?: number | null;
  invoicePurchase?: number | null;
  remarks?: string | null;
  actualTransactionDate?: string | null;
}
