import HomeClient from "@/components/HomeClient";
import { getInitialData } from "@/lib/api";

interface PageProps {
  searchParams: Promise<{ club?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  // URL 쿼리 파라미터에서 club 코드 읽기
  const params = await searchParams;
  const clubCode = params.club;

  // 서버에서 초기 데이터 가져오기 (캐시 적용)
  const { clubs, initialClub, initialClubDetail } = await getInitialData(clubCode);

  return (
    <HomeClient
      initialClubs={clubs}
      initialClub={initialClub}
      initialClubDetail={initialClubDetail}
    />
  );
}
