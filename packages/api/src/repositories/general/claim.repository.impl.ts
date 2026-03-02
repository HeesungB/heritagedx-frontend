import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Claim, ClaimInput } from "@heritage-dx/types";
import type { IClaimRepository } from "../../interfaces/general/claim.repository";

export class ClaimRepository implements IClaimRepository {
  constructor(private api: ApiClient) {}

  async create(data: ClaimInput): Promise<ApiResponse<Claim>> {
    return this.api.post<Claim>("/claims", data);
  }
}
