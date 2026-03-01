import HomeClient from "@/components/HomeClient";
import { getInitialData } from "@/lib/server-repositories";

interface PageProps {
  searchParams: Promise<{ club?: string }>;
}

export default async function ClubsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const clubCode = params.club;

  // clubCode 없으면 서버 fetch 스킵 (클라이언트가 apiCache에서 로드)
  if (!clubCode) {
    return <HomeClient initialClubs={[]} initialTotalCount={0} initialClub={null} initialClubDetail={null} />;
  }

  // clubCode 있을 때만 서버에서 clubs + detail fetch
  const { clubs, totalCount, initialClub, initialClubDetail } = await getInitialData(clubCode);
  return (
    <HomeClient
      initialClubs={clubs}
      initialTotalCount={totalCount}
      initialClub={initialClub}
      initialClubDetail={initialClubDetail}
    />
  );
}
