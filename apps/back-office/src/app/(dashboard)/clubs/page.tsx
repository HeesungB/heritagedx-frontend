"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getKoreanInitial,
  getRegionGroup,
  normalizeInitial,
} from "@heritage-dx/utils";
import { useTopClubs } from "@heritage-dx/store";
import { useData } from "@/contexts/DataContext";
import {
  ClubBrowserPanel,
  type ClubCardEntity,
  ClubEmptyState,
  ClubFilterRows,
  ClubGrid,
  ClubsPageHeading,
  ClubSearchBar,
  FavoriteRecentStrip,
} from "@/components/clubs";

type FilterMode = "initial" | "region" | null;

export default function ClubDirectoryPage() {
  const router = useRouter();
  const { clubs, isLoadingClubs: isLoading } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(null);
  const [activeInitial, setActiveInitial] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const availableRegionGroups = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((club) => {
      const effective = club.region || "";
      if (!effective) return;
      const group = getRegionGroup(effective);
      if (group) set.add(group);
    });
    return set;
  }, [clubs]);

  const availableInitials = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((club) => {
      const initial = normalizeInitial(getKoreanInitial(club.name));
      if (initial !== "#") set.add(initial);
    });
    return set;
  }, [clubs]);

  const filteredClubs = useMemo<ClubCardEntity[]>(() => {
    let result = clubs;

    if (filterMode === "initial" && activeInitial) {
      result = result.filter(
        (club) => normalizeInitial(getKoreanInitial(club.name)) === activeInitial,
      );
    }
    if (filterMode === "region" && activeRegion) {
      result = result.filter(
        (club) => getRegionGroup(club.region || "") === activeRegion,
      );
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(term) ||
          club.code.toLowerCase().includes(term) ||
          (club.region && club.region.toLowerCase().includes(term)),
      );
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [clubs, filterMode, activeInitial, activeRegion, searchTerm]);

  const { topClubCodes, isFavorite, toggleFavorite, trackSelection } = useTopClubs(
    clubs,
    8,
  );

  const topClubs = useMemo<ClubCardEntity[]>(() => {
    const byCode = new Map(clubs.map((c) => [c.code, c]));
    return topClubCodes
      .map((code) => byCode.get(code))
      .filter((c): c is (typeof clubs)[number] => Boolean(c));
  }, [clubs, topClubCodes]);

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

  const handleRegionClick = (region: string | null) => {
    if (region === null) {
      setFilterMode(null);
      setActiveRegion(null);
      setActiveInitial(null);
      return;
    }
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

  const handleCardClick = (club: ClubCardEntity) => {
    trackSelection({
      code: club.code,
      name: club.name,
      region: club.region ?? undefined,
      holes: club.holes ?? undefined,
    });
    router.push(`/clubs/${club.code}`);
  };

  const handleToggleFavorite = (club: ClubCardEntity) => {
    toggleFavorite(club.code, {
      name: club.name,
      region: club.region ?? undefined,
      holes: club.holes ?? undefined,
    });
  };

  const filterActive = filterMode !== null || searchTerm.trim().length > 0;
  const resetFilters = () => {
    setSearchTerm("");
    setFilterMode(null);
    setActiveInitial(null);
    setActiveRegion(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-7 md:px-10 py-7 pb-12">
      <div className="max-w-[1280px] mx-auto">
        <ClubsPageHeading totalCount={isLoading ? undefined : clubs.length} />

        <ClubBrowserPanel>
          <ClubSearchBar value={searchTerm} onChange={handleSearchChange} />
          <ClubFilterRows
            activeRegion={activeRegion}
            availableRegions={availableRegionGroups}
            onRegionClick={handleRegionClick}
            activeInitial={activeInitial}
            availableInitials={availableInitials}
            onInitialClick={handleInitialClick}
          />

          {isLoading ? (
            <ClubEmptyState mode="loading" />
          ) : (
            <>
              <FavoriteRecentStrip
                clubs={topClubs}
                isFavorite={isFavorite}
                onCardClick={handleCardClick}
                onToggleFavorite={handleToggleFavorite}
              />
              <ClubGrid
                clubs={filteredClubs}
                isFavorite={isFavorite}
                onCardClick={handleCardClick}
                onToggleFavorite={handleToggleFavorite}
                count={filteredClubs.length}
                metaLabel="최근 업데이트순"
                rightSlot={
                  filterActive ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11.5px] text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline cursor-pointer"
                    >
                      필터 초기화
                    </button>
                  ) : null
                }
                emptyState={
                  clubs.length === 0 ? (
                    <ClubEmptyState mode="no-clubs" />
                  ) : (
                    <ClubEmptyState mode="no-results" />
                  )
                }
              />
            </>
          )}
        </ClubBrowserPanel>
      </div>
    </div>
  );
}
