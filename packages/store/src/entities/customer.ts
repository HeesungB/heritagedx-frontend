export interface CustomerEntity {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string;
  name: string;
  contact: string;
  email: string | null;
  address: string | null;
  memo: string | null;
  ageBracket: string | null;
  occupation: string | null;
  ownedMembershipSummary: string | null;
  // 서버가 거래 라이프사이클에 맞춰 자동 산정. 클라이언트는 읽기 전용.
  customerGrade: string | null;
  residenceArea: string | null;
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
  accountNumber?: string | null;
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
