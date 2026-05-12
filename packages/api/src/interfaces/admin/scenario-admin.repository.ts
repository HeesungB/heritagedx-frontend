import type {
  ApiResponse,
  Scenario,
  ScenarioOwnerType,
  ScenarioSide,
  ScenariosResponse,
} from "@heritage-dx/types";

// 글로벌 admin 시나리오 목록 파라미터 (스웨거 GET /admin/scenarios).
// per-club 시나리오는 `IClubScenarioAdminRepository` (/admin/clubs/{clubId}/scenarios) 를 사용.
export interface AdminScenarioListParams {
  page?: number;
  limit?: number;
  search?: string;
  side?: ScenarioSide;
  ownerType?: ScenarioOwnerType;
  isActive?: boolean;
}

export interface IScenarioAdminRepository {
  getAll(
    params?: AdminScenarioListParams,
  ): Promise<ApiResponse<ScenariosResponse>>;
  getOne(id: string): Promise<ApiResponse<Scenario>>;
}
