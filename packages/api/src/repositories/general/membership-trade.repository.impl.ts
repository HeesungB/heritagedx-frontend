import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  TradeRecord,
  TradeRecordInput,
  TradeRecordsResponse,
} from "@heritage-dx/types";
import type { IMembershipTradeRepository } from "../../interfaces/general/membership-trade.repository";
import type { TradeListParams } from "../../types";

export class MembershipTradeRepository implements IMembershipTradeRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: TradeListParams,
  ): Promise<ApiResponse<TradeRecordsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.tradeType) searchParams.append("tradeType", params.tradeType);
    if (params?.clubId) searchParams.append("clubId", params.clubId);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.order) searchParams.append("order", params.order);
    const queryString = searchParams.toString();
    const endpoint = `/membership-trades${queryString ? `?${queryString}` : ""}`;
    return this.api.get<TradeRecordsResponse>(endpoint);
  }

  async create(data: TradeRecordInput): Promise<ApiResponse<TradeRecord>> {
    return this.api.post<TradeRecord>("/membership-trades", data);
  }

  async update(
    id: string,
    data: TradeRecordInput,
  ): Promise<ApiResponse<TradeRecord>> {
    return this.api.put<TradeRecord>(`/membership-trades/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/membership-trades/${id}`);
  }
}
