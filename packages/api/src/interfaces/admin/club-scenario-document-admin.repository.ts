import type { ApiResponse, ClubScenarioDocument } from "@heritage-dx/types";

export interface IClubScenarioDocumentAdminRepository {
  getByClubScenario(
    clubId: string,
    scenarioId: string,
  ): Promise<ApiResponse<ClubScenarioDocument[]>>;
  link(
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
  ): Promise<ApiResponse<ClubScenarioDocument>>;
  update(
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
  ): Promise<ApiResponse<ClubScenarioDocument>>;
  unlink(
    clubId: string,
    scenarioId: string,
    docId: string,
  ): Promise<ApiResponse<void>>;
}
