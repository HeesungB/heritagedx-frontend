import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Settlement,
  SettlementUpdateInput,
  SettlementsResponse,
} from "@heritage-dx/types";
import type {
  AdminSettlementListParams,
  ISettlementAdminRepository,
} from "../../interfaces/admin/settlement-admin.repository";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class SettlementAdminRepository implements ISettlementAdminRepository {
  constructor(private api: ApiClient) {}

  async list(
    params?: AdminSettlementListParams,
  ): Promise<ApiResponse<SettlementsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>("/admin/settlements", params);
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<Settlement>(
        response.data,
        "settlements",
      );
      return {
        success: true,
        data: { settlements: items, pagination },
      };
    }
    return response as ApiResponse<SettlementsResponse>;
  }

  async getOne(id: string): Promise<ApiResponse<Settlement>> {
    return this.api.get<Settlement>(`/admin/settlements/${id}`);
  }

  async update(
    id: string,
    data: SettlementUpdateInput,
  ): Promise<ApiResponse<Settlement>> {
    return this.api.put<Settlement>(`/admin/settlements/${id}`, data);
  }
}
