import type { ApiResponse, Club } from "@heritage-dx/types";

export interface IClubAdminRepository {
  create(data: Partial<Club>): Promise<ApiResponse<Club>>;
  update(id: string, data: Partial<Club>): Promise<ApiResponse<Club>>;
  delete(id: string): Promise<ApiResponse<void>>;
}
