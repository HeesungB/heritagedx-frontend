"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ClubProfile from "@/components/ClubProfile";
import MobileNavigation from "@/components/MobileNavigation";
import { Club, ClubDetail, ClubDetailResponse } from "@/types";

interface HomeClientProps {
  initialClubs: Club[];
  initialClub: Club | null;
  initialClubDetail: ClubDetail | null;
}

interface AppState {
  selectedClub: Club | null;
  clubDetail: ClubDetail | null;
  mobileView: "clubs" | "profile";
}

// Suspense로 감싸는 래퍼 컴포넌트
export default function HomeClient(props: HomeClientProps) {
  return (
    <Suspense fallback={<HomeClientLoading />}>
      <HomeClientInner {...props} />
    </Suspense>
  );
}

// 로딩 폴백 컴포넌트
function HomeClientLoading() {
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    </div>
  );
}

// 실제 로직을 담은 내부 컴포넌트
function HomeClientInner({
  initialClubs,
  initialClub,
  initialClubDetail,
}: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appState, setAppState] = useState<AppState>({
    selectedClub: initialClub,
    clubDetail: initialClubDetail,
    mobileView: "clubs",
  });
  const [detailLoading, setDetailLoading] = useState(false);

  // 브라우저 뒤로가기/앞으로가기 시 URL 변경 감지
  useEffect(() => {
    const urlClubCode = searchParams.get("club");

    // URL의 클럽 코드와 현재 선택된 클럽이 다르면 동기화
    if (urlClubCode && urlClubCode !== appState.selectedClub?.code) {
      const club = initialClubs.find((c) => c.code === urlClubCode);
      if (club) {
        setAppState((prev) => ({
          ...prev,
          selectedClub: club,
          clubDetail: null,
          mobileView: "profile",
        }));
      }
    } else if (!urlClubCode && initialClubs.length > 0) {
      // URL에 club 파라미터가 없으면 첫 번째 골프장으로 (초기 상태)
      const firstClub = initialClubs[0];
      if (appState.selectedClub?.code !== firstClub.code) {
        setAppState((prev) => ({
          ...prev,
          selectedClub: firstClub,
          clubDetail: null,
        }));
      }
    }
  }, [searchParams, initialClubs, appState.selectedClub?.code]);

  // 골프장 선택 변경 시 상세 정보 로드
  useEffect(() => {
    async function fetchClubDetail() {
      // 초기 데이터와 같은 골프장이면 스킵
      if (!appState.selectedClub) {
        return;
      }

      // 이미 같은 골프장의 상세 정보가 있으면 스킵
      if (appState.clubDetail?.code === appState.selectedClub.code) {
        return;
      }

      try {
        setDetailLoading(true);
        const response = await fetch(
          `https://api.heritage-dx.com/api/clubs/${appState.selectedClub.code}`
        );
        const data: ClubDetailResponse = await response.json();
        setAppState((prev) => ({ ...prev, clubDetail: data.data }));
      } catch (err) {
        console.error("상세 정보 로딩 실패:", err);
      } finally {
        setDetailLoading(false);
      }
    }

    fetchClubDetail();
  }, [appState.selectedClub?.code, appState.clubDetail?.code]);

  const handleClubSelect = (club: Club) => {
    // 같은 골프장 클릭 시 무시
    if (appState.selectedClub?.code === club.code) {
      return;
    }

    // URL 업데이트 (브라우저 히스토리에 추가)
    router.push(`/?club=${club.code}`, { scroll: false });

    setAppState((prev) => ({
      ...prev,
      selectedClub: club,
      clubDetail: null, // 새 골프장 선택 시 상세 정보 초기화
      mobileView: "profile",
    }));
  };

  const handleMobileViewChange = (view: "clubs" | "profile") => {
    setAppState((prev) => ({ ...prev, mobileView: view }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Header clubName={appState.clubDetail?.name || appState.selectedClub?.name || null} />

      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:flex flex-1 min-h-0 print:block print:min-h-0">
        {/* 왼쪽: 골프장 목록 */}
        <div className="h-full print:hidden">
          <ClubListSidebarWithData
            initialClubs={initialClubs}
            selectedClubCode={appState.selectedClub?.code || null}
            onClubSelect={handleClubSelect}
          />
        </div>

        {/* 오른쪽: 골프장 프로필 */}
        <ClubProfile detail={appState.clubDetail} loading={detailLoading} />
      </div>

      {/* 모바일 컨텐츠 */}
      <div className="lg:hidden flex-1 min-h-0 flex flex-col pb-16 print:hidden">
        {appState.mobileView === "clubs" && (
          <MobileClubList
            initialClubs={initialClubs}
            selectedClubCode={appState.selectedClub?.code || null}
            onClubSelect={handleClubSelect}
          />
        )}
        {appState.mobileView === "profile" && (
          <ClubProfile detail={appState.clubDetail} loading={detailLoading} />
        )}
      </div>

      {/* 모바일 네비게이션 */}
      <MobileNavigation
        currentView={appState.mobileView}
        onViewChange={handleMobileViewChange}
        hasSelectedClub={!!appState.selectedClub}
      />
    </div>
  );
}

// 초기 데이터를 받는 ClubListSidebar
function ClubListSidebarWithData({
  initialClubs,
  selectedClubCode,
  onClubSelect,
}: {
  initialClubs: Club[];
  selectedClubCode: string | null;
  onClubSelect: (club: Club) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = initialClubs.filter((club) => {
    const query = searchQuery.toLowerCase();
    return (
      club.name?.toLowerCase().includes(query) ||
      club.code?.toLowerCase().includes(query) ||
      club.region?.toLowerCase().includes(query)
    );
  });


  return (
    <aside className="w-64 h-full min-h-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold mb-3">골프장 목록</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="골프장명, 코드 또는 지역"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">검색 결과가 없습니다.</div>
        ) : (
          filteredClubs.map((club) => {
            const isSelected = selectedClubCode === club.code;
            return (
              <div
                key={club.code}
                onClick={() => onClubSelect(club)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>{club.name}</span>
                </div>
                <div className={`text-sm ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                  {club.code} · {club.region || "-"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// 모바일 골프장 리스트 컴포넌트
function MobileClubList({
  initialClubs,
  selectedClubCode,
  onClubSelect,
}: {
  initialClubs: Club[];
  selectedClubCode: string | null;
  onClubSelect: (club: Club) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = initialClubs.filter((club) => {
    const query = searchQuery.toLowerCase();
    return (
      club.name?.toLowerCase().includes(query) ||
      club.code?.toLowerCase().includes(query) ||
      club.region?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold mb-3">골프장 목록</h2>
        <input
          type="text"
          placeholder="골프장명, 코드 또는 지역"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.map((club) => (
          <div
            key={club.code}
            onClick={() => onClubSelect(club)}
            className={`p-4 border-b border-gray-100 cursor-pointer ${selectedClubCode === club.code ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
          >
            <div className="font-semibold">{club.name}</div>
            <div className={`text-sm ${selectedClubCode === club.code ? "text-gray-300" : "text-gray-500"}`}>
              {club.code} · {club.region || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

