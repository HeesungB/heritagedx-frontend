"use client";

import { useState, useMemo } from "react";
import { Club } from "@/types";

interface ClubDirectoryProps {
  clubs: Club[];
  totalCount: number;
  onClubSelect: (club: Club) => void;
}

export const INITIALS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ",
  "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
  "0-9",
];

const ALL_INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

export function getKoreanInitial(str: string): string {
  const ch = str.charAt(0);
  if (ch >= "0" && ch <= "9") return "0-9";
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "#";
  return ALL_INITIALS[Math.floor(code / 588)];
}

export function normalizeInitial(initial: string): string {
  const map: Record<string, string> = { "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ" };
  return map[initial] || initial;
}

// "충남 아산시" → "충남"
export function getProvince(region: string): string {
  return region.split(" ")[0] || region;
}

// 권역 그룹 정의 (표시 순서대로)
export const REGION_GROUPS = ["수도권", "강원도", "충청도", "전라도", "경상도", "제주도"] as const;

// 시/도 → 권역 매핑
const PROVINCE_TO_GROUP: Record<string, string> = {
  서울: "수도권", 경기: "수도권", 인천: "수도권",
  강원: "강원도",
  충북: "충청도", 충남: "충청도", 대전: "충청도", 세종: "충청도",
  전북: "전라도", 전남: "전라도", 광주: "전라도",
  경북: "경상도", 경남: "경상도", 부산: "경상도", 대구: "경상도", 울산: "경상도",
  제주: "제주도",
};

export function getRegionGroup(region: string): string | undefined {
  const province = getProvince(region);
  return PROVINCE_TO_GROUP[province];
}

export default function ClubDirectory({ clubs, totalCount, onClubSelect }: ClubDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // 필터 모드: null(없음), "initial"(가나다), "region"(지역) — 배타적
  const [filterMode, setFilterMode] = useState<"initial" | "region" | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // 골프장이 존재하는 권역만 표시
  const regionGroups = useMemo(() => {
    const groupSet = new Set<string>();
    for (const club of clubs) {
      if (club.region) {
        const group = getRegionGroup(club.region);
        if (group) groupSet.add(group);
      }
    }
    return REGION_GROUPS.filter((g) => groupSet.has(g));
  }, [clubs]);

  // 각 초성에 해당하는 골프장이 있는지 확인
  const initialsWithClubs = useMemo(() => {
    const set = new Set<string>();
    for (const club of clubs) {
      const raw = getKoreanInitial(club.name);
      set.add(normalizeInitial(raw));
    }
    return set;
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    let result = clubs;

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
      result = result.filter((club) => {
        const raw = getKoreanInitial(club.name);
        return normalizeInitial(raw) === selectedInitial;
      });
    }

    if (filterMode === "region" && selectedRegion) {
      result = result.filter((club) => getRegionGroup(club.region) === selectedRegion);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [clubs, searchQuery, filterMode, selectedInitial, selectedRegion]);

  const handleInitialClick = (initial: string) => {
    if (filterMode === "initial" && selectedInitial === initial) {
      // 같은 초성 다시 클릭 → 해제
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

  const hasActiveFilter = filterMode !== null || !!searchQuery.trim();

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterMode(null);
    setSelectedInitial(null);
    setSelectedRegion(null);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900">골프장 목록</h2>
          <span className="text-sm text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-full">
            {totalCount}개
          </span>
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="골프장명, 코드, 지역으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
          />
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5 shadow-sm">
          {/* 초성 필터 */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-2">가나다</div>
            <div className="flex flex-wrap gap-1.5">
              {INITIALS.map((initial) => {
                const hasClubs = initialsWithClubs.has(initial);
                const isActive = filterMode === "initial" && selectedInitial === initial;
                return (
                  <button
                    key={initial}
                    onClick={() => handleInitialClick(initial)}
                    disabled={!hasClubs}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
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
            <div className="text-xs font-medium text-gray-500 mb-2">지역</div>
            <div className="flex flex-wrap gap-1.5">
              {regionGroups.map((group) => {
                const isActive = filterMode === "region" && selectedRegion === group;
                return (
                  <button
                    key={group}
                    onClick={() => handleRegionClick(group)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
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

        {/* 결과 카운트 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {filteredClubs.length}개 표시 / 총 {totalCount}개
          </span>
          {hasActiveFilter && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-900 hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 카드 그리드 */}
        {filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
            </svg>
            <p className="text-sm">
              {hasActiveFilter ? "검색 결과가 없습니다" : "등록된 골프장이 없습니다"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <button
                key={club.code}
                onClick={() => onClubSelect(club)}
                className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {club.name}
                  </h3>
                  {club.operationTypes?.map((type) => (
                    <span
                      key={type}
                      className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${
                        type === "MEMBERSHIP"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {type === "MEMBERSHIP" ? "회원제" : type === "PUBLIC" ? "퍼블릭" : type}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {club.region && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {club.region}
                    </span>
                  )}
                  {club.holes && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                      </svg>
                      {club.holes}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
