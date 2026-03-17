import type {
  ApiResponse,
  KpiTradesParams,
  KpiTradesResponse,
  KpiConsultationsParams,
  KpiConsultationsResponse,
  Employee,
} from "@heritage-dx/types";

export interface IKpiAdminRepository {
  getTrades(
    params: KpiTradesParams,
  ): Promise<ApiResponse<KpiTradesResponse>>;
  getConsultations(
    params: KpiConsultationsParams,
  ): Promise<ApiResponse<KpiConsultationsResponse>>;
  getEmployees(): Promise<ApiResponse<Employee[]>>;
}
