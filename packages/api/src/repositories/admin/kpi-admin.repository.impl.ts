import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  KpiTradesParams,
  KpiTradesResponse,
  KpiConsultationsParams,
  KpiConsultationsResponse,
  Employee,
} from "@heritage-dx/types";
import type { IKpiAdminRepository } from "../../interfaces/admin/kpi-admin.repository";

export class KpiAdminRepository implements IKpiAdminRepository {
  constructor(private api: ApiClient) {}

  async getTrades(
    params: KpiTradesParams,
  ): Promise<ApiResponse<KpiTradesResponse>> {
    const sp = new URLSearchParams();
    sp.set("startDate", params.startDate);
    sp.set("endDate", params.endDate);
    if (params.dateField) sp.set("dateField", params.dateField);
    if (params.employeeField) sp.set("employeeField", params.employeeField);
    if (params.userId) sp.set("userId", params.userId);
    if (params.managerName) sp.set("managerName", params.managerName);

    return this.api.get<KpiTradesResponse>(
      `/admin/kpi/trades?${sp.toString()}`,
    );
  }

  async getConsultations(
    params: KpiConsultationsParams,
  ): Promise<ApiResponse<KpiConsultationsResponse>> {
    const sp = new URLSearchParams();
    sp.set("startDate", params.startDate);
    sp.set("endDate", params.endDate);
    if (params.dateField) sp.set("dateField", params.dateField);
    if (params.userId) sp.set("userId", params.userId);

    return this.api.get<KpiConsultationsResponse>(
      `/admin/kpi/consultations?${sp.toString()}`,
    );
  }

  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.api.get<Employee[]>("/admin/employees");
  }
}
