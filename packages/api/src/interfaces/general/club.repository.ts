import type { ApiResponse, ClubsResponse, ClubDetail } from "@heritage-dx/types";
import type { ListParams } from "../../types";

export interface IClubRepository {
  getAll(params?: ListParams): Promise<ApiResponse<ClubsResponse>>;
  getOne(code: string): Promise<ApiResponse<ClubDetail>>;
}
