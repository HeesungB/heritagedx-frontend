"use client";

import { useState, useEffect, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
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
    hasProxy: false,
    isCertificateLost: false,
    isFamily: false,
    requiresTaxInvoice: false,
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [scenarioCode, setScenarioCode] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

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
            hasProxy: options.hasProxy,
            isCertificateLost: options.isCertificateLost,
            isFamily: options.isFamily,
            requiresTaxInvoice: options.requiresTaxInvoice,
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
  }, [clubCode, options.side, options.ownerType, options.hasProxy, options.isCertificateLost, options.isFamily, options.requiresTaxInvoice]);

  // URL 만료 여부 체크
  const isUrlExpired = useCallback((doc: Document): boolean => {
    if (!doc.downloadUrlExpiresAt) return false;
    const expiresAt = new Date(doc.downloadUrlExpiresAt).getTime();
    return Date.now() > expiresAt;
  }, []);

  // 파일 다운로드 핸들러
  const handleDownload = useCallback(async (doc: Document) => {
    if (!doc.downloadUrl) {
      alert("다운로드 URL이 없습니다.");
      return;
    }

    if (isUrlExpired(doc)) {
      alert("다운로드 링크가 만료되었습니다. 페이지를 새로고침해주세요.");
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(doc.id));

    try {
      const response = await fetch(doc.downloadUrl);
      if (!response.ok) throw new Error(`다운로드 실패: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = doc.fileName || doc.name || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("다운로드 에러:", error);
      window.open(doc.downloadUrl, "_blank");
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  }, [isUrlExpired]);

  // 파일 프린트 핸들러 - blob URL 방식으로 새 창에서 인쇄
  const handlePrint = useCallback(async (doc: Document) => {
    if (!doc.downloadUrl) {
      alert("프린트할 파일 URL이 없습니다.");
      return;
    }

    if (isUrlExpired(doc)) {
      alert("프린트 링크가 만료되었습니다. 페이지를 새로고침해주세요.");
      return;
    }

    try {
      // PDF를 fetch하여 blob으로 변환
      const response = await fetch(doc.downloadUrl);
      if (!response.ok) throw new Error("파일 로드 실패");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 새 창에서 열고 인쇄
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // 일정 시간 후 blob URL 해제
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error("프린트 에러:", error);
      // 실패 시 새 탭에서 열기
      window.open(doc.downloadUrl, "_blank");
    }
  }, [isUrlExpired]);

  // 고객 준비 서류와 딜러 지참 서류 분리
  const customerDocs = documents.filter((d) => d.isMandatory);
  const dealerDocs = documents.filter((d) => !d.isMandatory);

  // 전체 서류 인쇄 로딩 상태
  const [printAllLoading, setPrintAllLoading] = useState(false);

  // 전체 서류 인쇄 핸들러 - 모든 PDF를 합쳐서 인쇄
  const handlePrintAllDocuments = useCallback(async () => {
    const docsWithUrl = documents.filter(doc => doc.downloadUrl && !isUrlExpired(doc));

    if (docsWithUrl.length === 0) {
      alert("인쇄할 서류가 없습니다.");
      return;
    }

    setPrintAllLoading(true);

    try {
      // 새 PDF 문서 생성
      const mergedPdf = await PDFDocument.create();

      // 각 PDF를 순차적으로 가져와서 합치기
      for (const doc of docsWithUrl) {
        try {
          const response = await fetch(doc.downloadUrl!);
          if (!response.ok) continue;

          const pdfBytes = await response.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } catch (error) {
          console.error(`${doc.name} PDF 로드 실패:`, error);
        }
      }

      if (mergedPdf.getPageCount() === 0) {
        alert("합칠 수 있는 PDF가 없습니다.");
        return;
      }

      // 합쳐진 PDF를 blob으로 변환
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      // 새 탭에서 열어서 인쇄
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      // 일정 시간 후 blob URL 해제
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error("PDF 합치기 실패:", error);
      alert("PDF 합치기에 실패했습니다.");
    } finally {
      setPrintAllLoading(false);
    }
  }, [documents, isUrlExpired]);

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

        {/* 추가 옵션 체크박스 */}
        <div className="mb-6 space-y-3">
          <label className="block text-sm text-gray-600 mb-2">추가 옵션</label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.hasProxy}
              onChange={(e) => setOptions((prev) => ({ ...prev, hasProxy: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">대리인 거래</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.isCertificateLost}
              onChange={(e) => setOptions((prev) => ({ ...prev, isCertificateLost: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">증권 분실</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.isFamily}
              onChange={(e) => setOptions((prev) => ({ ...prev, isFamily: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">가족간 거래</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.requiresTaxInvoice}
              onChange={(e) => setOptions((prev) => ({ ...prev, requiresTaxInvoice: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">세금계산서 필요</span>
          </label>
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
                    {doc.downloadUrl && !isUrlExpired(doc) ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingIds.has(doc.id)}
                          className={`px-3 py-1 text-xs border border-gray-300 rounded transition-colors ${
                            downloadingIds.has(doc.id) ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
                          }`}
                        >
                          {downloadingIds.has(doc.id) ? "⏳" : "↓"} 다운로드
                        </button>
                        <button
                          onClick={() => handlePrint(doc)}
                          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          ⎙ 인쇄
                        </button>
                      </div>
                    ) : doc.downloadUrl && isUrlExpired(doc) ? (
                      <span className="text-xs text-red-500">링크 만료됨</span>
                    ) : (
                      <span className="text-xs text-gray-400">다운로드 불가</span>
                    )}
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
                      {doc.downloadUrl && !isUrlExpired(doc) ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingIds.has(doc.id)}
                            className={`px-3 py-1 text-xs border border-gray-300 rounded transition-colors ${
                              downloadingIds.has(doc.id) ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
                            }`}
                          >
                            {downloadingIds.has(doc.id) ? "⏳" : "↓"} 다운로드
                          </button>
                          <button
                            onClick={() => handlePrint(doc)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          >
                            ⎙ 인쇄
                          </button>
                        </div>
                      ) : doc.downloadUrl && isUrlExpired(doc) ? (
                        <span className="text-xs text-red-500">링크 만료됨</span>
                      ) : (
                        <span className="text-xs text-gray-400">다운로드 불가</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전체 서류 인쇄 */}
            <button
              onClick={handlePrintAllDocuments}
              disabled={printAllLoading}
              className={`w-full py-3 border border-gray-300 rounded text-sm font-medium mb-4 transition-colors ${
                printAllLoading ? "bg-gray-100 cursor-not-allowed" : "hover:bg-gray-50"
              }`}
            >
              {printAllLoading ? "⏳ PDF 합치는 중..." : "⎙ 전체 서류 인쇄"}
            </button>
            <p className="text-xs text-gray-500 text-center mb-6">
              모든 서류를 하나의 PDF로 합쳐서 인쇄
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
