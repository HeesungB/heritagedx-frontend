import type { WorkflowStatus } from "@heritage-dx/types";

export interface MembershipTradeEntity {
  id: string;
  customerId: string | null;
  sourceConsultationId: string | null;
  clubId: string | null;
  clubName: string;
  membershipId: string | null;
  tradeType: "매수" | "매도";
  workflowStatus: WorkflowStatus;

  customer: {
    name: string;
    contact: string;
  };

  trade: {
    membershipName: string;
    contractDate: string | null;
    amount: number | null;
    depositAmount: number | null;
    tradingPartner: string | null;
    tradeAmount: number | null;
    commission: number | null;
    actualTransactionDate: string | null;
  };

  financials: {
    marketProfit: number | null;
    total: number | null;
    expense: number | null;
    netProfit: number | null;
  };

  tax: {
    taxTransfer: boolean;
    taxAcquisition: boolean;
    invoiceSales: number | null;
    invoicePurchase: number | null;
  };

  balance: {
    balanceDate: string | null;
    balanceCompleted: boolean;
  };

  submittedForFinalReviewAt: string | null;
  finalApprovedAt: string | null;
  finalRejectedAt: string | null;
  finalRejectionReason: string | null;

  manager: string | null;
  description: string | null;
  remarks: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}
