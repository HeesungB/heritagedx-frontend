import type { ApiClient } from "@heritage-dx/api-client";
import type { ApiResponse, Club, ClubsResponse, ClubDetail } from "@heritage-dx/types";
import type { IClubRepository } from "../../interfaces/general/club.repository";
import type { ListParams } from "../../types";
import { normalizeListResponse } from "../../normalizers/normalize-list";

export class ClubRepository implements IClubRepository {
  constructor(private api: ApiClient) {}

  async getAll(params?: ListParams): Promise<ApiResponse<ClubsResponse>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.api.get<any>("/clubs?operationType=MEMBERSHIP", params);
    if (response.success && response.data) {
      const { items, pagination } = normalizeListResponse<Club>(
        response.data,
        "clubs",
        "code",
      );
      return {
        success: true,
        data: {
          clubs: items.filter((club) => club.name?.trim()),
          pagination,
        },
      };
    }
    return response as ApiResponse<ClubsResponse>;
  }

  async getOne(code: string): Promise<ApiResponse<ClubDetail>> {
    return this.api.get<ClubDetail>(`/clubs/${code}`);
  }
}
