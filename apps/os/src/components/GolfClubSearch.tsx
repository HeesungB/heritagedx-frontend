"use client";

import { useState, useRef } from "react";
import SearchInput from "./SearchInput";
import GolfClubTable from "./GolfClubTable";
import GolfClubDetail from "./GolfClubDetail";
import OperatorNotice from "./OperatorNotice";
import { Club, ClubDetail } from "@/types";
import { useAppStores } from "@/stores";
import { useClubs, useClubDetail } from "@heritage-dx/store";
import { Loading } from "@heritage-dx/ui";

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
