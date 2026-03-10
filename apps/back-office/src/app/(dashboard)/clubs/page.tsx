"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Building2, Loader2, Plus, MapPin, Flag } from "lucide-react";
import {
  INITIALS,
  getKoreanInitial,
  normalizeInitial,
  getRegionGroup,
  REGION_GROUPS,
} from "@heritage-dx/utils";
import { useData } from "@/contexts/DataContext";

type FilterMode = "initial" | "region" | null;

export default function ClubDirectoryPage() {
  const router = useRouter();
  const { clubs, isLoadingClubs: isLoading } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(null);
  const [activeInitial, setActiveInitial] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // 실제 클럽이 존재하는 광역 그룹 Set
  const availableRegionGroups = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((club) => {
      if (club.region) {
        const group = getRegionGroup(club.region);
        if (group) set.add(group);
      }
    });
    return set;
  }, [clubs]);

  // 실제 클럽이 존재하는 초성 Set
  const availableInitials = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((club) => {
      const initial = normalizeInitial(getKoreanInitial(club.name));
      if (initial !== "#") {
        set.add(initial);
      }
    });
    return set;
  }, [clubs]);

  // 필터 + 검색 적용 후 결과
  const filteredClubs = useMemo(() => {
    let result = clubs;

    if (filterMode === "initial" && activeInitial) {
      result = result.filter(
        (club) => normalizeInitial(getKoreanInitial(club.name)) === activeInitial
      );
    }

    if (filterMode === "region" && activeRegion) {
      result = result.filter(
        (club) => club.region && getRegionGroup(club.region) === activeRegion
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(term) ||
          club.code.toLowerCase().includes(term) ||
          (club.region && club.region.toLowerCase().includes(term))
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [clubs, filterMode, activeInitial, activeRegion, searchTerm]);

  const handleInitialClick = (initial: string) => {
    if (filterMode === "initial" && activeInitial === initial) {
      setFilterMode(null);
      setActiveInitial(null);
    } else {
      setFilterMode("initial");
      setActiveInitial(initial);
      setActiveRegion(null);
    }
  };

  const handleRegionClick = (region: string) => {
    if (filterMode === "region" && activeRegion === region) {
      setFilterMode(null);
      setActiveRegion(null);
    } else {
      setFilterMode("region");
      setActiveRegion(region);
      setActiveInitial(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setFilterMode(null);
      setActiveInitial(null);
      setActiveRegion(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">골프장 목록</h1>
            {!isLoading && (
              <span className="text-sm text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-full">
                {clubs.length}개
              </span>
            )}
          </div>
          <Link
            href="/clubs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 골프장 등록
          </Link>
        </div>

        {/* 검색바 */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="골프장명, 코드, 지역으로 검색..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
          />
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5 shadow-sm">
          {/* 초성 필터 */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-2">가나다</div>
            <div className="flex flex-wrap gap-1.5">
              {INITIALS.map((initial) => {
                const isAvailable = availableInitials.has(initial);
                const isActive =
                  filterMode === "initial" && activeInitial === initial;
                return (
                  <button
                    key={initial}
                    onClick={() => isAvailable && handleInitialClick(initial)}
                    disabled={!isAvailable}
                    className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : isAvailable
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
              {REGION_GROUPS.map((group) => {
                const isAvailable = availableRegionGroups.has(group);
                const isActive =
                  filterMode === "region" && activeRegion === group;
                return (
                  <button
                    key={group}
                    onClick={() => isAvailable && handleRegionClick(group)}
                    disabled={!isAvailable}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : isAvailable
                          ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                          : "border-gray-100 text-gray-300 cursor-not-allowed"
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
            {filteredClubs.length}개 표시 / 총 {clubs.length}개
          </span>
          {(filterMode || searchTerm.trim()) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterMode(null);
                setActiveInitial(null);
                setActiveRegion(null);
              }}
              className="text-sm text-primary hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">골프장을 불러오는 중...</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && filteredClubs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Building2 className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">
              {searchTerm || filterMode
                ? "검색 결과가 없습니다"
                : "등록된 골프장이 없습니다"}
            </p>
            {!searchTerm && !filterMode && (
              <Link
                href="/clubs/new"
                className="mt-3 text-sm text-primary hover:underline"
              >
                새 골프장 등록하기
              </Link>
            )}
          </div>
        )}

        {/* 클럽 그리드 */}
        {!isLoading && filteredClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClubs.map((club) => (
              <button
                key={club.code}
                onClick={() => router.push(`/clubs/${club.code}`)}
                className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {club.name}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {club.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {club.region}
                    </span>
                  )}
                  {club.holes && (
                    <span className="flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5" />
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
