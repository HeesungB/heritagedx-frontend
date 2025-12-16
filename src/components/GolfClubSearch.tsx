"use client";

import { useState, useEffect, useRef } from "react";
import SearchInput from "./SearchInput";
import GolfClubTable from "./GolfClubTable";
import GolfClubDetail from "./GolfClubDetail";
import OperatorNotice from "./OperatorNotice";
import { Club, ClubsResponse, ClubDetail, ClubDetailResponse } from "@/types";
import { fetchWithCache } from "@/utils/apiCache";

interface GolfClubSearchProps {
  onClubConfirm: (club: Club, detail: ClubDetail) => void;
}

export default function GolfClubSearch({ onClubConfirm }: GolfClubSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchClubs() {
      try {
        setLoading(true);
        const data = await fetchWithCache<ClubsResponse>(
          "https://api.heritage-dx.com/api/clubs"
        );
        setClubs(data.data.clubs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchClubs();
  }, []);

  useEffect(() => {
    async function fetchClubDetail() {
      if (!selectedCode) {
        setClubDetail(null);
        return;
      }

      try {
        setDetailLoading(true);
        const data = await fetchWithCache<ClubDetailResponse>(
          `https://api.heritage-dx.com/api/clubs/${selectedCode}`
        );
        setClubDetail(data.data);

        // 디테일 섹션으로 스크롤 이동
        setTimeout(() => {
          detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } catch (err) {
        console.error("상세 정보 로딩 실패:", err);
        setClubDetail(null);
      } finally {
        setDetailLoading(false);
      }
    }

    fetchClubDetail();
  }, [selectedCode]);

  const filteredClubs = clubs.filter((club) => {
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
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
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
            />
          )}
        </div>
      )}
    </div>
  );
}
