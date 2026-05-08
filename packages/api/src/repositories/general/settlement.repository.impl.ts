import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Settlement,
  SettlementDraftResponse,
  SettlementInput,
  SettlementUpdateInput,
} from "@heritage-dx/types";
import type { ISettlementRepository } from "../../interfaces/general/settlement.repository";

export class SettlementRepository implements ISettlementRepository {
  constructor(private api: ApiClient) {}

  async createDraft(
    consultationId: string,
  ): Promise<ApiResponse<SettlementDraftResponse>> {
    return this.api.post<SettlementDraftResponse>("/settlements/draft", {
      consultationId,
    });
  }

  async create(data: SettlementInput): Promise<ApiResponse<Settlement>> {
    return this.api.post<Settlement>("/settlements", data);
  }

  async getOne(consultationId: string): Promise<ApiResponse<Settlement>> {
    return this.api.get<Settlement>(`/settlements/${consultationId}`);
  }

  async update(
    consultationId: string,
    data: SettlementUpdateInput,
  ): Promise<ApiResponse<Settlement>> {
    return this.api.put<Settlement>(`/settlements/${consultationId}`, data);
  }

  async markDocumentGenerated(
    consultationId: string,
  ): Promise<ApiResponse<Settlement>> {
    return this.api.patch<Settlement>(
      `/settlements/${consultationId}/document-generated`,
      {},
    );
  }

  async delete(consultationId: string): Promise<ApiResponse<void>> {
    return this.api.delete(`/settlements/${consultationId}`);
  }
}
