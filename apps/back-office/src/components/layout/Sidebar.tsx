"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Building2,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  X,
} from "lucide-react";
import { useAdminRepositories } from "@heritage-dx/api";
import { Club } from "@/types";
import { ConfirmModal } from "@heritage-dx/ui";
import {
  INITIALS,
  getKoreanInitial,
  normalizeInitial,
  getRegionGroup,
  REGION_GROUPS,
} from "@heritage-dx/utils";
import { useData } from "@/contexts/DataContext";

type FilterMode = "initial" | "region" | null;

export default function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const { clubs: clubsAdmin } = useAdminRepositories();
  const router = useRouter();
  const pathname = usePathname();
  const { clubs, isLoadingClubs: isLoading, refreshClubs } = useData();

  // 검색 & 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(null);
  const [activeInitial, setActiveInitial] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // 선택 & 메뉴
  const [selectedClubCode, setSelectedClubCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpenCode, setMenuOpenCode] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 현재 경로에서 골프장 코드 추출
  useEffect(() => {
    const match = pathname.match(/\/clubs\/([^/]+)/);
    if (match) {
      setSelectedClubCode(match[1]);
    } else {
      setSelectedClubCode(null);
    }
  }, [pathname]);

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

    // 초성 필터
    if (filterMode === "initial" && activeInitial) {
      result = result.filter((club) => {
        return normalizeInitial(getKoreanInitial(club.name)) === activeInitial;
      });
    }

    // 지역 필터
    if (filterMode === "region" && activeRegion) {
      result = result.filter(
        (club) => club.region && getRegionGroup(club.region) === activeRegion
      );
    }

    // 검색어 필터
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(term) ||
          club.code.toLowerCase().includes(term) ||
          (club.region && club.region.toLowerCase().includes(term))
      );
    }

    // 가나다순 정렬
    return result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [clubs, filterMode, activeInitial, activeRegion, searchTerm]);

  // 초성 버튼 클릭
  const handleInitialClick = (initial: string) => {
    if (filterMode === "initial" && activeInitial === initial) {
      // 토글 해제
      setFilterMode(null);
      setActiveInitial(null);
    } else {
      setFilterMode("initial");
      setActiveInitial(initial);
      setActiveRegion(null);
    }
  };

  // 지역 버튼 클릭
  const handleRegionClick = (region: string) => {
    if (filterMode === "region" && activeRegion === region) {
      // 토글 해제
      setFilterMode(null);
      setActiveRegion(null);
    } else {
      setFilterMode("region");
      setActiveRegion(region);
      setActiveInitial(null);
    }
  };

  // 검색어 변경 시 필터 초기화
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setFilterMode(null);
      setActiveInitial(null);
      setActiveRegion(null);
    }
  };

  const handleClubSelect = (club: Club) => {
    router.push(`/clubs/${club.code}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await clubsAdmin.delete(deleteTarget.code);
      await refreshClubs();
      if (selectedClubCode === deleteTarget.code) {
        const remainingClubs = clubs.filter(
          (c) => c.code !== deleteTarget.code
        );
        if (remainingClubs.length > 0) {
          router.push(`/clubs/${remainingClubs[0].code}`);
        } else {
          router.push("/clubs/new");
        }
      }
    } catch (error) {
      console.error("Failed to delete club:", error);
      await refreshClubs();
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenCode(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">골프장</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/clubs/new"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="새 골프장 등록"
            >
              <Plus className="w-4 h-4" />
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="골프장 검색..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* 초성 필터 */}
        <div className="mb-2">
          <div className="text-[11px] text-gray-500 mb-1">가나다</div>
          <div className="flex flex-wrap gap-1">
            {INITIALS.map((initial) => {
              const isAvailable = availableInitials.has(initial);
              const isActive =
                filterMode === "initial" && activeInitial === initial;
              return (
                <button
                  key={initial}
                  onClick={() => isAvailable && handleInitialClick(initial)}
                  disabled={!isAvailable}
                  className={`w-[30px] h-7 text-xs rounded border transition-colors ${
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
          <div className="text-[11px] text-gray-500 mb-1">지역</div>
          <div className="flex flex-wrap gap-1">
            {REGION_GROUPS.map((group) => {
              const isAvailable = availableRegionGroups.has(group);
              const isActive =
                filterMode === "region" && activeRegion === group;
              return (
                <button
                  key={group}
                  onClick={() => isAvailable && handleRegionClick(group)}
                  disabled={!isAvailable}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
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

      {/* 골프장 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredClubs.length === 0 && !isLoading ? (
          <div className="px-4 py-8 text-sm text-gray-500 text-center">
            {searchTerm || filterMode
              ? "검색 결과가 없습니다"
              : "등록된 골프장이 없습니다"}
          </div>
        ) : (
          <>
            {filteredClubs.map((club) => (
              <div
                key={club.code}
                className={`relative group flex items-center border-l-2 ${
                  selectedClubCode === club.code
                    ? "bg-gray-50 border-l-gray-900"
                    : "border-l-transparent hover:bg-gray-50"
                }`}
              >
                <button
                  onClick={() => handleClubSelect(club)}
                  className="flex-1 px-4 py-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-medium ${
                        selectedClubCode === club.code
                          ? "text-gray-900"
                          : "text-gray-900"
                      }`}
                    >
                      {club.name}
                    </span>
                    {club.operationTypes?.map((type) => (
                      <span
                        key={type}
                        className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          type === "MEMBERSHIP"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {type === "MEMBERSHIP" ? "회원제" : "퍼블릭"}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {club.region || ""}
                  </div>
                </button>
                {/* 더보기 메뉴 */}
                <div
                  className="relative"
                  ref={menuOpenCode === club.code ? menuRef : null}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenCode(
                        menuOpenCode === club.code ? null : club.code
                      );
                    }}
                    className="p-2 mr-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {menuOpenCode === club.code && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenCode(null);
                          router.push(`/clubs/${club.code}?edit=true`);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenCode(null);
                          setDeleteTarget(club);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-end text-xs text-gray-500">
          <span>
            {filteredClubs.length}개 표시 / 총 {clubs.length}개
          </span>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="골프장 삭제"
        message={`"${deleteTarget?.name}" 골프장을 삭제하시겠습니까? 연결된 시나리오와 서류 정보도 함께 삭제됩니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />
    </aside>
  );
}
