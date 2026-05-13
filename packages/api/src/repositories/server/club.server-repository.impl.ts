import type { ApiResponse, Club, ClubsResponse, ClubDetail } from "@heritage-dx/types";
import type { IClubRepository } from "../../interfaces/general/club.repository";
import type { ListParams } from "../../types";

interface ServerRepoConfig {
  baseUrl: string;
  revalidate?: number;
}

const DEFAULT_TTL = 300;
const CACHE_TAG = "clubs";

export class ClubServerRepository implements IClubRepository {
  constructor(private config: ServerRepoConfig) {}

  private get ttl(): number {
    return this.config.revalidate ?? DEFAULT_TTL;
  }

  async getAll(params?: ListParams): Promise<ApiResponse<ClubsResponse>> {
    const allClubs: Club[] = [];
    let page = params?.page || 1;
    let totalCount = 0;

    while (true) {
      const res = await fetch(
        `${this.config.baseUrl}/clubs?limit=${params?.limit || 100}&page=${page}`,
        { next: { revalidate: this.ttl, tags: [CACHE_TAG] } },
      );

      if (!res.ok) {
        return {
          success: false,
          error: "골프장 목록을 불러오는데 실패했습니다.",
        };
      }

      const data = await res.json();
      const responseData = data.data || data;
      const clubs = (responseData.clubs || []).filter(
        (club: Club) => club.name?.trim(),
      );
      allClubs.push(...clubs);
      totalCount = responseData.pagination?.total || allClubs.length;

      if (!responseData.pagination?.hasNext) break;
      page++;
    }

    return {
      success: true,
      data: {
        clubs: allClubs,
        pagination: {
          total: totalCount,
          page: 1,
          limit: allClubs.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    };
  }

  async getOne(code: string): Promise<ApiResponse<ClubDetail>> {
    const res = await fetch(`${this.config.baseUrl}/clubs/${code}`, {
      next: { revalidate: this.ttl, tags: [CACHE_TAG, `clubs:${code}`] },
    });

    if (!res.ok) {
      return {
        success: false,
        error: "골프장 상세 정보를 불러오는데 실패했습니다.",
      };
    }

    const data = await res.json();
    return {
      success: true,
      data: data.data || data,
    };
  }
}
