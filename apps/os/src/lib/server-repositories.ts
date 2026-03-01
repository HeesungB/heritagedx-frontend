import { createServerRepositories } from "@heritage-dx/api/server";
import { mapClubDtoToEntity, mapClubDetailDtoToEntity } from "@heritage-dx/store";
import type { ClubEntity, ClubDetailEntity } from "@heritage-dx/store";

export const serverRepos = createServerRepositories({
  baseUrl: "https://api.heritage-dx.com/api",
  revalidate: 300,
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

export async function getInitialData(clubCode?: string) {
  try {
    const { clubs, totalCount } = await getClubs();

    if (clubs.length === 0) {
      return { clubs: [], totalCount: 0, initialClub: null, initialClubDetail: null };
    }

    if (!clubCode) {
      return { clubs, totalCount, initialClub: null, initialClubDetail: null };
    }

    const foundClub = clubs.find((c) => c.code === clubCode);
    if (!foundClub) {
      return { clubs, totalCount, initialClub: null, initialClubDetail: null };
    }

    const initialClubDetail = await getClubDetail(foundClub.code);
    return { clubs, totalCount, initialClub: foundClub, initialClubDetail };
  } catch (error) {
    console.error("초기 데이터 로딩 실패:", error);
    return { clubs: [], totalCount: 0, initialClub: null, initialClubDetail: null };
  }
}
