import type { Pagination } from "./api";

// 고객 (OpenAPI CustomerResponseDto)
export interface Customer {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string;
  name: string;
  contact: string;
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 고객 생성 입력 (OpenAPI CreateCustomerDto)
export interface CustomerInput {
  name: string;
  contact: string;
  memo?: string;
}

// 고객 수정 입력 (OpenAPI UpdateCustomerDto)
export interface CustomerUpdateInput {
  name?: string;
  contact?: string;
  memo?: string;
}

// 고객 목록 응답 데이터
export interface CustomersListData {
  customers: Customer[];
  pagination: Pagination;
}

// 고객 이력 요약 (OpenAPI CustomerHistorySummaryDataDto)
export interface CustomerHistorySummary {
  customerId: string;
  summary: {
    consultationCount: number;
    membershipTradeCount: number;
  };
  recentConsultations: CustomerHistoryRecentConsultation[];
  recentMembershipTrades: CustomerHistoryRecentMembershipTrade[];
}

export interface CustomerHistoryRecentConsultation {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  registrationDate: string | null;
  approvalStatus: string;
}

export interface CustomerHistoryRecentMembershipTrade {
  id: string;
  clubName: string;
  membershipName: string;
  tradeType: "매도" | "매수";
  contractDate: string | null;
  workflowStatus: string;
}

// 고객 이력 상세 (OpenAPI CustomerHistoryDataDto)
export interface CustomerHistory {
  customer: Customer;
  summary: {
    consultationCount: number;
    membershipTradeCount: number;
  };
  consultations: {
    items: unknown[];
    pagination: Pagination;
  };
  membershipTrades: {
    items: unknown[];
    pagination: Pagination;
  };
}
