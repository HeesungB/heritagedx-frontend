import type { ApiClient } from "@heritage-dx/api-client";
import type {
  ApiResponse,
  Scenario,
  ScenarioConditions,
  ScenarioDocumentsResponse,
} from "@heritage-dx/types";
import type { IScenarioRepository } from "../../interfaces/general/scenario.repository";

export class ScenarioRepository implements IScenarioRepository {
  constructor(private api: ApiClient) {}

  async getByClub(clubCode: string): Promise<ApiResponse<Scenario[]>> {
    return this.api.get<Scenario[]>(`/clubs/${clubCode}`);
  }

  async match(
    conditions: ScenarioConditions,
  ): Promise<ApiResponse<Scenario[]>> {
    return this.api.post<Scenario[]>("/scenarios/match", conditions);
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
