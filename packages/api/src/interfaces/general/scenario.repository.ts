import type {
  ApiResponse,
  Scenario,
  ScenarioConditions,
  ScenarioDocumentsResponse,
  ScenarioOptions,
} from "@heritage-dx/types";

export interface IScenarioRepository {
  getByClub(clubCode: string): Promise<ApiResponse<Scenario[]>>;
  getOptions(clubCode: string): Promise<ApiResponse<ScenarioOptions>>;
  match(conditions: ScenarioConditions): Promise<ApiResponse<Scenario[]>>;
  getDocuments(
    scenarioCode: string,
    clubCode: string,
    ownerType?: string,
  ): Promise<ApiResponse<ScenarioDocumentsResponse>>;
}
