import type {
  ApiResponse,
  Scenario,
  ScenarioConditions,
  ScenarioDocumentsResponse,
} from "@heritage-dx/types";

export interface IScenarioRepository {
  getByClub(clubCode: string): Promise<ApiResponse<Scenario[]>>;
  match(conditions: ScenarioConditions): Promise<ApiResponse<Scenario[]>>;
  getDocuments(
    scenarioCode: string,
    clubCode: string,
    ownerType?: string,
  ): Promise<ApiResponse<ScenarioDocumentsResponse>>;
}
