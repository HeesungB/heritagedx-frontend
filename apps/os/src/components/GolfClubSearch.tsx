"use client";

import { useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import SearchInput from "./SearchInput";
import GolfClubTable from "./GolfClubTable";
import GolfClubDetail from "./GolfClubDetail";
import OperatorNotice from "./OperatorNotice";
import { Club, ClubDetail } from "@/types";
import { useAppStores } from "@/stores";
import { useClubs, useClubDetail, useTopClubs } from "@heritage-dx/store";
import { Loading } from "@heritage-dx/ui";
import { trackEvent } from "@/lib/gtag";

interface GolfClubSearchProps {
  onClubConfirm: (club: Club, detail: ClubDetail) => void;
  onReset: () => void;
}

export default function GolfClubSearch({ onClubConfirm, onReset }: GolfClubSearchProps) {
  const { club: clubStore } = useAppStores();
  const { clubs, isLoading: loading } = useClubs(clubStore);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const { detail: clubDetail, isLoading: detailLoading } = useClubDetail(clubStore, selectedCode);

  const detailRef = useRef<HTMLDivElement>(null);

  const { topClubCodes, isFavorite, toggleFavorite, trackSelection } =
    useTopClubs(clubs, 5);
  const topClubs = useMemo(() => {
    const byCode = new Map(clubs.map((c) => [c.code, c]));
    return topClubCodes
      .map((code) => byCode.get(code))
      .filter((c): c is Club => Boolean(c));
  }, [clubs, topClubCodes]);

  const filteredClubs = clubs.filter((club) => {
    if (!club.name?.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      club.name?.toLowerCase().includes(query) ||
      club.code?.toLowerCase().includes(query) ||
      club.region?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (club: Club) => {
    setSelectedClub(club);
    setSelectedCode(club.code);
    trackSelection({ code: club.code, name: club.name });
    trackEvent("club_search", { club_name: club.name });
    // 디테일 섹션으로 스크롤 이동
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleConfirm = () => {
    if (selectedClub && clubDetail) {
      onClubConfirm(selectedClub, clubDetail);
    }
  };

  return (
    <div className="border border-gray-300 rounded p-6">
      <h2 className="text-xl font-semibold mb-4">골프장 검색·선택</h2>

      <div className="inline-block px-4 py-2 bg-gray-100 border border-gray-300 mb-6">
        사용자 입력 대상
      </div>

      <h3 className="font-semibold mb-3">골프장명·코드·지역 검색</h3>

      <div className="mb-6">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {!searchQuery && topClubs.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" strokeWidth={1.8} />
            <span className="text-sm font-semibold text-gray-700">즐겨찾기 · 최근</span>
            <span className="text-xs text-gray-400">{topClubs.length}건</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topClubs.map((club) => {
              const fav = isFavorite(club.code);
              return (
                <div
                  key={`top-${club.code}`}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1 py-1 text-sm hover:border-gray-300 hover:bg-white"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(club)}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    {club.name}
                    {club.region && (
                      <span className="ml-1.5 text-xs text-gray-400">{club.region}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(club.code, {
                        name: club.name,
                        region: club.region,
                        holes: club.holes,
                      });
                    }}
                    title={fav ? "즐겨찾기 해제" : "즐겨찾기"}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        fav ? "fill-amber-400 stroke-amber-500" : "stroke-gray-300"
                      }`}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><Loading text="로딩 중..." /></div>
      ) : (
        <GolfClubTable
          clubs={filteredClubs}
          selectedCode={selectedCode}
          onSelect={handleSelect}
        />
      )}

      <OperatorNotice />

      {selectedCode && (
        <div ref={detailRef}>
          {clubDetail && (
            <GolfClubDetail
              detail={clubDetail}
              loading={detailLoading}
              onConfirm={handleConfirm}
              onReset={onReset}
            />
          )}
        </div>
      )}
    </div>
  );
}

