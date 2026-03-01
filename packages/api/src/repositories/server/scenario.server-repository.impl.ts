import type {
  ApiResponse,
  Scenario,
  ScenarioConditions,
  ScenarioDocumentsResponse,
} from "@heritage-dx/types";
import type { IScenarioRepository } from "../../interfaces/general/scenario.repository";

interface ServerRepoConfig {
  baseUrl: string;
  revalidate: number;
}

export class ScenarioServerRepository implements IScenarioRepository {
  constructor(private config: ServerRepoConfig) {}

  async getByClub(clubCode: string): Promise<ApiResponse<Scenario[]>> {
    const res = await fetch(
      `${this.config.baseUrl}/clubs/${clubCode}`,
      { next: { revalidate: this.config.revalidate } },
    );

    if (!res.ok) {
      return { success: false, error: "시나리오 목록을 불러오는데 실패했습니다." };
    }

    const data = await res.json();
    return { success: true, data: data.data || data };
  }

  async match(
    conditions: ScenarioConditions,
  ): Promise<ApiResponse<Scenario[]>> {
    const res = await fetch(`${this.config.baseUrl}/scenarios/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conditions),
      next: { revalidate: this.config.revalidate },
    });

    if (!res.ok) {
      return { success: false, error: "시나리오 매칭에 실패했습니다." };
    }

    const data = await res.json();
    return { success: true, data: data.data || data };
  }

  async getDocuments(
    scenarioCode: string,
    clubCode: string,
    ownerType?: string,
  ): Promise<ApiResponse<ScenarioDocumentsResponse>> {
    const params = new URLSearchParams();
    params.append("clubCode", clubCode);
    if (ownerType) params.append("ownerType", ownerType);

    const res = await fetch(
      `${this.config.baseUrl}/scenarios/${scenarioCode}/documents?${params.toString()}`,
      { next: { revalidate: this.config.revalidate } },
    );

    if (!res.ok) {
      return { success: false, error: "서류 목록을 불러오는데 실패했습니다." };
    }

    const data = await res.json();
    return { success: true, data: data.data || data };
  }
}
