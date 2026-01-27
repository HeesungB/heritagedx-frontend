"use client";

import { useState, useEffect, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { ClubDetail, Document, CustomFieldValue } from "@/types";
import MembershipCalculator from "./MembershipCalculator";
import TaxGuideModal from "./TaxGuideModal";
import MembershipInfoSheet from "./MembershipInfoSheet";

interface ClubProfileProps {
  detail: ClubDetail | null;
  loading: boolean;
}

type ProfileTab = "basic" | "infoSheet" | "fee" | "documents";

export default function ClubProfile({ detail, loading }: ClubProfileProps) {
  // 모든 hooks는 early return 전에 선언되어야 합니다
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [printAllLoading, setPrintAllLoading] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedScenarioCode, setSelectedScenarioCode] = useState<string | null>(null);

  // 회원권 시트 입력 필드 상태
  const [sheetRecipient, setSheetRecipient] = useState("");
  const [sheetBenefits, setSheetBenefits] = useState("");
  const [sheetMarketNote, setSheetMarketNote] = useState("");
  const [sheetNotes, setSheetNotes] = useState("");
  const [sheetManagerName, setSheetManagerName] = useState("");
  const [sheetManagerTitle, setSheetManagerTitle] = useState("");
  const [sheetManagerPhone, setSheetManagerPhone] = useState("");

  // 체크박스 토글
  const toggleDocSelection = useCallback((docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  // 전체 선택/해제
  const toggleAllSelection = useCallback((docs: Document[]) => {
    const validDocs = docs.filter(doc => doc.downloadUrl);
    const allSelected = validDocs.every(doc => selectedDocIds.has(doc.id));

    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        validDocs.forEach(doc => next.delete(doc.id));
      } else {
        validDocs.forEach(doc => next.add(doc.id));
      }
      return next;
    });
  }, [selectedDocIds]);

  // 선택된 서류 가져오기
  const getSelectedDocuments = useCallback((): Document[] => {
    const allDocs: Document[] = [];
    // detail.scenarios에서 documentsLocal 수집
    detail?.scenarios?.forEach(scenario => {
      scenario.documentsLocal?.forEach(doc => {
        if (selectedDocIds.has(doc.id)) {
          allDocs.push(doc);
        }
      });
    });
    // documentsGlobal에서도 수집
    detail?.documentsGlobal?.forEach(doc => {
      if (selectedDocIds.has(doc.id)) {
        allDocs.push(doc);
      }
    });
    return allDocs;
  }, [detail?.scenarios, detail?.documentsGlobal, selectedDocIds]);

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

  // 파일 프린트 핸들러
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
      const response = await fetch(doc.downloadUrl);
      if (!response.ok) throw new Error("파일 로드 실패");

      const blob = await response.blob();
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
      console.error("프린트 에러:", error);
      window.open(doc.downloadUrl, "_blank");
    }
  }, [isUrlExpired]);

  // 전체 서류 인쇄 핸들러
  const handlePrintAllDocuments = useCallback(async (docs: Document[]) => {
    const docsWithUrl = docs.filter(doc => doc.downloadUrl && !isUrlExpired(doc));

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

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
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
  }, [isUrlExpired]);

  // 시나리오 이름 매핑
  const getScenarioDisplayName = useCallback((code: string) => {
    const mapping: Record<string, string> = {
      PS_BASIC: "개인 양도",
      PB_BASIC: "개인 양수",
      CS_BASIC: "법인 양도",
      CB_BASIC: "법인 양수",
    };
    return mapping[code] || code;
  }, []);

  // 골프장 변경 시 선택 초기화
  useEffect(() => {
    setSelectedDocIds(new Set());
    setSelectedScenarioCode(null);
  }, [detail?.code]);

  // Early returns - 모든 hooks 이후에 위치
  if (loading) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">
            골프장 정보 로딩 중...
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">
            골프장을 선택해 주세요.
          </div>
        </div>
      </div>
    );
  }

  // 일반 변수들 (hooks 아님)
  const primaryContact =
    detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];
  const bankAccount = detail.bankAccounts?.[0];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatCurrency = (amount?: number | object | null) => {
    if (!amount) return "-";
    if (typeof amount === "object") {
      const values = Object.values(amount).filter((v) => typeof v === "number");
      if (values.length > 0) {
        return values.map((v) => `${(v as number).toLocaleString()}원`).join(" / ");
      }
      return "-";
    }
    return `${amount.toLocaleString()}원`;
  };

  const formatPriceString = (priceStr?: string | null) => {
    if (!priceStr) return "-";
    if (priceStr.includes("원")) return priceStr;
    const numMatch = priceStr.match(/[\d,]+/);
    if (numMatch) {
      const num = parseInt(numMatch[0].replace(/,/g, ""), 10);
      if (!isNaN(num)) {
        return `${num.toLocaleString("ko-KR")}원`;
      }
    }
    return priceStr;
  };

  const tabs = [
    { id: "basic" as ProfileTab, label: "기본 정보" },
    { id: "infoSheet" as ProfileTab, label: "회원권 시트" },
    { id: "fee" as ProfileTab, label: "수수료/비용" },
    { id: "documents" as ProfileTab, label: "서류" },
  ];

  return (
    <div className="flex-1 min-h-0 p-6 bg-gray-50 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      <div className="bg-white rounded-lg border border-gray-200 print:border-0 print:rounded-none">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">{detail.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <span className="px-2 py-0.5 bg-gray-100 rounded">
                  {detail.code}
                </span>
                <span>·</span>
                <span>{detail.region}</span>
                {detail.holes && (
                  <>
                    <span>·</span>
                    <span>{detail.holes}</span>
                  </>
                )}
                {detail.memberCount && (
                  <>
                    <span>·</span>
                    <span>회원 {detail.memberCount}</span>
                  </>
                )}
              </div>
            </div>
            {detail.updatedAt && (
              <div className="text-xs text-gray-400">
                최종 업데이트:{" "}
                {new Date(detail.updatedAt).toLocaleDateString("ko-KR")}
              </div>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 print:hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === "basic" && (
            <div className="space-y-4">
              {/* 1. 골프장 정보 */}
              <CollapsibleSection title="골프장 정보" icon={SectionIcons.club} defaultOpen={true}>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">골프장명</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{detail.name || "-"}</td>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">회 사 명</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">-</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">코스규모</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{detail.holes || "-"}</td>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">회 원 수</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{detail.memberCount || "-"}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">위 치</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{detail.address || detail.region || "-"}</td>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">전화번호</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        {primaryContact?.phoneNumber ? (
                          <a href={`tel:${primaryContact.phoneNumber}`} className="text-blue-600 hover:underline">
                            {primaryContact.phoneNumber}
                          </a>
                        ) : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">홈페이지</td>
                      <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm">
                        {detail.externalUrl ? (
                          <a href={detail.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {detail.externalUrl}
                          </a>
                        ) : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CollapsibleSection>

              {/* 2. 회원권 정보 */}
              {detail.memberships && detail.memberships.length > 0 && (
                <MembershipInfoSection memberships={detail.memberships} memo={detail.memo} />
              )}

              {/* 3. 부가 정보 (커스텀 필드) */}
              {detail.customFields && Object.keys(detail.customFields).length > 0 && (
                <CustomFieldsSection customFields={detail.customFields} />
              )}

              {/* 5. 예약 안내 */}
              {detail.reservationNotes && (
                <CollapsibleSection title="예약 안내" icon={SectionIcons.reservation} defaultOpen={true}>
                  <div className="p-4">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm">
                      {detail.reservationNotes}
                    </p>
                  </div>
                </CollapsibleSection>
              )}

              {/* 6. 추가 부가 정보 (특이사항) - Collapsible 아님 */}
              {detail.memo && (
                <section className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">특이 사항</h3>
                  <p className="text-gray-800 whitespace-pre-wrap text-sm">
                    {detail.memo}
                  </p>
                </section>
              )}

            </div>
          )}

          {activeTab === "infoSheet" && (
            <div className="space-y-6">
              {/* 입력 필드 섹션 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:hidden">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  추가 정보 입력
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 수신자 정보 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">수신자 (귀중)</label>
                    <input
                      type="text"
                      value={sheetRecipient}
                      onChange={(e) => setSheetRecipient(e.target.value)}
                      placeholder="예: 수산    (주)한아 귀중"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* 회원 혜택 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">회원 혜택</label>
                    <textarea
                      value={sheetBenefits}
                      onChange={(e) => setSheetBenefits(e.target.value)}
                      placeholder="예: - 월 주중 8회 주말 7회 우선예약"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>

                  {/* 시세 메모 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">시세 메모</label>
                    <input
                      type="text"
                      value={sheetMarketNote}
                      onChange={(e) => setSheetMarketNote(e.target.value)}
                      placeholder="예: *현재 시장가: 3억 4,000만원"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  {/* 기타 사항 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">기타 사항</label>
                    <textarea
                      value={sheetNotes}
                      onChange={(e) => setSheetNotes(e.target.value)}
                      placeholder="추가로 기재할 내용을 입력하세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>

                  {/* 담당자 정보 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름</label>
                    <input
                      type="text"
                      value={sheetManagerName}
                      onChange={(e) => setSheetManagerName(e.target.value)}
                      placeholder="김민정"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자 직책</label>
                    <input
                      type="text"
                      value={sheetManagerTitle}
                      onChange={(e) => setSheetManagerTitle(e.target.value)}
                      placeholder="팀장"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자 연락처</label>
                    <input
                      type="text"
                      value={sheetManagerPhone}
                      onChange={(e) => setSheetManagerPhone(e.target.value)}
                      placeholder="연락처"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 미리보기 구분선 */}
              <div className="flex items-center gap-4 print:hidden">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500 font-medium">미리보기</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* 회원권 시트 */}
              <MembershipInfoSheet
                detail={detail}
                recipient={sheetRecipient || undefined}
                benefits={sheetBenefits || undefined}
                marketNote={sheetMarketNote || undefined}
                notes={sheetNotes ? [sheetNotes] : (detail.memo ? [detail.memo] : undefined)}
                managerName={sheetManagerName || "김민정"}
                managerTitle={sheetManagerTitle || "팀장"}
                managerPhone={sheetManagerPhone || undefined}
              />

              {/* 인쇄 버튼 */}
              <div className="flex justify-center gap-4 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  인쇄하기
                </button>
              </div>
            </div>
          )}

          {activeTab === "fee" && (
            <div className="space-y-6">
              {/* 이용 비용 - membership에서 가져옴 */}
              {detail.memberships && detail.memberships.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                    이용 비용
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GreenFeeField label="평일 그린피" data={detail.memberships[0].weekdayGreenFee} />
                    <GreenFeeField label="주말 그린피" data={detail.memberships[0].weekendGreenFee} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InfoField
                      label="캐디피"
                      value={formatCurrency(detail.memberships[0].caddyFee)}
                    />
                    <InfoField
                      label="카트피"
                      value={formatCurrency(detail.memberships[0].cartFee)}
                    />
                  </div>
                </section>
              )}

              {/* 명의변경 관련 비용 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                  명의변경 관련 비용
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField
                    label="명의변경 관련 비용"
                    value={detail.transferFee}
                    highlight
                  />
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      입금 계좌
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
                      {bankAccount ? (
                        <div>
                          {bankAccount.bankName && (
                            <span>{bankAccount.bankName} </span>
                          )}
                          <span className="font-mono">
                            {bankAccount.accountNumber}
                          </span>
                          {bankAccount.accountHolder && (
                            <span> ({bankAccount.accountHolder})</span>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 세무/행정 정보 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                  세무/행정 정보
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <InfoField
                    label="관할 세무서"
                    value={detail.taxOfficial}
                    fullWidth
                  />
                </div>
              </section>

              {/* 회원권 비용 계산기 */}
              <section>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                  회원권 거래 비용 시뮬레이션
                </h3>
                <MembershipCalculator
                  transferFee={detail.transferFee}
                  recentMarketPrice={detail.memberships?.[0]?.recentMarketPrice}
                  onShowTaxGuide={() => setShowTaxGuide(true)}
                />
              </section>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* 선택된 서류 플로팅 액션 바 */}
              {selectedDocIds.size > 0 && (
                <div className="sticky top-0 z-10 bg-gray-900 text-white rounded-lg p-3 flex items-center justify-between shadow-lg">
                  <span className="text-sm font-medium">{selectedDocIds.size}개 서류 선택됨</span>
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
                        downloadingIds.size > 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                      }`}
                    >
                      {downloadingIds.size > 0 ? "다운로드 중..." : "선택 다운로드"}
                    </button>
                    <button
                      onClick={() => handlePrintAllDocuments(getSelectedDocuments())}
                      disabled={printAllLoading}
                      className={`px-4 py-1.5 text-sm bg-white text-gray-900 rounded font-medium transition-colors ${
                        printAllLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                      }`}
                    >
                      {printAllLoading ? "인쇄 준비 중..." : "선택 인쇄"}
                    </button>
                    <button
                      onClick={() => setSelectedDocIds(new Set())}
                      className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
              )}

              {/* 고객 구비서류 - 맨 상단, 다운로드/인쇄 없음 */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="font-semibold text-purple-800">고객 구비서류</h3>
                    <span className="px-2 py-0.5 text-xs bg-purple-200 text-purple-700 rounded">고객이 직접 준비</span>
                    {detail.documentsCustomer && detail.documentsCustomer.length > 0 && (
                      <span className="text-sm text-purple-600">{detail.documentsCustomer.length}건</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {detail.documentsCustomer && detail.documentsCustomer.length > 0 ? (
                    <div className="space-y-2">
                      {detail.documentsCustomer.map((doc) => (
                        <div key={doc.id} className="p-3 border border-gray-200 rounded bg-white">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                              {doc.minCount && doc.unit && (
                                <span className="text-sm text-gray-500 ml-2">
                                  {doc.minCount}{doc.unit}
                                </span>
                              )}
                              {doc.notes && (
                                <p className="text-xs text-gray-500 mt-1">{doc.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.isMandatory ? (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">필수</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">선택</span>
                              )}
                            </div>
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

              {/* 공용 서류함 */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <h3 className="font-semibold text-green-800">공용 서류함</h3>
                      <span className="px-2 py-0.5 text-xs bg-green-200 text-green-700 rounded">전 골프장 공통</span>
                      {detail.documentsGlobal && detail.documentsGlobal.length > 0 && (
                        <span className="text-sm text-green-600">{detail.documentsGlobal.length}건</span>
                      )}
                    </div>
                    {/* 공용 서류 전체 선택 */}
                    {detail.documentsGlobal && detail.documentsGlobal.filter(d => d.downloadUrl).length > 0 && (
                      <button
                        onClick={() => toggleAllSelection(detail.documentsGlobal || [])}
                        className="text-xs text-green-700 hover:text-green-900"
                      >
                        {detail.documentsGlobal.filter(d => d.downloadUrl).every(d => selectedDocIds.has(d.id))
                          ? "전체 해제"
                          : "전체 선택"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {detail.documentsGlobal && detail.documentsGlobal.length > 0 ? (
                    <div className="space-y-2">
                      {detail.documentsGlobal.map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-3 border rounded bg-white cursor-pointer transition-colors ${
                            selectedDocIds.has(doc.id) ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => doc.downloadUrl && !isUrlExpired(doc) && toggleDocSelection(doc.id)}
                        >
                          <div className="flex items-center gap-3">
                            {doc.downloadUrl && !isUrlExpired(doc) ? (
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedDocIds.has(doc.id) ? "border-green-500 bg-green-500" : "border-gray-300"
                              }`}>
                                {selectedDocIds.has(doc.id) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                                  {doc.fileDescription && doc.fileDescription !== doc.name && (
                                    <p className="text-xs text-gray-500">{doc.fileDescription}</p>
                                  )}
                                </div>
                                <span className={`text-xs ${doc.downloadUrl && !isUrlExpired(doc) ? "text-green-600" : "text-gray-400"}`}>
                                  {doc.downloadUrl && !isUrlExpired(doc) ? "연결됨" : "미연결"}
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

              {/* 시나리오별 서류 */}
              <section className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">시나리오별 서류</h3>
                  </div>
                </div>

                {detail.scenarios && detail.scenarios.length > 0 ? (
                  <div>
                    {/* 시나리오 선택 카드 그리드 */}
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {detail.scenarios.map((scenarioItem) => {
                        const isSelected = selectedScenarioCode === scenarioItem.scenario.scenarioCode;
                        const code = scenarioItem.scenario.scenarioCode || "";
                        const getTopBarColor = () => {
                          if (code.includes("PS")) return "bg-orange-400";
                          if (code.includes("PB")) return "bg-blue-400";
                          if (code.includes("CS")) return "bg-green-400";
                          if (code.includes("CB")) return "bg-purple-400";
                          return "bg-gray-400";
                        };

                        return (
                          <button
                            key={scenarioItem.scenario.scenarioCode}
                            onClick={() => setSelectedScenarioCode(
                              isSelected ? null : scenarioItem.scenario.scenarioCode
                            )}
                            className={`rounded-lg border-2 text-left transition-all overflow-hidden ${
                              isSelected
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <div className={`h-1 ${getTopBarColor()}`} />
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-gray-900">
                                  {getScenarioDisplayName(scenarioItem.scenario.scenarioCode || "")}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {scenarioItem.documentsLocal?.length || 0}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* 선택된 시나리오의 서류 목록 */}
                    {selectedScenarioCode && (() => {
                      const selectedScenario = detail.scenarios?.find(
                        s => s.scenario.scenarioCode === selectedScenarioCode
                      );
                      if (!selectedScenario) return null;

                      const validDocs = selectedScenario.documentsLocal?.filter(d => d.downloadUrl) || [];

                      return (
                        <div className="border-t border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {getScenarioDisplayName(selectedScenarioCode)} - 기본
                              </h4>
                              <p className="text-sm text-gray-500">이 시나리오에 필요한 서류를 선택하세요</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {validDocs.length > 0 && (
                                <button
                                  onClick={() => toggleAllSelection(selectedScenario.documentsLocal || [])}
                                  className="text-xs text-gray-600 hover:text-gray-900"
                                >
                                  {validDocs.every(d => selectedDocIds.has(d.id)) ? "전체 해제" : "전체 선택"}
                                </button>
                              )}
                              <span className="text-sm text-gray-500">
                                {selectedScenario.documentsLocal?.length || 0}개 서류 연결됨
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
                                onClick={() => doc.downloadUrl && !isUrlExpired(doc) && toggleDocSelection(doc.id)}
                              >
                                <div className="flex items-center gap-3">
                                  {doc.downloadUrl && !isUrlExpired(doc) ? (
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedDocIds.has(doc.id) ? "border-gray-900 bg-gray-900" : "border-gray-300"
                                    }`}>
                                      {selectedDocIds.has(doc.id) && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                                        {doc.fileDescription && doc.fileDescription !== doc.name && (
                                          <p className="text-xs text-gray-500">{doc.fileDescription}</p>
                                        )}
                                      </div>
                                      <span className={`text-xs ${doc.downloadUrl && !isUrlExpired(doc) ? "text-green-600" : "text-gray-400"}`}>
                                        {doc.downloadUrl && !isUrlExpired(doc) ? "연결됨" : "미연결"}
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
            </div>
          )}

        </div>
      </div>

      {/* 세금 안내 모달 */}
      <TaxGuideModal
        isOpen={showTaxGuide}
        onClose={() => setShowTaxGuide(false)}
      />
    </div>
  );
}

// 정보 필드 컴포넌트
interface InfoFieldProps {
  label: string;
  value?: string | null;
  highlight?: boolean;
  fullWidth?: boolean;
  isPhone?: boolean;
  isEmail?: boolean;
}

function InfoField({
  label,
  value,
  highlight,
  fullWidth,
  isPhone,
  isEmail,
}: InfoFieldProps) {
  // 객체인 경우 안전하게 처리
  const safeValue =
    typeof value === "object" && value !== null ? JSON.stringify(value) : value;
  const displayValue = safeValue || "-";
  const hasValue = safeValue && safeValue !== "-";

  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div
        className={`p-3 border rounded text-gray-900 ${
          highlight && hasValue
            ? "bg-green-50 border-green-200 font-semibold text-green-800"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {isPhone && hasValue ? (
          <a
            href={`tel:${safeValue}`}
            className="text-blue-600 hover:underline"
          >
            {displayValue}
          </a>
        ) : isEmail && hasValue ? (
          <a
            href={`mailto:${safeValue}`}
            className="text-blue-600 hover:underline"
          >
            {displayValue}
          </a>
        ) : (
          displayValue
        )}
      </div>
    </div>
  );
}

// 그린피 정보 필드 컴포넌트
interface GreenFeeFieldProps {
  label: string;
  data?: number | Record<string, number>;
}

function GreenFeeField({ label, data }: GreenFeeFieldProps) {
  if (!data) {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          -
        </div>
      </div>
    );
  }

  // 숫자인 경우 단순 표시
  if (typeof data === "number") {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          {data.toLocaleString()}원
        </div>
      </div>
    );
  }

  // 객체인 경우 key-value로 표시
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return (
      <div>
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900">
          -
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{key}</span>
              <span className="font-medium text-gray-900">{value.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Collapsible 섹션 컴포넌트
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-300 print:mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors print:cursor-default print:hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#8BC34A]">{icon}</span>}
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 print:hidden ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* 화면에서는 isOpen 상태에 따라, 인쇄 시에는 항상 표시 */}
      <div className={`border-t border-gray-200 ${isOpen ? "block" : "hidden"} print:block`}>
        {children}
      </div>
    </section>
  );
}

// 회원권 정보 섹션 컴포넌트 (탭 지원)
interface Membership {
  id?: string;
  membershipType?: string;
  initialSalePrice?: string;
  registeredPersonCount?: number;
  hasAssociateMember?: boolean;
  associateMemberCondition?: string;
  hasFamilyMember?: boolean;
  familyMemberCondition?: string;
  familyMemberWeekdayFee?: number;
  familyMemberWeekendFee?: number;
  weekdayGreenFee?: number | Record<string, number>;
  weekendGreenFee?: number | Record<string, number>;
  cartFee?: number;
  caddyFee?: number;
  recentMarketPrice?: string;
  estimatedSalePrice?: string;
  estimatedPriceDate?: string;
  canDelegate?: boolean;
  delegationWeekdayRule?: string;
  delegationWeekendRule?: string;
  delegationRestriction?: string;
}

interface MembershipInfoSectionProps {
  memberships: Membership[];
  memo?: string | null;
}

function MembershipInfoSection({ memberships, memo }: MembershipInfoSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const membership = memberships[selectedIndex];

  // 탭 전환 핸들러 (애니메이션 포함)
  const handleTabChange = (index: number) => {
    if (index === selectedIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  // 그린피 포맷 함수
  const formatFeeInManwon = (fee?: number) => {
    if (!fee && fee !== 0) return "-";
    return `${(fee / 10000).toLocaleString()}`;
  };

  // 그린피 객체에서 회원 유형 키 추출
  const getGreenFeeTypes = (weekdayFee?: number | Record<string, number>, weekendFee?: number | Record<string, number>) => {
    const types = new Set<string>();
    if (weekdayFee && typeof weekdayFee === "object") {
      Object.keys(weekdayFee).forEach(key => types.add(key));
    }
    if (weekendFee && typeof weekendFee === "object") {
      Object.keys(weekendFee).forEach(key => types.add(key));
    }
    const order = ["정회원", "가족회원", "비회원"];
    return Array.from(types).sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const getGreenFeeValue = (fee?: number | Record<string, number>, type?: string) => {
    if (!fee && fee !== 0) return "-";
    if (typeof fee === "number") return formatFeeInManwon(fee);
    if (typeof fee === "object" && type && fee[type] !== undefined) {
      return formatFeeInManwon(fee[type]);
    }
    return "-";
  };

  const greenFeeTypes = getGreenFeeTypes(membership?.weekdayGreenFee, membership?.weekendGreenFee);

  return (
    <CollapsibleSection title="회원권 정보" icon={SectionIcons.membership} defaultOpen={true}>
      {/* 회원권 탭 (여러 개인 경우) */}
      {memberships.length > 1 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="relative flex gap-1 p-1 bg-gray-200 rounded-lg">
            {memberships.map((m, index) => (
              <button
                key={m.id || index}
                onClick={() => handleTabChange(index)}
                className={`relative z-10 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedIndex === index
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {selectedIndex === index && (
                  <span className="absolute inset-0 bg-white rounded-md shadow-sm transition-all duration-200" />
                )}
                <span className="relative">{m.membershipType || `회원권 ${index + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <table className="w-full border-collapse">
        <tbody>
          {/* 회원권명, 분양가 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">회원권명</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.membershipType || "-"}</td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">분 양 가</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.initialSalePrice || "-"}</td>
          </tr>
          {/* 구분, 회원구성 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">구 분</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.membershipType || "-"}</td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">회원구성</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">
              {membership?.registeredPersonCount ? `${membership.registeredPersonCount}인` : "-"}
            </td>
          </tr>
          {/* 준회원 제도 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">준회원 제도</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.hasAssociateMember ? "있음" : "-"}</td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">준회원 조건</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.associateMemberCondition || "-"}</td>
          </tr>
          {/* 가족회원 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">가족회원</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.hasFamilyMember ? "있음" : "-"}</td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">가족회원 조건</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{membership?.familyMemberCondition || "-"}</td>
          </tr>
          {/* 카트비, 캐디피 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">카 트 비</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">
              {membership?.cartFee ? `${(membership.cartFee / 10000).toLocaleString()} 만원` : "-"}
            </td>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium">캐 디 피</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">
              {membership?.caddyFee ? `${(membership.caddyFee / 10000).toLocaleString()} 만원` : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 그린피 테이블 - 보기 좋게 별도 표시 */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">그린피 (단위: 만원)</div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium w-16">구분</th>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <th key={type} className="bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium text-center">
                    {type}
                  </th>
                ))
              ) : (
                <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium text-center">회원</th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 text-center font-medium">주중</td>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <td key={type} className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {getGreenFeeValue(membership?.weekdayGreenFee, type)}
                  </td>
                ))
              ) : (
                <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                  {typeof membership?.weekdayGreenFee === "number" ? formatFeeInManwon(membership.weekdayGreenFee) : "-"}
                </td>
              )}
            </tr>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-xs text-gray-600 text-center font-medium">주말</td>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <td key={type} className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {getGreenFeeValue(membership?.weekendGreenFee, type)}
                  </td>
                ))
              ) : (
                <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                  {typeof membership?.weekendGreenFee === "number" ? formatFeeInManwon(membership.weekendGreenFee) : "-"}
                </td>
              )}
            </tr>
          </tbody>
        </table>
        {/* 가족회원 그린피 별도 표시 */}
        {membership?.hasFamilyMember && (membership?.familyMemberWeekdayFee || membership?.familyMemberWeekendFee) && (
          <div className="mt-2 text-xs text-gray-600">
            * 가족회원 그린피: 주중 {membership.familyMemberWeekdayFee ? `${(membership.familyMemberWeekdayFee / 10000).toLocaleString()}만원` : "-"} /
            주말 {membership.familyMemberWeekendFee ? `${(membership.familyMemberWeekendFee / 10000).toLocaleString()}만원` : "-"}
          </div>
        )}
      </div>

        {/* 추가 정보 */}
        <table className="w-full border-collapse border-t border-gray-200">
          <tbody>
            {/* 회원권 시세 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium w-28">회원권 시세</td>
              <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm">
                {membership?.estimatedSalePrice
                  ? `${membership.estimatedSalePrice} (${membership.estimatedPriceDate || "-"})`
                  : membership?.recentMarketPrice
                    ? `*현재 시장가: ${membership.recentMarketPrice}`
                    : "-"}
              </td>
            </tr>
            {/* 기타 사항 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top">기타 사항</td>
              <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap">
                {memo || "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}

// 부가 정보 (커스텀 필드) 섹션 컴포넌트
interface CustomFieldsSectionProps {
  customFields: Record<string, CustomFieldValue>;
}

function CustomFieldsSection({ customFields }: CustomFieldsSectionProps) {
  const fieldsArray = Object.entries(customFields).map(([key, field]) => ({
    key,
    ...field,
  }));

  // 커스텀 필드 값 포맷 함수
  const formatCustomFieldValue = (field: CustomFieldValue) => {
    if (field.type === "boolean") {
      return field.value ? "있음" : "없음";
    }
    return String(field.value);
  };

  return (
    <CollapsibleSection title="부가 정보" icon={SectionIcons.info} defaultOpen={true}>
      <table className="w-full border-collapse">
        <tbody>
          {/* 2열씩 표시 */}
          {Array.from({ length: Math.ceil(fieldsArray.length / 2) }).map((_, rowIndex) => {
            const firstField = fieldsArray[rowIndex * 2];
            const secondField = fieldsArray[rowIndex * 2 + 1];
            return (
              <tr key={rowIndex}>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">{firstField.label}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">{formatCustomFieldValue(firstField)}</td>
                {secondField ? (
                  <>
                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium">{secondField.label}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{formatCustomFieldValue(secondField)}</td>
                  </>
                ) : (
                  <>
                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-28 text-sm text-gray-600 font-medium"></td>
                    <td className="border border-gray-300 px-3 py-2 text-sm"></td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </CollapsibleSection>
  );
}

// 섹션 아이콘
const SectionIcons = {
  club: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  membership: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reservation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};
