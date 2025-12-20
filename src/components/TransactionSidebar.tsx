"use client";

import { useState, useEffect } from "react";
import {
  Document,
  DocumentsResponse,
  ScenarioMatchResponse,
  TransactionOptions,
} from "@/types";
import { fetchWithCache } from "@/utils/apiCache";

interface TransactionSidebarProps {
  clubCode: string | null;
  clubName: string | null;
}

export default function TransactionSidebar({ clubCode, clubName }: TransactionSidebarProps) {
  const [options, setOptions] = useState<TransactionOptions>({
    side: "Seller",
    ownerType: "Personal",
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [scenarioCode, setScenarioCode] = useState<string | null>(null);

  // 옵션 변경 시 시나리오 매칭 및 서류 로드
  useEffect(() => {
    async function fetchDocuments() {
      if (!clubCode || !options.side || !options.ownerType) {
        return;
      }

      try {
        setLoading(true);
        setMatchError(null);

        // 시나리오 매칭 API 호출
        const matchResponse = await fetch("https://api.heritage-dx.com/api/scenarios/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clubCode,
            side: options.side,
            ownerType: options.ownerType,
            hasProxy: false,
            isCertificateLost: false,
          }),
        });

        const matchData: ScenarioMatchResponse = await matchResponse.json();

        if (!matchData.success || !matchData.data.matched) {
          setMatchError("해당 조건에 맞는 시나리오가 없습니다.");
          setDocuments([]);
          setScenarioCode(null);
          return;
        }

        const matchedScenarioCode = matchData.data.scenario.scenarioCode;
        setScenarioCode(matchedScenarioCode);

        // 서류 목록 API 호출
        const docsData = await fetchWithCache<DocumentsResponse>(
          `https://api.heritage-dx.com/api/scenarios/${matchedScenarioCode}/documents?clubCode=${clubCode}&ownerType=${options.ownerType}`
        );

        setDocuments(docsData.data.documents);
      } catch (err) {
        console.error("서류 로딩 실패:", err);
        setMatchError("서류 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [clubCode, options.side, options.ownerType]);

  // 고객 준비 서류와 딜러 지참 서류 분리
  const customerDocs = documents.filter((d) => d.isMandatory);
  const dealerDocs = documents.filter((d) => !d.isMandatory);

  if (!clubCode) {
    return (
      <aside className="w-80 min-h-0 border-l border-gray-200 bg-white p-6 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">거래 전 준비</h2>
        <div className="text-center py-8 text-gray-500 text-sm">
          골프장을 선택해 주세요.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 min-h-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold mb-6">거래 전 준비</h2>

        {/* 거래 대상 */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">거래 대상</label>
          <div className="flex">
            <button
              onClick={() => setOptions((prev) => ({ ...prev, side: "Seller" }))}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                options.side === "Seller"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              양도인
            </button>
            <button
              onClick={() => setOptions((prev) => ({ ...prev, side: "Buyer" }))}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                options.side === "Buyer"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              양수인
            </button>
          </div>
        </div>

        {/* 명의자 유형 */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">명의자 유형</label>
          <div className="flex">
            <button
              onClick={() => setOptions((prev) => ({ ...prev, ownerType: "Personal" }))}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                options.ownerType === "Personal"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              개인
            </button>
            <button
              onClick={() => setOptions((prev) => ({ ...prev, ownerType: "Corporate" }))}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                options.ownerType === "Corporate"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              법인
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-4 text-gray-500 text-sm">서류 목록 로딩 중...</div>
        )}

        {/* 에러 메시지 */}
        {matchError && (
          <div className="bg-red-50 border border-red-200 p-3 mb-6 rounded">
            <p className="text-red-700 text-sm">{matchError}</p>
          </div>
        )}

        {/* 서류 목록 */}
        {!loading && !matchError && documents.length > 0 && (
          <>
            {/* 고객 준비 서류 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">① 고객 준비 서류</h3>
                <span className="text-sm text-gray-500">{customerDocs.length}건</span>
              </div>
              <div className="space-y-3">
                {customerDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border border-gray-200 rounded bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">
                        {doc.name} {doc.minCount}
                        {doc.unit}
                      </span>
                      {doc.notes && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                          {doc.notes === "Lost" ? "원본 필요" : doc.notes}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                        ↓ 다운로드
                      </button>
                      <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                        ⎙ 인쇄
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 딜러 지참 서류 */}
            {dealerDocs.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">② 딜러 지참 서류</h3>
                  <span className="text-sm text-gray-500">{dealerDocs.length}건</span>
                </div>
                <div className="space-y-3">
                  {dealerDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 border border-gray-200 rounded bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {doc.name} {doc.minCount}
                          {doc.unit}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-gray-900 text-white rounded">
                          다운로드+현본
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                          ↓ 다운로드
                        </button>
                        <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                          ⎙ 인쇄
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전체 체크리스트 인쇄 */}
            <button className="w-full py-3 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 mb-4">
              ⎙ 전체 체크리스트 인쇄
            </button>
            <p className="text-xs text-gray-500 text-center mb-6">
              고객용 / 딜러용 구분 출력 가능
            </p>
          </>
        )}

        {/* 고급 기능 */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-3">고급 기능</p>
          <button className="w-full py-3 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 transition-colors">
            이 거래를 자동 검증으로 이어서 보기
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            상세 입력, 서류 업로드, 자동 검증 및 최종 리포트 생성
          </p>
        </div>
      </div>
    </aside>
  );
}
