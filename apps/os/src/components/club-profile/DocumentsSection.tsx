"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { ClubDetail, Document, GlobalDocument } from "@/types";

interface DocumentsSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  selectedDocIds: Set<string>;
  onSelectedDocIdsChange: (ids: Set<string>) => void;
  selectedScenarioCode: string | null;
  onSelectedScenarioCodeChange: (code: string | null) => void;
}

export default function DocumentsSection({
  detail,
  selectedMembershipIndex,
  selectedDocIds,
  onSelectedDocIdsChange,
  selectedScenarioCode,
  onSelectedScenarioCodeChange,
}: DocumentsSectionProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [printAllLoading, setPrintAllLoading] = useState(false);

  const toggleDocSelection = useCallback((docId: string) => {
    onSelectedDocIdsChange((() => {
      const next = new Set(selectedDocIds);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    })());
  }, [selectedDocIds, onSelectedDocIdsChange]);

  const toggleAllSelection = useCallback(
    (docs: (Document | GlobalDocument)[]) => {
      const validDocs = docs.filter((doc) => doc.downloadUrl);
      const allSelected = validDocs.every((doc) => selectedDocIds.has(doc.id));

      const next = new Set(selectedDocIds);
      if (allSelected) {
        validDocs.forEach((doc) => next.delete(doc.id));
      } else {
        validDocs.forEach((doc) => next.add(doc.id));
      }
      onSelectedDocIdsChange(next);
    },
    [selectedDocIds, onSelectedDocIdsChange]
  );

  const isUrlExpired = useCallback((doc: Document | GlobalDocument): boolean => {
    if (!doc.downloadUrlExpiresAt) return false;
    const expiresAt = new Date(doc.downloadUrlExpiresAt).getTime();
    return Date.now() > expiresAt;
  }, []);

  const getSelectedDocuments = useCallback((): (Document | GlobalDocument)[] => {
    const allDocs: (Document | GlobalDocument)[] = [];
    detail?.scenarios?.forEach((scenario) => {
      scenario.documentsLocal?.forEach((doc) => {
        if (selectedDocIds.has(doc.id)) {
          allDocs.push(doc);
        }
      });
    });
    detail?.documentsGlobal?.forEach((doc) => {
      if (selectedDocIds.has(doc.id)) {
        allDocs.push(doc);
      }
    });
    detail?.memberships?.forEach((membership) => {
      membership.documents?.forEach((doc) => {
        if (selectedDocIds.has(doc.id)) {
          allDocs.push({
            id: doc.id,
            name: doc.name,
            fileName: doc.fileName,
            fileDescription: doc.fileDescription,
            downloadUrl: doc.downloadUrl,
            downloadUrlExpiresAt: doc.downloadUrlExpiresAt,
          });
        }
      });
    });
    return allDocs;
  }, [detail?.scenarios, detail?.documentsGlobal, detail?.memberships, selectedDocIds]);

  const handleDownload = useCallback(
    async (doc: Document | GlobalDocument) => {
      if (!doc.downloadUrl) {
        alert("다운로드 URL이 없습니다.");
        return;
      }

      if (isUrlExpired(doc)) {
        alert("다운로드 링크가 만료되었습니다. 페이지를 새로고침해주세요.");
        return;
      }

      setDownloadingIds((prev) => new Set(prev).add(doc.id));

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
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      }
    },
    [isUrlExpired]
  );

  const handlePrintAllDocuments = useCallback(
    async (docs: (Document | GlobalDocument)[]) => {
      const docsWithUrl = docs.filter(
        (doc) => doc.downloadUrl && !isUrlExpired(doc)
      );

      if (docsWithUrl.length === 0) {
        alert("인쇄할 서류가 없습니다.");
        return;
      }

      setPrintAllLoading(true);

      try {
        const mergedPdf = await PDFDocument.create();

        for (const doc of docsWithUrl) {
          try {
            const response = await fetch(doc.downloadUrl!);
            if (!response.ok) continue;

            const pdfBytes = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(
              pdfDoc,
              pdfDoc.getPageIndices()
            );
            pages.forEach((page) => mergedPdf.addPage(page));
          } catch (error) {
            console.error(`${doc.name} PDF 로드 실패:`, error);
          }
        }

        if (mergedPdf.getPageCount() === 0) {
          alert("합칠 수 있는 PDF가 없습니다.");
          return;
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([new Uint8Array(mergedPdfBytes)], {
          type: "application/pdf",
        });
        const blobUrl = window.URL.createObjectURL(blob);

        const printWindow = window.open(blobUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }

        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 60000);
      } catch (error) {
        console.error("PDF 합치기 실패:", error);
        alert("PDF 합치기에 실패했습니다.");
      } finally {
        setPrintAllLoading(false);
      }
    },
    [isUrlExpired]
  );

  const getScenarioDisplayName = (code: string) => {
    const mapping: Record<string, string> = {
      PS_BASIC: "개인 양도",
      PB_BASIC: "개인 양수",
      CS_BASIC: "법인 양도",
      CB_BASIC: "법인 양수",
    };
    return mapping[code] || code;
  };

  const totalMembershipDocs =
    detail?.memberships?.reduce(
      (sum, m) => sum + (m.documents?.length || 0),
      0
    ) || 0;

  // 선택된 회원권
  const selectedMembership = detail.memberships?.[selectedMembershipIndex];

  return (
    <div className="space-y-6">
      {/* 선택된 서류 플로팅 액션 바 */}
      {selectedDocIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-gray-900 text-white rounded-lg p-3 flex items-center justify-between shadow-lg">
          <span className="text-sm font-medium">
            {selectedDocIds.size}개 서류 선택됨
          </span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const selectedDocs = getSelectedDocuments();
                for (const doc of selectedDocs) {
                  await handleDownload(doc);
                }
              }}
              disabled={downloadingIds.size > 0}
              className={`px-4 py-1.5 text-sm bg-white text-gray-900 rounded font-medium transition-colors ${
                downloadingIds.size > 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              {downloadingIds.size > 0
                ? "다운로드 중..."
                : "선택 다운로드"}
            </button>
            <button
              onClick={() =>
                handlePrintAllDocuments(getSelectedDocuments())
              }
              disabled={printAllLoading}
              className={`px-4 py-1.5 text-sm bg-white text-gray-900 rounded font-medium transition-colors ${
                printAllLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              {printAllLoading ? "인쇄 준비 중..." : "선택 인쇄"}
            </button>
            <button
              onClick={() => onSelectedDocIdsChange(new Set())}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 시나리오별 서류 */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="font-semibold text-gray-800">
              시나리오별 서류
            </h3>
          </div>
        </div>

        {detail.scenarios && detail.scenarios.length > 0 ? (
          <div>
            {/* 시나리오 선택 카드 그리드 */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {detail.scenarios.map((scenarioItem) => {
                const isSelected =
                  selectedScenarioCode ===
                  scenarioItem.scenario.scenarioCode;
                const code = scenarioItem.scenario.scenarioCode || "";
                const getColors = () => {
                  if (code.includes("PS"))
                    return {
                      border: "border-orange-300",
                      bg: "bg-orange-50",
                      hoverBg: "hover:bg-orange-100",
                      selected: "bg-orange-500 border-orange-500",
                      text: "text-orange-700",
                      selectedText: "text-white",
                    };
                  if (code.includes("PB"))
                    return {
                      border: "border-blue-300",
                      bg: "bg-blue-50",
                      hoverBg: "hover:bg-blue-100",
                      selected: "bg-blue-500 border-blue-500",
                      text: "text-blue-700",
                      selectedText: "text-white",
                    };
                  if (code.includes("CS"))
                    return {
                      border: "border-green-300",
                      bg: "bg-green-50",
                      hoverBg: "hover:bg-green-100",
                      selected: "bg-green-500 border-green-500",
                      text: "text-green-700",
                      selectedText: "text-white",
                    };
                  if (code.includes("CB"))
                    return {
                      border: "border-purple-300",
                      bg: "bg-purple-50",
                      hoverBg: "hover:bg-purple-100",
                      selected: "bg-purple-500 border-purple-500",
                      text: "text-purple-700",
                      selectedText: "text-white",
                    };
                  return {
                    border: "border-gray-300",
                    bg: "bg-gray-50",
                    hoverBg: "hover:bg-gray-100",
                    selected: "bg-gray-500 border-gray-500",
                    text: "text-gray-700",
                    selectedText: "text-white",
                  };
                };
                const colors = getColors();

                return (
                  <button
                    key={scenarioItem.scenario.scenarioCode}
                    onClick={() =>
                      onSelectedScenarioCodeChange(
                        isSelected
                          ? null
                          : scenarioItem.scenario.scenarioCode
                      )
                    }
                    className={`rounded-lg border-2 text-left transition-all overflow-hidden ${
                      isSelected
                        ? `${colors.selected} shadow-lg scale-[1.02]`
                        : `${colors.border} ${colors.bg} ${colors.hoverBg} hover:shadow-md`
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-sm ${
                            isSelected
                              ? colors.selectedText
                              : colors.text
                          }`}
                        >
                          {getScenarioDisplayName(
                            scenarioItem.scenario.scenarioCode || ""
                          )}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          {scenarioItem.documentsLocal?.length || 0}건
                        </span>
                      </div>
                      {isSelected && (
                        <div className="mt-1 text-xs text-white/70">
                          선택됨 ✓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 선택된 시나리오의 서류 목록 */}
            {selectedScenarioCode &&
              (() => {
                const selectedScenario = detail.scenarios?.find(
                  (s) =>
                    s.scenario.scenarioCode === selectedScenarioCode
                );
                if (!selectedScenario) return null;

                const validDocs =
                  selectedScenario.documentsLocal?.filter(
                    (d) => d.downloadUrl
                  ) || [];

                return (
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getScenarioDisplayName(selectedScenarioCode)}{" "}
                          - 기본
                        </h4>
                        <p className="text-sm text-gray-500">
                          이 시나리오에 필요한 서류를 선택하세요
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {validDocs.length > 0 && (
                          <button
                            onClick={() =>
                              toggleAllSelection(
                                selectedScenario.documentsLocal || []
                              )
                            }
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            {validDocs.every((d) =>
                              selectedDocIds.has(d.id)
                            )
                              ? "전체 해제"
                              : "전체 선택"}
                          </button>
                        )}
                        <span className="text-sm text-gray-500">
                          {selectedScenario.documentsLocal?.length || 0}
                          개 서류 연결됨
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedScenario.documentsLocal?.map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedDocIds.has(doc.id)
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                          onClick={() =>
                            doc.downloadUrl &&
                            !isUrlExpired(doc) &&
                            toggleDocSelection(doc.id)
                          }
                        >
                          <div className="flex items-center gap-3">
                            {doc.downloadUrl && !isUrlExpired(doc) ? (
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedDocIds.has(doc.id)
                                    ? "border-gray-900 bg-gray-900"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedDocIds.has(doc.id) && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-sm text-gray-900">
                                    {doc.name}
                                  </span>
                                  {doc.fileDescription &&
                                    doc.fileDescription !==
                                      doc.name && (
                                      <p className="text-xs text-gray-500">
                                        {doc.fileDescription}
                                      </p>
                                    )}
                                </div>
                                <span
                                  className={`text-xs ${
                                    doc.downloadUrl &&
                                    !isUrlExpired(doc)
                                      ? "text-green-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {doc.downloadUrl && !isUrlExpired(doc)
                                    ? "연결됨"
                                    : "미연결"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            {/* 시나리오 미선택 시 안내 */}
            {!selectedScenarioCode && (
              <div className="p-8 text-center text-gray-500 border-t border-gray-200">
                <p>시나리오를 선택하면 필요한 서류 목록이 표시됩니다</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            시나리오별 서류 정보가 없습니다.
          </div>
        )}
      </section>

      {/* 회원권별 서류 — 헤더에서 선택한 회원권 기반 */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <h3 className="font-semibold text-gray-800">
              회원권별 서류
            </h3>
            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
              {selectedMembership?.membershipName || selectedMembership?.membershipType || "회원권"}
            </span>
            {totalMembershipDocs > 0 && (
              <span className="text-sm text-gray-600">
                {totalMembershipDocs}건
              </span>
            )}
          </div>
        </div>

        {selectedMembership ? (
          <div>
            {(() => {
              const docs = selectedMembership.documents || [];

              if (docs.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-500">
                    <p>등록된 서류가 없습니다</p>
                  </div>
                );
              }

              return (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-700 font-medium">
                      {docs.length}개 서류
                    </span>
                    <button
                      onClick={() => {
                        const allSelected = docs.every((d) =>
                          selectedDocIds.has(d.id)
                        );
                        const next = new Set(selectedDocIds);
                        if (allSelected) {
                          docs.forEach((d) => next.delete(d.id));
                        } else {
                          docs.forEach((d) => next.add(d.id));
                        }
                        onSelectedDocIdsChange(next);
                      }}
                      className="text-xs text-gray-700 hover:text-gray-900"
                    >
                      {docs.every((d) => selectedDocIds.has(d.id))
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-3 border rounded bg-white cursor-pointer transition-colors ${
                          selectedDocIds.has(doc.id)
                            ? "border-gray-400 bg-gray-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleDocSelection(doc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedDocIds.has(doc.id)
                                ? "border-gray-700 bg-gray-700"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedDocIds.has(doc.id) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-sm text-gray-900">
                                  {doc.name}
                                </span>
                                {doc.fileDescription &&
                                  doc.fileDescription !== doc.name && (
                                    <p className="text-xs text-gray-500">
                                      {doc.fileDescription}
                                    </p>
                                  )}
                              </div>
                              <span className="text-xs text-gray-600">
                                {doc.fileName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-500 text-center py-4">
              회원권별 서류가 없습니다.
            </p>
          </div>
        )}
      </section>

      {/* 공용 서류함 */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-green-50 px-4 py-3 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <h3 className="font-semibold text-green-800">
                공용 서류함
              </h3>
              <span className="px-2 py-0.5 text-xs bg-green-200 text-green-700 rounded">
                전 골프장 공통
              </span>
              {detail.documentsGlobal &&
                detail.documentsGlobal.length > 0 && (
                  <span className="text-sm text-green-600">
                    {detail.documentsGlobal.length}건
                  </span>
                )}
            </div>
            {detail.documentsGlobal &&
              detail.documentsGlobal.filter((d) => d.downloadUrl)
                .length > 0 && (
                <button
                  onClick={() =>
                    toggleAllSelection(detail.documentsGlobal || [])
                  }
                  className="text-xs text-green-700 hover:text-green-900"
                >
                  {detail.documentsGlobal
                    .filter((d) => d.downloadUrl)
                    .every((d) => selectedDocIds.has(d.id))
                    ? "전체 해제"
                    : "전체 선택"}
                </button>
              )}
          </div>
        </div>
        <div className="p-4">
          {detail.documentsGlobal &&
          detail.documentsGlobal.length > 0 ? (
            <div className="space-y-2">
              {detail.documentsGlobal.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 border rounded bg-white cursor-pointer transition-colors ${
                    selectedDocIds.has(doc.id)
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    doc.downloadUrl &&
                    !isUrlExpired(doc) &&
                    toggleDocSelection(doc.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    {doc.downloadUrl && !isUrlExpired(doc) ? (
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedDocIds.has(doc.id)
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedDocIds.has(doc.id) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-gray-900">
                            {doc.name}
                          </span>
                          {doc.fileDescription &&
                            doc.fileDescription !== doc.name && (
                              <p className="text-xs text-gray-500">
                                {doc.fileDescription}
                              </p>
                            )}
                        </div>
                        <span
                          className={`text-xs ${
                            doc.downloadUrl && !isUrlExpired(doc)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {doc.downloadUrl && !isUrlExpired(doc)
                            ? "연결됨"
                            : "미연결"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              공용 서류가 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* 고객 구비서류 */}
      <section className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="font-semibold text-purple-800">
              고객 구비서류
            </h3>
            <span className="px-2 py-0.5 text-xs bg-purple-200 text-purple-700 rounded">
              고객이 직접 준비
            </span>
            {detail.documentsCustomer &&
              detail.documentsCustomer.length > 0 && (
                <span className="text-sm text-purple-600">
                  {detail.documentsCustomer.length}건
                </span>
              )}
          </div>
        </div>
        <div className="p-4">
          {detail.documentsCustomer &&
          detail.documentsCustomer.length > 0 ? (
            <div className="space-y-2">
              {detail.documentsCustomer.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-gray-200 rounded bg-white"
                >
                  <div>
                    <span className="font-medium text-sm text-gray-900">
                      {doc.name}
                    </span>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              고객 구비서류가 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
