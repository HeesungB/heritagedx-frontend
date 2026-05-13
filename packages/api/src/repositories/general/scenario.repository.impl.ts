import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  ScenarioDocumentsResponse,
  ScenarioOptions,
} from "@heritage-dx/types";
import type { IScenarioRepository } from "../../interfaces/general/scenario.repository";

export class ScenarioRepository implements IScenarioRepository {
  constructor(private api: ApiClient) {}

  async getOptions(clubCode: string): Promise<ApiResponse<ScenarioOptions>> {
    return this.api.get<ScenarioOptions>(`/clubs/${clubCode}/scenario-options`);
  }

  async getDocuments(
    scenarioCode: string,
    clubCode: string,
    ownerType?: string,
  ): Promise<ApiResponse<ScenarioDocumentsResponse>> {
    const params = new URLSearchParams();
    params.append("clubCode", clubCode);
    if (ownerType) params.append("ownerType", ownerType);
    return this.api.get<ScenarioDocumentsResponse>(
      `/scenarios/${scenarioCode}/documents?${params.toString()}`,
    );
  }
}
