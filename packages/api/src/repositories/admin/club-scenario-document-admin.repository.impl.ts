import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, ClubScenarioDocument } from "@heritage-dx/types";
import type { IClubScenarioDocumentAdminRepository } from "../../interfaces/admin/club-scenario-document-admin.repository";

export class ClubScenarioDocumentAdminRepository
  implements IClubScenarioDocumentAdminRepository
{
  constructor(private api: ApiClient) {}

  async getByClubScenario(
    clubId: string,
    scenarioId: string,
  ): Promise<ApiResponse<ClubScenarioDocument[]>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>(
      `/admin/clubs/${clubId}/scenarios/${scenarioId}/documents`,
    );
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
    }
    return response as ApiResponse<ClubScenarioDocument[]>;
  }

  async link(
    clubId: string,
    scenarioId: string,
    clubDocumentId: string,
    data?: {
      minCount?: number;
      unit?: string;
      isMandatory?: boolean;
      notes?: string;
      displayOrder?: number;
      ownerTypes?: string[];
    },
  ): Promise<ApiResponse<ClubScenarioDocument>> {
    return this.api.post<ClubScenarioDocument>(
      `/admin/clubs/${clubId}/scenarios/${scenarioId}/documents`,
      { clubDocumentId, ...data },
    );
  }

  async update(
    clubId: string,
    scenarioId: string,
    clubDocumentId: string,
    data: {
      minCount?: number;
      unit?: string;
      isMandatory?: boolean;
      notes?: string;
      displayOrder?: number;
    },
  ): Promise<ApiResponse<ClubScenarioDocument>> {
    return this.api.put<ClubScenarioDocument>(
      `/admin/clubs/${clubId}/scenarios/${scenarioId}/documents/${clubDocumentId}`,
      data,
    );
  }

  async unlink(
    clubId: string,
    scenarioId: string,
    docId: string,
  ): Promise<ApiResponse<void>> {
    return this.api.delete(
      `/admin/clubs/${clubId}/scenarios/${scenarioId}/documents/${docId}`,
    );
  }
}
