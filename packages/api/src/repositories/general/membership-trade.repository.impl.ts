import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  ApprovalActionInput,
  MembershipTrade,
  MembershipTradeInput,
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

  async create(data: MembershipTradeInput): Promise<ApiResponse<MembershipTrade>> {
    return this.api.post<MembershipTrade>("/membership-trades", data);
  }

  async update(
    id: string,
    data: MembershipTradeInput,
  ): Promise<ApiResponse<MembershipTrade>> {
    return this.api.put<MembershipTrade>(`/membership-trades/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/membership-trades/${id}`);
  }

  async workflowAction(
    id: string,
    body: ApprovalActionInput,
  ): Promise<ApiResponse<MembershipTrade>> {
    return this.api.patch<MembershipTrade>(
      `/membership-trades/${id}/workflow-action`,
      body,
    );
  }
}
