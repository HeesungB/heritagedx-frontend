import type { ApiResponse, Claim, ClaimInput } from "@heritage-dx/types";

export interface IClaimRepository {
  create(data: ClaimInput): Promise<ApiResponse<Claim>>;
}
