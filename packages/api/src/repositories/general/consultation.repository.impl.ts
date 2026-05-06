import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  ApprovalActionInput,
  Consultation,
  ConsultationAiInput,
  ConsultationAiResponse,
  ConsultationInput,
  ConsultationNoteInput,
  ConsultationsResponse,
  UserConsultationAction,
} from "@heritage-dx/types";
import type { IConsultationRepository } from "../../interfaces/general/consultation.repository";
import type { TradeListParams } from "../../types";

export class ConsultationRepository implements IConsultationRepository {
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
    if (params?.isShared !== undefined) searchParams.append("isShared", String(params.isShared));
    if (params?.organizationId) searchParams.append("organizationId", params.organizationId);
    if (params?.approvalStatus) searchParams.append("approvalStatus", params.approvalStatus);
    if (params?.customerId) searchParams.append("customerId", params.customerId);
    if (params?.linkedTradeId) searchParams.append("linkedTradeId", params.linkedTradeId);
    const queryString = searchParams.toString();
    const endpoint = `/consultations${queryString ? `?${queryString}` : ""}`;
    return this.api.get<ConsultationsResponse>(endpoint);
  }

  async create(data: ConsultationInput): Promise<ApiResponse<Consultation>> {
    return this.api.post<Consultation>("/consultations", data);
  }

  async update(
    id: string,
    data: ConsultationInput,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.put<Consultation>(`/consultations/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/consultations/${id}`);
  }

  async approvalAction(
    id: string,
    body: ApprovalActionInput<UserConsultationAction>,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.patch<Consultation>(
      `/consultations/${id}/approval-action`,
      body,
    );
  }

  async createDraftFromText(
    input: ConsultationAiInput,
  ): Promise<ApiResponse<ConsultationAiResponse>> {
    return this.api.post<ConsultationAiResponse>("/consultations/ai", input);
  }

  async addNote(
    id: string,
    input: ConsultationNoteInput,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.post<Consultation>(`/consultations/${id}/notes`, input);
  }

  async updateNote(
    id: string,
    noteId: string,
    input: ConsultationNoteInput,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.patch<Consultation>(
      `/consultations/${id}/notes/${noteId}`,
      input,
    );
  }

  async deleteNote(
    id: string,
    noteId: string,
  ): Promise<ApiResponse<Consultation>> {
    return this.api.delete<Consultation>(`/consultations/${id}/notes/${noteId}`);
  }
}
