import type {
  ApiResponse,
  ScenarioDocumentsResponse,
  ScenarioOptions,
} from "@heritage-dx/types";

export interface IScenarioRepository {
  getOptions(clubCode: string): Promise<ApiResponse<ScenarioOptions>>;
  getDocuments(
    scenarioCode: string,
    clubCode: string,
    ownerType?: string,
  ): Promise<ApiResponse<ScenarioDocumentsResponse>>;
}
