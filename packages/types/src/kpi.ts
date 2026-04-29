// 거래 KPI 응답 (OpenAPI TradeKpiDataDto)
export interface KpiTradesResponse {
  totalCount: number;
  totalNetProfit: number;
  userId?: string;
  managerName?: string;
}

export interface KpiTradesParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  employeeField?: "createdByUserId" | "manager";
  userId?: string;
  managerName?: string;
}

// 상담 KPI 응답 (OpenAPI ConsultationKpiDataDto)
export interface KpiConsultationsResponse {
  totalCount: number;
  consultationCreatedCount: number;
  approvalRequestedCount: number;
  depositBasedFirstApprovedCount: number;
  tradeConvertedCount: number;
  finalCompletedCount: number;
  userId?: string;
}

export interface KpiConsultationsParams {
  startDate: string;
  endDate: string;
  dateField?: "registrationDate" | "createdAt";
  userId?: string;
}

// 조직원 (OpenAPI EmployeeItemDto)
export interface Employee {
  id: string;
  name: string;
}
