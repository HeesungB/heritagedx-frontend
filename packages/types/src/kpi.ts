export interface KpiTradesResponse {
  totalCount: number;
  totalNetProfit: number;
}

export interface KpiTradesParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dateField?: "contractDate" | "createdAt";
  employeeField?: "createdByUserId" | "manager";
  userId?: string;
  managerName?: string;
}

export interface KpiConsultationsResponse {
  totalCount: number;
}

export interface KpiConsultationsParams {
  startDate: string;
  endDate: string;
  dateField?: "registrationDate" | "createdAt";
  userId?: string;
}

export interface Employee {
  id: string;
  name: string;
}
