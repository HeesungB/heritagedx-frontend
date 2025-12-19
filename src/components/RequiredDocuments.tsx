"use client";

import { useState, useEffect } from "react";
import { Document, DocumentsResponse, DocumentsScenario, DocumentsClub, DocumentsSummary } from "@/types";
import { fetchWithCache } from "@/utils/apiCache";

interface RequiredDocumentsProps {
  clubCode: string;
  scenarioCode: string;
  ownerType: string;
  onConfirm: () => void;
  onPreviousStep: () => void;
  onReset: () => void;
}

export default function RequiredDocuments({
  clubCode,
  scenarioCode,
  ownerType,
  onConfirm,
  onPreviousStep,
  onReset,
}: RequiredDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [scenario, setScenario] = useState<DocumentsScenario | null>(null);
  const [club, setClub] = useState<DocumentsClub | null>(null);
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("mandatory");

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        const data = await fetchWithCache<DocumentsResponse>(
          `https://api.heritage-dx.com/api/scenarios/${scenarioCode}/documents?clubCode=${clubCode}&ownerType=${ownerType}`
        );
        setDocuments(data.data.documents);
        setScenario(data.data.scenario);
        setClub(data.data.club);
        setSummary(data.data.summary);
      } catch (err) {
        console.error("서류 목록 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    if (clubCode && scenarioCode && ownerType) {
      fetchDocuments();
    }
  }, [clubCode, scenarioCode, ownerType]);

  // 정렬된 서류 목록
  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === "mandatory") {
      if (a.isMandatory !== b.isMandatory) {
        return a.isMandatory ? -1 : 1;
      }
    }
    return a.displayOrder - b.displayOrder;
  });

  const mandatoryDocs = documents.filter((d) => d.isMandatory);
  const conditionalDocs = documents.filter((d) => !d.isMandatory);

  if (loading) {
    return (
      <div className="border border-gray-300 rounded p-6">
        <div className="text-center py-8 text-gray-500">서류 목록 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded p-6">
      {/* 상단 요약 정보 */}
      <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 mb-1">대상 골프장</p>
          <p className="font-bold text-lg">{club?.name}</p>
          <p className="text-sm text-gray-500">({clubCode})</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">거래 유형</p>
          <p className="font-bold text-lg">{scenario?.scenarioCode}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">거래 조건</p>
          <p className="font-medium">{scenario?.name}</p>
        </div>
      </div>

      {/* 필수 서류 목록 헤더 */}
      <h2 className="text-xl font-semibold mb-4">필수 서류 목록</h2>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 border border-gray-900 font-semibold">
            규칙 엔진 출력
          </button>
          <span className="px-3 py-1 bg-gray-100 border border-gray-300 text-sm">
            핵심 자동화 엔진 (L1-L3)
          </span>
        </div>
        <span className="text-gray-500 text-sm">자동 생성</span>
      </div>

      {/* 요약 박스 */}
      <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
        <p className="font-semibold mb-2">
          필수 {mandatoryDocs.length}건 / 조건부 {conditionalDocs.length}건
        </p>
        <p className="text-gray-600">거래 유형 확정 완료</p>
        <p className="text-gray-600">다음: 서류 업로드</p>
      </div>

      {/* 전체 설명 */}
      <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
        <p className="font-semibold mb-2">전체</p>
        <p className="text-gray-600 text-sm mb-1">전체 항목 규칙 범위 내</p>
        <p className="text-gray-600 text-sm">거래 유형 기준 서류 자동 생성</p>
      </div>

      {/* 정렬 및 전체 건수 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span>정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="mandatory">필수 먼저</option>
            <option value="order">순서대로</option>
          </select>
        </div>
        <span className="text-gray-600">전체: {summary?.totalDocuments}건</span>
      </div>

      {/* 서류 테이블 */}
      <div className="border border-gray-300 rounded overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="w-10 px-2 py-3"></th>
              <th className="text-left px-4 py-3 font-semibold">코드</th>
              <th className="text-left px-4 py-3 font-semibold">서류명</th>
              <th className="text-center px-4 py-3 font-semibold">필수여부</th>
              <th className="text-left px-4 py-3 font-semibold">조건</th>
              <th className="text-left px-4 py-3 font-semibold">클럽별 요건</th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
              >
                <td className="px-2 py-4 text-center text-gray-400">
                  <span className="cursor-pointer">›</span>
                </td>
                <td className="px-4 py-4 font-mono text-sm">{doc.docCode}</td>
                <td className="px-4 py-4">
                  {doc.name} {doc.minCount}{doc.unit}
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`px-3 py-1 text-sm ${
                      doc.isMandatory
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {doc.isMandatory ? "필수" : "조건부"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {doc.condition || "모든 건"}
                </td>
                <td className="px-4 py-4">
                  {doc.clubRequirement && (
                    <span className="px-3 py-1 border border-gray-300 text-sm">
                      {doc.clubRequirement}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="my-6" />

      {/* 하단 액션 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={onPreviousStep}
            className="px-6 py-3 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            ← 이전 단계
          </button>
          <button
            onClick={onReset}
            className="px-6 py-3 border border-gray-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            초기화
          </button>
        </div>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          서류 확인 완료 및 단계 4 진행 →
        </button>
      </div>
    </div>
  );
}
