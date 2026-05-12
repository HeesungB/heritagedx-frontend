import type {
  ApiResponse,
  Settlement,
  SettlementUpdateInput,
  SettlementsResponse,
} from "@heritage-dx/types";

// admin 입출금표 목록 파라미터 (스웨거 GET /admin/settlements).
export interface AdminSettlementListParams {
  organizationId?: string;
  consultationId?: string;
  membershipTradeId?: string;
  documentGenerated?: boolean;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}

export interface ISettlementAdminRepository {
  list(
    params?: AdminSettlementListParams,
  ): Promise<ApiResponse<SettlementsResponse>>;
  getOne(id: string): Promise<ApiResponse<Settlement>>;
  update(
    id: string,
    data: SettlementUpdateInput,
  ): Promise<ApiResponse<Settlement>>;
}
