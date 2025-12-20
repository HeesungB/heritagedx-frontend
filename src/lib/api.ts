import { Club, ClubsResponse, ClubDetail, ClubDetailResponse } from "@/types";

const API_BASE_URL = "https://api.heritage-dx.com/api";

// 서버 컴포넌트에서 사용하는 fetch 함수들 (Next.js 캐시 활용)

export async function getClubs(): Promise<Club[]> {
  const res = await fetch(`${API_BASE_URL}/clubs?limit=100`, {
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!res.ok) {
    throw new Error("골프장 목록을 불러오는데 실패했습니다.");
  }

  const data: ClubsResponse = await res.json();
  return data.data.clubs;
}

export async function getClubDetail(code: string): Promise<ClubDetail> {
  const res = await fetch(`${API_BASE_URL}/clubs/${code}`, {
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!res.ok) {
    throw new Error("골프장 상세 정보를 불러오는데 실패했습니다.");
  }

  const data: ClubDetailResponse = await res.json();
  return data.data;
}

// 초기 데이터 프리로드 (첫 번째 골프장의 상세 정보까지 가져옴)
export async function getInitialData(): Promise<{
  clubs: Club[];
  initialClub: Club | null;
  initialClubDetail: ClubDetail | null;
}> {
  try {
    const clubs = await getClubs();

    if (clubs.length === 0) {
      return { clubs: [], initialClub: null, initialClubDetail: null };
    }

    const initialClub = clubs[0];
    const initialClubDetail = await getClubDetail(initialClub.code);

    return {
      clubs,
      initialClub,
      initialClubDetail,
    };
  } catch (error) {
    console.error("초기 데이터 로딩 실패:", error);
    return { clubs: [], initialClub: null, initialClubDetail: null };
  }
}
