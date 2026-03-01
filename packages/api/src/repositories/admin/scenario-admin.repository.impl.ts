import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Scenario,
  ScenariosResponse,
} from "@heritage-dx/types";
import type { IScenarioAdminRepository } from "../../interfaces/admin/scenario-admin.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class ScenarioAdminRepository implements IScenarioAdminRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: ListParams,
  ): Promise<ApiResponse<ScenariosResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>("/admin/scenarios", params);
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<Scenario>(
        response.data,
        "scenarios",
      );
      return {
        success: true,
        data: { scenarios: items, pagination },
      };
    }
    return response as ApiResponse<ScenariosResponse>;
  }

  async getOne(id: string): Promise<ApiResponse<Scenario>> {
    return this.api.get<Scenario>(`/admin/scenarios/${id}`);
  }

  async create(data: Partial<Scenario>): Promise<ApiResponse<Scenario>> {
    return this.api.post<Scenario>("/admin/scenarios", data);
  }

  async update(
    id: string,
    data: Partial<Scenario>,
  ): Promise<ApiResponse<Scenario>> {
    return this.api.put<Scenario>(`/admin/scenarios/${id}`, data);
  }

  async toggleActive(id: string): Promise<ApiResponse<void>> {
    return this.api.patch(`/admin/scenarios/${id}/toggle-active`);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/scenarios/${id}`);
  }
}
