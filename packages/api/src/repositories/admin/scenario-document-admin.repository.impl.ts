import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, ScenarioDocumentLink } from "@heritage-dx/types";
import type { IScenarioDocumentAdminRepository } from "../../interfaces/admin/scenario-document-admin.repository";

export class ScenarioDocumentAdminRepository
  implements IScenarioDocumentAdminRepository
{
  constructor(private api: ApiClient) {}

  async getByScenario(
    scenarioId: string,
  ): Promise<ApiResponse<ScenarioDocumentLink[]>> {
    return this.api.get<ScenarioDocumentLink[]>(
      `/admin/scenarios/${scenarioId}/documents`,
    );
  }

  async link(
    scenarioId: string,
    docId: string,
    data?: { required?: boolean; displayOrder?: number },
  ): Promise<ApiResponse<ScenarioDocumentLink>> {
    return this.api.post<ScenarioDocumentLink>(
      `/admin/scenarios/${scenarioId}/documents`,
      { docId, ...data },
    );
  }

  async unlink(
    scenarioId: string,
    docId: string,
  ): Promise<ApiResponse<void>> {
    return this.api.delete(
      `/admin/scenarios/${scenarioId}/documents/${docId}`,
    );
  }
}
