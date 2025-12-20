import HomeClient from "@/components/HomeClient";
import { getInitialData } from "@/lib/api";

export default async function Home() {
  // 서버에서 초기 데이터 가져오기 (캐시 적용)
  const { clubs, initialClub, initialClubDetail } = await getInitialData();

  return (
    <HomeClient
      initialClubs={clubs}
      initialClub={initialClub}
      initialClubDetail={initialClubDetail}
    />
  );
}
