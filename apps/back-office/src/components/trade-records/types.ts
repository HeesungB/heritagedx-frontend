import type { ClubSearchItem } from "@heritage-dx/ui";
import type { TradeWorkflowStatus } from "@heritage-dx/store";

export interface TradeRecordPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TradeRecordView {
  id: string;
  customerId: string | null;
  sourceConsultationId: string | null;
  clubId: string | null;
  clubName?: string;
  membershipId: string | null;
  customerName: string;
  contact: string;
  tradeType: "매수" | "매도";
  membershipName: string;
  workflowStatus: TradeWorkflowStatus;
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
  finalApprovedAt: string | null;
  settlementId: string | null;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type TradeRecordClubOption = ClubSearchItem;
