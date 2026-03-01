import type {
  ApiResponse,
  ClubScenarioLink,
  ClubScenariosResponse,
} from "@heritage-dx/types";

export interface IClubScenarioAdminRepository {
  getByClub(clubId: string): Promise<ApiResponse<ClubScenariosResponse>>;
  link(
    clubId: string,
    scenarioId: string,
    data?: { displayOrder?: number },
  ): Promise<ApiResponse<ClubScenarioLink>>;
  update(
    clubId: string,
    scenarioId: string,
    data: { isActive?: boolean; customNotes?: string },
  ): Promise<ApiResponse<ClubScenarioLink>>;
  unlink(clubId: string, scenarioId: string): Promise<ApiResponse<void>>;
}
