import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  ApprovalActionInput,
  Consultation,
  ConsultationInput,
  ConsultationsResponse,
} from "@heritage-dx/types";
import type { IConsultationAdminRepository } from "../../interfaces/admin/consultation-admin.repository";
import type { TradeListParams } from "../../types";

export class ConsultationAdminRepository implements IConsultationAdminRepository {
  constructor(private api: ApiClient) {}

  async getAll(
    params?: TradeListParams,
  ): Promise<ApiResponse<ConsultationsResponse>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.tradeType) searchParams.append("tradeType", params.tradeType);
    if (params?.clubId) searchParams.append("clubId", params.clubId);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.order) searchParams.append("order", params.order);
    if (params?.isDone !== undefined) searchParams.append("isDone", String(params.isDone));
    if (params?.isShared !== undefined) searchParams.append("isShared", String(params.isShared));
    if (params?.organizationId) searchParams.append("organizationId", params.organizationId);
    if (params?.approvalStatus) searchParams.append("approvalStatus", params.approvalStatus);
    if (params?.customerId) searchParams.append("customerId", params.customerId);
    if (params?.linkedTradeId) searchParams.append("linkedTradeId", params.linkedTradeId);
    if (params?.isConverted !== undefined) searchParams.append("isConverted", String(params.isConverted));
    const queryString = searchParams.toString();
    const endpoint = `/admin/consultations${queryString ? `?${queryString}` : ""}`;
    return this.api.get<ConsultationsResponse>(endpoint);
  }

  async getById(id: string): Promise<ApiResponse<Consultation>> {
    return this.api.get<Consultation>(`/admin/consultations/${id}`);
  }

  async create(data: ConsultationInput): Promise<ApiResponse<Consultation>> {
    return this.api.post<Consultation>("/admin/consultations", data);
  }

  async update(
    id: string,
    data: ConsultationInput,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.put<Consultation>(`/admin/consultations/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/consultations/${id}`);
  }

  async approvalAction(
    id: string,
    body: ApprovalActionInput,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.patch<Consultation>(
      `/admin/consultations/${id}/approval-action`,
      body,
    );
  }
}
