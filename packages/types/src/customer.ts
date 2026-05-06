import type { Pagination } from "./api";

// 고객 (OpenAPI CustomerResponseDto)
export interface Customer {
  id: string;
  organizationId: string;
  createdByUserId: string;
  createdByName: string;
  name: string;
  contact: string;
  email?: string | null;
  address?: string | null;
  memo?: string | null;
  // 신규 필드 (백엔드 스펙 확정 전이라 모두 optional)
  ageBracket?: string | null;
  occupation?: string | null;
  ownedMembershipSummary?: string | null;
  /**
   * 고객 영업 등급. 거래 라이프사이클에 따라 서버가 자동 산정한다 (예: ACTIVE_DEAL, HIGH_INTENT).
   * 클라이언트에서는 읽기 전용이며, 폼 입력으로 변경하지 않는다.
   * Phase B에서 enum으로 강화 예정.
   */
  customerGrade?: string | null;
  residenceArea?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 고객 생성 입력 (OpenAPI CreateCustomerDto) — customerGrade는 서버 자동 산정이므로 제외
export interface CustomerInput {
  name: string;
  contact: string;
  email?: string | null;
  address?: string | null;
  memo?: string;
  ageBracket?: string | null;
  occupation?: string | null;
  ownedMembershipSummary?: string | null;
  residenceArea?: string | null;
}

// 고객 수정 입력 (OpenAPI UpdateCustomerDto)
// customerGrade 는 거래 라이프사이클에 따라 서버가 자동 산정하지만,
// 운영자가 영업 상황에 따라 수동 조정할 수 있도록 옵션으로 노출한다.
export interface CustomerUpdateInput {
  name?: string;
  contact?: string;
  email?: string | null;
  address?: string | null;
  memo?: string;
  ageBracket?: string | null;
  occupation?: string | null;
  ownedMembershipSummary?: string | null;
  residenceArea?: string | null;
  customerGrade?: string | null;
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
  accountNumber?: string | null;
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
