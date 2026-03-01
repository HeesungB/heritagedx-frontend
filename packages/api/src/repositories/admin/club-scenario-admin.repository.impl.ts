import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  ClubScenarioLink,
  ClubScenariosResponse,
} from "@heritage-dx/types";
import type { IClubScenarioAdminRepository } from "../../interfaces/admin/club-scenario-admin.repository";

export class ClubScenarioAdminRepository
  implements IClubScenarioAdminRepository
{
  constructor(private api: ApiClient) {}

  async getByClub(
    clubId: string,
  ): Promise<ApiResponse<ClubScenariosResponse>> {
    return this.api.get<ClubScenariosResponse>(
      `/admin/clubs/${clubId}/scenarios`,
    );
  }

  async link(
    clubId: string,
    scenarioId: string,
    data?: { displayOrder?: number },
  ): Promise<ApiResponse<ClubScenarioLink>> {
    return this.api.post<ClubScenarioLink>(
      `/admin/clubs/${clubId}/scenarios`,
      { scenarioId, ...data },
    );
  }

  async update(
    clubId: string,
    scenarioId: string,
    data: { isActive?: boolean; customNotes?: string },
  ): Promise<ApiResponse<ClubScenarioLink>> {
    return this.api.put<ClubScenarioLink>(
      `/admin/clubs/${clubId}/scenarios/${scenarioId}`,
      data,
    );
  }

  async unlink(
    clubId: string,
    scenarioId: string,
  ): Promise<ApiResponse<void>> {
    return this.api.delete(`/admin/clubs/${clubId}/scenarios/${scenarioId}`);
  }
}
