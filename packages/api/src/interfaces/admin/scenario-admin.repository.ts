import type {
  ApiResponse,
  Scenario,
  ScenariosResponse,
} from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface IScenarioAdminRepository {
  getAll(params?: ListParams): Promise<ApiResponse<ScenariosResponse>>;
  getOne(id: string): Promise<ApiResponse<Scenario>>;
  create(data: Partial<Scenario>): Promise<ApiResponse<Scenario>>;
  update(id: string, data: Partial<Scenario>): Promise<ApiResponse<Scenario>>;
  toggleActive(id: string): Promise<ApiResponse<void>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
