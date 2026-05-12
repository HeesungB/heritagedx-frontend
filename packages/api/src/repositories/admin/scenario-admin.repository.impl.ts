import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Scenario,
  ScenariosResponse,
} from "@heritage-dx/types";
import type {
  AdminScenarioListParams,
  IScenarioAdminRepository,
} from "../../interfaces/admin/scenario-admin.repository";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class ScenarioAdminRepository implements IScenarioAdminRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: AdminScenarioListParams,
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
}
