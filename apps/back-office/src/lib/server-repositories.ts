import { createServerRepositories } from "@heritage-dx/api/server";
import { mapClubDtoToEntity, mapClubDetailDtoToEntity } from "@heritage-dx/store";
import type { ClubEntity, ClubDetailEntity } from "@heritage-dx/store";
import type { Notice } from "@heritage-dx/types";

export const serverRepos = createServerRepositories({
  baseUrl: "https://api.heritage-dx.com/api",
});

export async function getClubs(): Promise<{ clubs: ClubEntity[]; totalCount: number }> {
  const response = await serverRepos.clubs.getAll({ limit: 100 });
  if (!response.success || !response.data) {
    throw new Error("골프장 목록을 불러오는데 실패했습니다.");
  }
  return {
    clubs: response.data.clubs.map(mapClubDtoToEntity),
    totalCount: response.data.pagination.total,
  };
}

export async function getClubDetail(code: string): Promise<ClubDetailEntity> {
  const response = await serverRepos.clubs.getOne(code);
  if (!response.success || !response.data) {
    throw new Error("골프장 상세 정보를 불러오는데 실패했습니다.");
  }
  return mapClubDetailDtoToEntity(response.data);
}

export async function getNotices(params?: {
  page?: number;
  limit?: number;
  order?: "DESC" | "ASC";
  search?: string;
}): Promise<{ notices: Notice[]; total: number }> {
  const response = await serverRepos.notices.list(params);
  if (!response.success || !response.data) {
    throw new Error("공지사항을 불러오는데 실패했습니다.");
  }
  return {
    notices: response.data.notices ?? [],
    total: response.data.pagination?.total ?? 0,
  };
}

export async function getMarketPricesByMembership(
  membershipId: string,
  params: { from: string; to: string },
): Promise<{ prices: Array<{ date: string; marketPrice: number }> }> {
  return serverRepos.marketPrices.listByMembership(membershipId, params);
}
