"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ClubProfile from "@/components/ClubProfile";
import TransactionSidebar from "@/components/TransactionSidebar";
import MobileNavigation from "@/components/MobileNavigation";
import { Club, ClubDetail, ClubDetailResponse } from "@/types";
import { fetchWithCache } from "@/utils/apiCache";

interface HomeClientProps {
  initialClubs: Club[];
  initialClub: Club | null;
  initialClubDetail: ClubDetail | null;
}

interface AppState {
  selectedClub: Club | null;
  clubDetail: ClubDetail | null;
  mobileView: "clubs" | "profile" | "transaction";
}

export default function HomeClient({
  initialClubs,
  initialClub,
  initialClubDetail,
}: HomeClientProps) {
  const [appState, setAppState] = useState<AppState>({
    selectedClub: initialClub,
    clubDetail: initialClubDetail,
    mobileView: "clubs",
  });
  const [detailLoading, setDetailLoading] = useState(false);

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
        const data = await fetchWithCache<ClubDetailResponse>(
          `https://api.heritage-dx.com/api/clubs/${appState.selectedClub.code}`
        );
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

    setAppState((prev) => ({
      ...prev,
      selectedClub: club,
      clubDetail: null, // 새 골프장 선택 시 상세 정보 초기화
      mobileView: "profile",
    }));
  };

  const handleMobileViewChange = (view: "clubs" | "profile" | "transaction") => {
    setAppState((prev) => ({ ...prev, mobileView: view }));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header clubName={appState.clubDetail?.name || appState.selectedClub?.name || null} />

      {/* 데스크탑 레이아웃 */}
      <div className="hidden lg:flex flex-1 min-h-0">
        {/* 왼쪽: 골프장 목록 */}
        <ClubListSidebarWithData
          initialClubs={initialClubs}
          selectedClubCode={appState.selectedClub?.code || null}
          onClubSelect={handleClubSelect}
        />

        {/* 가운데: 골프장 프로필 */}
        <ClubProfile detail={appState.clubDetail} loading={detailLoading} />

        {/* 오른쪽: 거래 전 준비 */}
        <TransactionSidebar
          clubCode={appState.selectedClub?.code || null}
          clubName={appState.clubDetail?.name || appState.selectedClub?.name || null}
        />
      </div>

      {/* 모바일 컨텐츠 */}
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden pb-16">
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
        {appState.mobileView === "transaction" && (
          <MobileTransactionPanel
            clubCode={appState.selectedClub?.code || null}
          />
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

  const getTradeStatus = (code: string): { label: string; type: "active" | "normal" | "low" } => {
    const hash = code.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    if (hash % 3 === 0) return { label: "거래 활발", type: "active" };
    if (hash % 3 === 1) return { label: "거래 보통", type: "normal" };
    return { label: "거래 적음", type: "low" };
  };

  const getBadgeStyle = (type: "active" | "normal" | "low", isSelected: boolean) => {
    if (isSelected) return "bg-white/20 text-white";
    switch (type) {
      case "active": return "bg-gray-900 text-white";
      case "normal": return "bg-gray-200 text-gray-700";
      case "low": return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <aside className="w-64 min-h-0 border-r border-gray-200 bg-white flex flex-col">
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
            const tradeStatus = getTradeStatus(club.code);
            return (
              <div
                key={club.code}
                onClick={() => onClubSelect(club)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>{club.name}</span>
                </div>
                <div className={`text-sm mb-2 ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                  {club.code} · {club.region || "-"}
                </div>
                <span className={`inline-block px-2 py-0.5 text-xs rounded ${getBadgeStyle(tradeStatus.type, isSelected)}`}>
                  {tradeStatus.type === "active" && "↗ "}
                  {tradeStatus.type === "normal" && "— "}
                  {tradeStatus.type === "low" && "↘ "}
                  {tradeStatus.label}
                </span>
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

// 모바일 거래 패널 컴포넌트
function MobileTransactionPanel({ clubCode }: { clubCode: string | null }) {
  const [options, setOptions] = useState<{ side: "Seller" | "Buyer"; ownerType: "Personal" | "Corporate" }>({
    side: "Seller",
    ownerType: "Personal",
  });
  const [documents, setDocuments] = useState<{ id: string; name: string; minCount: number; unit: string; isMandatory: boolean; notes: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDocuments() {
      if (!clubCode) return;
      try {
        setLoading(true);
        const matchResponse = await fetch("https://api.heritage-dx.com/api/scenarios/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clubCode,
            side: options.side,
            ownerType: options.ownerType,
            hasProxy: false,
          }),
        });
        const matchData = await matchResponse.json();
        if (matchData.success && matchData.data.matched) {
          const docsResponse = await fetchWithCache<{ data: { documents: typeof documents } }>(
            `https://api.heritage-dx.com/api/scenarios/${matchData.data.scenario.scenarioCode}/documents?clubCode=${clubCode}&ownerType=${options.ownerType}`
          );
          setDocuments(docsResponse.data.documents);
        }
      } catch (err) {
        console.error("서류 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, [clubCode, options]);

  if (!clubCode) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p className="text-gray-500">골프장을 선택해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold">거래 전 준비</h2>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">거래 대상</label>
          <div className="flex">
            <button
              onClick={() => setOptions((p) => ({ ...p, side: "Seller" }))}
              className={`flex-1 py-2 text-sm font-medium ${options.side === "Seller" ? "bg-gray-900 text-white" : "bg-white border border-gray-300"}`}
            >
              양도인
            </button>
            <button
              onClick={() => setOptions((p) => ({ ...p, side: "Buyer" }))}
              className={`flex-1 py-2 text-sm font-medium ${options.side === "Buyer" ? "bg-gray-900 text-white" : "bg-white border border-gray-300"}`}
            >
              양수인
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">명의자 유형</label>
          <div className="flex">
            <button
              onClick={() => setOptions((p) => ({ ...p, ownerType: "Personal" }))}
              className={`flex-1 py-2 text-sm font-medium ${options.ownerType === "Personal" ? "bg-gray-900 text-white" : "bg-white border border-gray-300"}`}
            >
              개인
            </button>
            <button
              onClick={() => setOptions((p) => ({ ...p, ownerType: "Corporate" }))}
              className={`flex-1 py-2 text-sm font-medium ${options.ownerType === "Corporate" ? "bg-gray-900 text-white" : "bg-white border border-gray-300"}`}
            >
              법인
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-4 text-gray-500">로딩 중...</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3 border border-gray-200 rounded">
                <div className="font-medium text-sm">{doc.name} {doc.minCount}{doc.unit}</div>
                <div className="text-xs text-gray-500 mt-1">{doc.isMandatory ? "필수" : "선택"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
