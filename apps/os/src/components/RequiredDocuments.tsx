"use client";

import { useState, useCallback } from "react";
import {
  Document,
  DocumentsScenario,
  DocumentsClub,
  DocumentsSummary,
} from "@/types";
import { useScenarioDocuments, isDocumentExpired, isDocumentDownloadable } from "@heritage-dx/store";
import {
  downloadDocument,
  downloadDocuments,
  printDocumentInIframe,
} from "@/utils/documentDownload";

// 다운로드 아이콘 컴포넌트
function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// 프린트 아이콘 컴포넌트
function PrintIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

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
  const { data: docsData, isLoading: loading } = useScenarioDocuments(scenarioCode, clubCode, ownerType);
  const documents = docsData.documents as unknown as Document[];
  const scenario = docsData.scenario as DocumentsScenario | null;
  const club = docsData.club as DocumentsClub | null;
  const summary = docsData.summary as unknown as DocumentsSummary | null;
  const [sortBy, setSortBy] = useState<string>("mandatory");
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);

  // 파일 다운로드 핸들러 - blob 방식으로 실제 다운로드
  const handleDownload = useCallback(
    async (doc: Document) => {
      if (!doc.downloadUrl) {
        alert("다운로드 URL이 없습니다.");
        return;
      }

      // URL 만료 체크
      if (isDocumentExpired(doc)) {
        alert("다운로드 링크가 만료되었습니다. 페이지를 새로고침해주세요.");
        return;
      }

      setDownloadingIds((prev) => new Set(prev).add(doc.id));

      try {
        await downloadDocument(
          doc.downloadUrl,
          doc.fileName || doc.name || "document.pdf",
        );
      } catch (error) {
        console.error("다운로드 에러:", error);
        window.open(doc.downloadUrl, "_blank");
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      }
    },
    []
  );

  // 파일 프린트 핸들러 - iframe 사용
  const handlePrint = useCallback(
    (doc: Document) => {
      if (!doc.downloadUrl) {
        alert("프린트할 파일 URL이 없습니다.");
        return;
      }

      // URL 만료 체크
      if (isDocumentExpired(doc)) {
        alert("프린트 링크가 만료되었습니다. 페이지를 새로고침해주세요.");
        return;
      }

      printDocumentInIframe(doc.downloadUrl, () =>
        window.open(doc.downloadUrl ?? undefined, "_blank"),
      );
    },
    []
  );

  // 전체 다운로드 핸들러 - blob 방식으로 순차 다운로드
  const handleDownloadAll = useCallback(async () => {
    const downloadableDocs = documents.filter((doc) => isDocumentDownloadable(doc));
    if (downloadableDocs.length === 0) {
      alert("다운로드할 문서가 없습니다.");
      return;
    }

    setDownloadAllLoading(true);

    await downloadDocuments(
      downloadableDocs.map((doc) => ({
        downloadUrl: doc.downloadUrl!,
        filename: doc.fileName || doc.name || "document.pdf",
      })),
    );

    setDownloadAllLoading(false);
  }, [documents]);

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
        <div className="text-center py-8 text-gray-500">
          서류 목록 로딩 중...
        </div>
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            disabled={downloadAllLoading}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 transition-colors text-sm ${
              downloadAllLoading
                ? "bg-gray-100 cursor-not-allowed"
                : "hover:bg-gray-50"
            }`}
          >
            {downloadAllLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <DownloadIcon />
            )}
            {downloadAllLoading ? "다운로드 중..." : "전체 다운로드"}
          </button>
          <span className="text-gray-500 text-sm">자동 생성</span>
        </div>
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
              <th className="text-left px-4 py-3 font-semibold">서류명</th>
              <th className="text-center px-4 py-3 font-semibold">필수여부</th>
              <th className="text-center px-4 py-3 font-semibold">
                다운로드/프린트
              </th>
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
                <td className="px-4 py-4">
                  {doc.name} {doc.minCount}
                  {doc.unit}
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
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {doc.downloadUrl ? (
                      isDocumentExpired(doc) ? (
                        <span className="text-red-500 text-xs">만료됨</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingIds.has(doc.id)}
                            className={`p-2 border border-gray-300 rounded transition-colors ${
                              downloadingIds.has(doc.id)
                                ? "bg-gray-100 cursor-not-allowed"
                                : "hover:bg-gray-100"
                            }`}
                            title="다운로드"
                          >
                            {downloadingIds.has(doc.id) ? (
                              <span className="animate-spin text-xs">⏳</span>
                            ) : (
                              <DownloadIcon />
                            )}
                          </button>
                          <button
                            onClick={() => handlePrint(doc)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            title="프린트"
                          >
                            <PrintIcon />
                          </button>
                        </>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>
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
