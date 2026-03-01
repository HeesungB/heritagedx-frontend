import type { ApiResponse, ScenarioDocumentLink } from "@heritage-dx/types";

export interface IScenarioDocumentAdminRepository {
  getByScenario(
    scenarioId: string,
  ): Promise<ApiResponse<ScenarioDocumentLink[]>>;
  link(
    scenarioId: string,
    docId: string,
    data?: { required?: boolean; displayOrder?: number },
  ): Promise<ApiResponse<ScenarioDocumentLink>>;
  unlink(scenarioId: string, docId: string): Promise<ApiResponse<void>>;
}
