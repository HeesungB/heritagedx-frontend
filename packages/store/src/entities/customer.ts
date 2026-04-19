export interface CustomerEntity {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string;
  name: string;
  contact: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHistoryRecentConsultationEntity {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  registrationDate: string | null;
  approvalStatus: string;
}

export interface CustomerHistoryRecentMembershipTradeEntity {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  contractDate: string | null;
  workflowStatus: string;
}

export interface CustomerHistorySummaryEntity {
  customerId: string;
  summary: {
    consultationCount: number;
    membershipTradeCount: number;
  };
  recentConsultations: CustomerHistoryRecentConsultationEntity[];
  recentMembershipTrades: CustomerHistoryRecentMembershipTradeEntity[];
}
