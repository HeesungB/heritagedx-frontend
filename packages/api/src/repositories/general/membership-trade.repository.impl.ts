import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  MembershipTrade,
  MembershipTradesResponse,
} from "@heritage-dx/types";
import type { IMembershipTradeRepository } from "../../interfaces/general/membership-trade.repository";
import type { TradeListParams } from "../../types";

export class MembershipTradeRepository implements IMembershipTradeRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: TradeListParams,
  ): Promise<ApiResponse<MembershipTradesResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.tradeType) searchParams.append("tradeType", params.tradeType);
    if (params?.clubId) searchParams.append("clubId", params.clubId);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.order) searchParams.append("order", params.order);
    if (params?.organizationId) searchParams.append("organizationId", params.organizationId);
    if (params?.customerId) searchParams.append("customerId", params.customerId);
    if (params?.sourceConsultationId) searchParams.append("sourceConsultationId", params.sourceConsultationId);
    if (params?.workflowStatus) searchParams.append("workflowStatus", params.workflowStatus);
    const queryString = searchParams.toString();
    const endpoint = `/membership-trades${queryString ? `?${queryString}` : ""}`;
    return this.api.get<MembershipTradesResponse>(endpoint);
  }

  async getOne(id: string): Promise<ApiResponse<MembershipTrade>> {
    return this.api.get<MembershipTrade>(`/membership-trades/${id}`);
  }
}
