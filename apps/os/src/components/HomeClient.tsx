"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ClubProfile from "@/components/ClubProfile";
import ClubDirectory, {
  INITIALS,
  getKoreanInitial,
  normalizeInitial,
  getRegionGroup,
  REGION_GROUPS,
} from "@/components/ClubDirectory";
import MobileNavigation from "@/components/MobileNavigation";
import { Club, ClubDetail } from "@/types";
import { useAppStores } from "@/stores";
import { useClubs, useClubDetail } from "@heritage-dx/store";
import { Loading } from "@heritage-dx/ui";

interface HomeClientProps {
  initialClubs: Club[];
  initialTotalCount: number;
  initialClub: Club | null;
  initialClubDetail: ClubDetail | null;
}

export default function HomeClient({
  initialClubs,
  initialTotalCount,
  initialClub,
  initialClubDetail,
}: HomeClientProps) {
  const router = useRouter();
  const { club: clubStore } = useAppStores();

  // 서버 데이터로 스토어 초기화 (한 번만, useEffect에서 실행)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current && initialClubs.length > 0) {
      hydratedRef.current = true;
      clubStore.getState().hydrateClubs(initialClubs, initialTotalCount);
      if (initialClubDetail) {
        clubStore.getState().hydrateDetail(initialClubDetail.code, initialClubDetail);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 스토어에서 클럽 목록 조회 (이미 hydrate 되었으면 fetch 안 함)
  const { clubs, totalCount, isLoading: clubsLoading } = useClubs(clubStore);

  const [selectedClubCode, setSelectedClubCode] = useState<string | null>(
    initialClub?.code ?? null
  );
  const [mobileView, setMobileView] = useState<"clubs" | "profile">("clubs");

  // 스토어에서 클럽 상세 조회 (캐시 히트 시 즉시 반환)
  const { detail: clubDetail, isLoading: detailLoading } = useClubDetail(clubStore, selectedClubCode);

  const selectedClub = useMemo(
    () => clubs.find((c) => c.code === selectedClubCode) ?? null,
    [clubs, selectedClubCode]
  );

  // ref로 현재 clubs를 추적 (popstate 핸들러에서 사용)
  const clubsRef = useRef(clubs);
  clubsRef.current = clubs;

  // 브라우저 뒤로가기/앞으로가기 시 URL 변경 감지
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlClubCode = params.get("club");

      if (urlClubCode) {
        const club = clubsRef.current.find((c) => c.code === urlClubCode);
        if (club) {
          setSelectedClubCode(club.code);
          setMobileView("profile");
        }
      } else {
        setSelectedClubCode(null);
        setMobileView("clubs");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleClubSelect = useCallback((club: Club) => {
    if (selectedClubCode === club.code) return;
    router.push(`/clubs?club=${club.code}`, { scroll: false });
    setSelectedClubCode(club.code);
    setMobileView("profile");
  }, [selectedClubCode, router]);

  const handleMobileViewChange = (view: "clubs" | "profile") => {
    setMobileView(view);
  };

  const isDirectoryView = !selectedClub;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Header clubName={clubDetail?.name || selectedClub?.name || null} />

      {isDirectoryView ? (
        /* 디렉토리 뷰: 골프장 목록 전체 화면 */
        clubsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading text="골프장 목록 로딩 중..." />
          </div>
        ) : (
          <ClubDirectory clubs={clubs} totalCount={totalCount} onClubSelect={handleClubSelect} />
        )
      ) : (
        <>
          {/* 데스크탑 레이아웃 */}
          <div className="hidden lg:flex flex-1 min-h-0 print:block print:min-h-0">
            {/* 왼쪽: 골프장 목록 */}
            <div className="h-full print:hidden">
              <ClubListSidebarWithData
                initialClubs={clubs}
                totalCount={totalCount}
                selectedClubCode={selectedClubCode}
                onClubSelect={handleClubSelect}
              />
            </div>

            {/* 오른쪽: 골프장 프로필 + 메모 사이드바 */}
            <ClubProfile detail={clubDetail} loading={detailLoading} clubs={clubs} onClubNavigate={(code) => { const c = clubs.find(cl => cl.code === code); if (c) handleClubSelect(c); }} />
          </div>

          {/* 모바일 컨텐츠 */}
          <div className="lg:hidden flex-1 min-h-0 flex flex-col pb-16 print:hidden">
            {mobileView === "clubs" && (
              <MobileClubList
                initialClubs={clubs}
                totalCount={totalCount}
                selectedClubCode={selectedClubCode}
                onClubSelect={handleClubSelect}
              />
            )}
            {mobileView === "profile" && (
              <ClubProfile detail={clubDetail} loading={detailLoading} clubs={clubs} onClubNavigate={(code) => { const c = clubs.find(cl => cl.code === code); if (c) handleClubSelect(c); }} />
            )}
          </div>

          {/* 모바일 네비게이션 */}
          <MobileNavigation
            currentView={mobileView}
            onViewChange={handleMobileViewChange}
            hasSelectedClub={!!selectedClub}
          />
        </>
      )}
    </div>
  );
}

// 초기 데이터를 받는 ClubListSidebar
function ClubListSidebarWithData({
  initialClubs,
  totalCount,
  selectedClubCode,
  onClubSelect,
}: {
  initialClubs: Club[];
  totalCount: number;
  selectedClubCode: string | null;
  onClubSelect: (club: Club) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"initial" | "region" | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionGroups = useMemo(() => {
    const groupSet = new Set<string>();
    for (const club of initialClubs) {
      if (club.region) {
        const group = getRegionGroup(club.region);
        if (group) groupSet.add(group);
      }
    }
    return REGION_GROUPS.filter((g) => groupSet.has(g));
  }, [initialClubs]);

  const initialsWithClubs = useMemo(() => {
    const set = new Set<string>();
    for (const club of initialClubs) {
      set.add(normalizeInitial(getKoreanInitial(club.name)));
    }
    return set;
  }, [initialClubs]);

  const filteredClubs = useMemo(() => {
    let result = initialClubs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (club) =>
          club.name?.toLowerCase().includes(query) ||
          club.code?.toLowerCase().includes(query) ||
          club.region?.toLowerCase().includes(query)
      );
    }

    if (filterMode === "initial" && selectedInitial) {
      result = result.filter((club) => normalizeInitial(getKoreanInitial(club.name)) === selectedInitial);
    }

    if (filterMode === "region" && selectedRegion) {
      result = result.filter((club) => getRegionGroup(club.region) === selectedRegion);
    }

    const sorted = result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (selectedClubCode) {
      const idx = sorted.findIndex((c) => c.code === selectedClubCode);
      if (idx > 0) {
        const [selected] = sorted.splice(idx, 1);
        sorted.unshift(selected);
      }
    }
    return sorted;
  }, [initialClubs, searchQuery, filterMode, selectedInitial, selectedRegion, selectedClubCode]);

  const handleInitialClick = (initial: string) => {
    if (filterMode === "initial" && selectedInitial === initial) {
      setSelectedInitial(null);
      setFilterMode(null);
    } else {
      setSelectedInitial(initial);
      setSelectedRegion(null);
      setFilterMode("initial");
    }
  };

  const handleRegionClick = (region: string) => {
    if (filterMode === "region" && selectedRegion === region) {
      setSelectedRegion(null);
      setFilterMode(null);
    } else {
      setSelectedRegion(region);
      setSelectedInitial(null);
      setFilterMode("region");
    }
  };

  return (
    <aside className="w-64 h-full min-h-0 border-r border-gray-200 bg-white flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
            </svg>
            <span className="font-semibold text-gray-900">골프장</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="골프장 검색..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setFilterMode(null);
                setSelectedInitial(null);
                setSelectedRegion(null);
              }
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* 초성 필터 */}
        <div className="mb-2">
          <div className="text-[11px] text-gray-500 mb-1">가나다</div>
          <div className="flex flex-wrap gap-1">
            {INITIALS.map((initial) => {
              const hasClubs = initialsWithClubs.has(initial);
              const isActive = filterMode === "initial" && selectedInitial === initial;
              return (
                <button
                  key={initial}
                  onClick={() => handleInitialClick(initial)}
                  disabled={!hasClubs}
                  className={`w-[30px] h-7 text-xs rounded border transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : hasClubs
                        ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {initial}
                </button>
              );
            })}
          </div>
        </div>

        {/* 지역 필터 */}
        <div>
          <div className="text-[11px] text-gray-500 mb-1">지역</div>
          <div className="flex flex-wrap gap-1">
            {regionGroups.map((group) => {
              const isActive = filterMode === "region" && selectedRegion === group;
              return (
                <button
                  key={group}
                  onClick={() => handleRegionClick(group)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 골프장 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500 text-center">
            {searchQuery || filterMode ? "검색 결과가 없습니다" : "등록된 골프장이 없습니다"}
          </div>
        ) : (
          filteredClubs.map((club) => {
            const isSelected = selectedClubCode === club.code;
            return (
              <div
                key={club.code}
                onClick={() => onClubSelect(club)}
                className={`border-l-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-gray-50 border-l-gray-900"
                    : "border-l-transparent hover:bg-gray-50"
                }`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                      {club.name}
                    </span>
                  </div>
                  <div className={`text-xs ${isSelected ? "text-gray-500" : "text-gray-500"}`}>
                    {club.region}{club.holes ? ` · ${club.holes}` : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 정보 */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-end text-xs text-gray-500">
          <span>{filteredClubs.length}개 표시 / 총 {totalCount}개</span>
        </div>
      </div>
    </aside>
  );
}

// 모바일 골프장 리스트 컴포넌트
function MobileClubList({
  initialClubs,
  totalCount,
  selectedClubCode,
  onClubSelect,
}: {
  initialClubs: Club[];
  totalCount: number;
  selectedClubCode: string | null;
  onClubSelect: (club: Club) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"initial" | "region" | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionGroups = useMemo(() => {
    const groupSet = new Set<string>();
    for (const club of initialClubs) {
      if (club.region) {
        const group = getRegionGroup(club.region);
        if (group) groupSet.add(group);
      }
    }
    return REGION_GROUPS.filter((g) => groupSet.has(g));
  }, [initialClubs]);

  const initialsWithClubs = useMemo(() => {
    const set = new Set<string>();
    for (const club of initialClubs) {
      set.add(normalizeInitial(getKoreanInitial(club.name)));
    }
    return set;
  }, [initialClubs]);

  const filteredClubs = useMemo(() => {
    let result = initialClubs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (club) =>
          club.name?.toLowerCase().includes(query) ||
          club.code?.toLowerCase().includes(query) ||
          club.region?.toLowerCase().includes(query)
      );
    }

    if (filterMode === "initial" && selectedInitial) {
      result = result.filter((club) => normalizeInitial(getKoreanInitial(club.name)) === selectedInitial);
    }

    if (filterMode === "region" && selectedRegion) {
      result = result.filter((club) => getRegionGroup(club.region) === selectedRegion);
    }

    const sorted = result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    if (selectedClubCode) {
      const idx = sorted.findIndex((c) => c.code === selectedClubCode);
      if (idx > 0) {
        const [selected] = sorted.splice(idx, 1);
        sorted.unshift(selected);
      }
    }
    return sorted;
  }, [initialClubs, searchQuery, filterMode, selectedInitial, selectedRegion, selectedClubCode]);

  const handleInitialClick = (initial: string) => {
    if (filterMode === "initial" && selectedInitial === initial) {
      setSelectedInitial(null);
      setFilterMode(null);
    } else {
      setSelectedInitial(initial);
      setSelectedRegion(null);
      setFilterMode("initial");
    }
  };

  const handleRegionClick = (region: string) => {
    if (filterMode === "region" && selectedRegion === region) {
      setSelectedRegion(null);
      setFilterMode(null);
    } else {
      setSelectedRegion(region);
      setSelectedInitial(null);
      setFilterMode("region");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
            </svg>
            <span className="text-lg font-bold text-gray-900">골프장</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="골프장 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* 초성 필터 */}
        <div className="mb-2">
          <div className="text-[11px] text-gray-500 mb-1">가나다</div>
          <div className="flex flex-wrap gap-1">
            {INITIALS.map((initial) => {
              const hasClubs = initialsWithClubs.has(initial);
              const isActive = filterMode === "initial" && selectedInitial === initial;
              return (
                <button
                  key={initial}
                  onClick={() => handleInitialClick(initial)}
                  disabled={!hasClubs}
                  className={`${initial === "0-9" ? "px-2" : "w-8"} h-8 rounded text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : hasClubs
                        ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {initial}
                </button>
              );
            })}
          </div>
        </div>

        {/* 지역 필터 */}
        <div>
          <div className="text-[11px] text-gray-500 mb-1">지역</div>
          <div className="flex flex-wrap gap-1">
            {regionGroups.map((group) => {
              const isActive = filterMode === "region" && selectedRegion === group;
              return (
                <button
                  key={group}
                  onClick={() => handleRegionClick(group)}
                  className={`px-2.5 py-1 rounded text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 골프장 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500 text-center">
            {searchQuery || filterMode ? "검색 결과가 없습니다" : "등록된 골프장이 없습니다"}
          </div>
        ) : (
          filteredClubs.map((club) => {
            const isSelected = selectedClubCode === club.code;
            return (
              <div
                key={club.code}
                onClick={() => onClubSelect(club)}
                className={`border-l-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-gray-50 border-l-gray-900"
                    : "border-l-transparent hover:bg-gray-50"
                }`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-900"}`}>
                      {club.name}
                    </span>
                  </div>
                  <div className={`text-xs ${isSelected ? "text-gray-500" : "text-gray-500"}`}>
                    {club.region}{club.holes ? ` · ${club.holes}` : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
