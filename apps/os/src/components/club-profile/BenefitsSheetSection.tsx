"use client";

import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { ClubDetail } from "@/types";
import MembershipInfoSheet from "../MembershipInfoSheet";

interface BenefitsSheetSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  sheetRecipient: string;
  onSheetRecipientChange: (value: string) => void;
  sheetBenefits: string;
  onSheetBenefitsChange: (value: string) => void;
  sheetMarketNote: string;
  onSheetMarketNoteChange: (value: string) => void;
  sheetManagerName: string;
  onSheetManagerNameChange: (value: string) => void;
  sheetManagerTitle: string;
  onSheetManagerTitleChange: (value: string) => void;
  sheetManagerPhone: string;
  onSheetManagerPhoneChange: (value: string) => void;
  hiddenSheetItems: Set<string>;
  onHiddenSheetItemsChange: (items: Set<string>) => void;
}

export default function BenefitsSheetSection({
  detail,
  selectedMembershipIndex,
  sheetRecipient,
  onSheetRecipientChange,
  sheetBenefits,
  onSheetBenefitsChange,
  sheetMarketNote,
  onSheetMarketNoteChange,
  sheetManagerName,
  onSheetManagerNameChange,
  sheetManagerTitle,
  onSheetManagerTitleChange,
  sheetManagerPhone,
  onSheetManagerPhoneChange,
  hiddenSheetItems,
  onHiddenSheetItemsChange,
}: BenefitsSheetSectionProps) {
  const [isInputSectionOpen, setIsInputSectionOpen] = useState(false);
  const [isPrintSectionOpen, setIsPrintSectionOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);

  const handleJpegDownload = async () => {
    if (!sheetRef.current || !detail) return;
    setJpegDownloading(true);

    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const PAGE_WIDTH = 1050;
      const PAGE_HEIGHT = 1480;
      const fullWidth = canvas.width;
      const fullHeight = canvas.height;

      const scale = PAGE_WIDTH / fullWidth;
      const scaledHeight = Math.round(fullHeight * scale);
      const pageCount = Math.ceil(scaledHeight / PAGE_HEIGHT);

      const pages: Blob[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = PAGE_WIDTH;
        pageCanvas.height = PAGE_HEIGHT;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

        const srcY = Math.round((i * PAGE_HEIGHT) / scale);
        const srcH = Math.round(PAGE_HEIGHT / scale);

        ctx.drawImage(
          canvas,
          0,
          srcY,
          fullWidth,
          Math.min(srcH, fullHeight - srcY),
          0,
          0,
          PAGE_WIDTH,
          Math.min(
            PAGE_HEIGHT,
            Math.round(Math.min(srcH, fullHeight - srcY) * scale)
          )
        );

        const blob = await new Promise<Blob>((resolve) => {
          pageCanvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
        });
        pages.push(blob);
      }

      if (pages.length === 1) {
        const url = URL.createObjectURL(pages[0]);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${detail.name}_혜택지.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        pages.forEach((blob, idx) => {
          zip.file(`${detail.name}_혜택지_${idx + 1}.jpg`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${detail.name}_혜택지.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("JPEG 다운로드 에러:", error);
      alert("JPEG 다운로드에 실패했습니다.");
    } finally {
      setJpegDownloading(false);
    }
  };

  const toggleItem = (key: string) => {
    const next = new Set(hiddenSheetItems);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onHiddenSheetItemsChange(next);
  };

  const membership = detail.memberships?.[selectedMembershipIndex];

  const CheckItem = ({
    itemKey,
    label,
    hasData = true,
  }: {
    itemKey: string;
    label: string;
    hasData?: boolean;
  }) => (
    <label
      className={`flex items-center gap-2 text-sm cursor-pointer select-none py-1 ${
        !hasData ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={!hiddenSheetItems.has(itemKey) && hasData}
        onChange={() => hasData && toggleItem(itemKey)}
        disabled={!hasData}
        className="w-4 h-4 rounded border-gray-300 accent-[#8BC34A]"
      />
      <span className={!hasData ? "line-through text-gray-400" : "text-gray-700"}>
        {label}
      </span>
      {!hasData && (
        <span className="text-[10px] text-gray-400 ml-1">데이터 없음</span>
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      {/* 입력 필드 섹션 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 print:hidden">
        <button
          type="button"
          onClick={() => setIsInputSectionOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            추가 정보 입력
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isInputSectionOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isInputSectionOpen && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              수신자 (귀중)
            </label>
            <input
              type="text"
              value={sheetRecipient}
              onChange={(e) => onSheetRecipientChange(e.target.value)}
              placeholder="예: 수산    (주)한아 귀중"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {!hiddenSheetItems.has("benefits") && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회원 혜택
              </label>
              <textarea
                value={sheetBenefits}
                onChange={(e) => onSheetBenefitsChange(e.target.value)}
                placeholder="예: - 월 주중 8회 주말 7회 우선예약"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          )}

          {!hiddenSheetItems.has("marketPrice") && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시세 메모
              </label>
              <input
                type="text"
                value={sheetMarketNote}
                onChange={(e) => onSheetMarketNoteChange(e.target.value)}
                placeholder="예: *현재 시장가: 3억 4,000만원"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          )}

          {!hiddenSheetItems.has("manager") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 이름
                </label>
                <input
                  type="text"
                  value={sheetManagerName}
                  onChange={(e) => onSheetManagerNameChange(e.target.value)}
                  placeholder="김민정"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 직책
                </label>
                <input
                  type="text"
                  value={sheetManagerTitle}
                  onChange={(e) => onSheetManagerTitleChange(e.target.value)}
                  placeholder="팀장"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 연락처
                </label>
                <input
                  type="text"
                  value={sheetManagerPhone}
                  onChange={(e) => onSheetManagerPhoneChange(e.target.value)}
                  placeholder="연락처"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>}
      </div>

      {/* 프린트 항목 선택 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 print:hidden">
        <button
          type="button"
          onClick={() => setIsPrintSectionOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            프린트 항목 선택
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isPrintSectionOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isPrintSectionOpen && <div className="px-4 pb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onHiddenSheetItemsChange(new Set())}
              className="text-xs px-2.5 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              전체 선택
            </button>
            <button
              onClick={() => {
                onHiddenSheetItemsChange(new Set([
                  "clubName", "companyName", "holes", "memberCount",
                  "address", "phone", "openingDate", "totalLength",
                  "courseNames", "facilities",
                  "membershipType", "initialSalePrice",
                  "benefits", "reservation",
                  "tradableType", "registrationFee",
                  "stampDuty", "agencyFee", "otherCosts",
                  "marketPrice", "priceDetail",
                  "memo", "manager",
                ]));
              }}
              className="text-xs px-2.5 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              전체 해제
            </button>
          </div>
          <div className="space-y-4">
            {/* 골프장 정보 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                골프장 정보
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                <CheckItem itemKey="clubName" label="골프장명" hasData={!!detail.name} />
                <CheckItem itemKey="companyName" label="회사명" hasData={!!detail.companyName} />
                <CheckItem itemKey="holes" label="코스규모" hasData={!!detail.basicInfo.holes} />
                <CheckItem itemKey="memberCount" label="회원수" hasData={!!detail.basicInfo.memberCount} />
                <CheckItem itemKey="address" label="위치" hasData={!!(detail.address || detail.region)} />
                <CheckItem itemKey="phone" label="전화번호" hasData={!!detail.contacts?.length} />
                <CheckItem itemKey="openingDate" label="개장일" hasData={!!detail.basicInfo.openingDate} />
                <CheckItem itemKey="totalLength" label="코스거리" hasData={!!detail.basicInfo.totalLength} />
                <CheckItem itemKey="courseNames" label="코스명" hasData={!!(detail.basicInfo.courseNames && detail.basicInfo.courseNames.length > 0)} />
                <CheckItem itemKey="facilities" label="부대시설" hasData={!!detail.basicInfo.facilities} />
              </div>
            </div>
            {/* 회원권 정보 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                회원권 정보
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                <CheckItem itemKey="membershipType" label="회원권명" hasData={!!(membership?.membershipName || membership?.membershipType)} />
                <CheckItem itemKey="initialSalePrice" label="분양가" hasData={!!membership?.initialSalePrice} />
                <CheckItem itemKey="benefits" label="회원 혜택" />
                <CheckItem itemKey="reservation" label="예약 안내" hasData={!!(membership?.reservationNotes || detail.registration.reservationNotes)} />
                <CheckItem itemKey="marketPrice" label="현재 시세" hasData={!!(membership?.estimatedSalePrice || membership?.recentMarketPrice)} />
                <CheckItem itemKey="priceDetail" label="시세 상세" hasData={!!(membership?.avgMarketPrice3y || membership?.dealerPriceRange)} />
              </div>
            </div>
            {/* 기타 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                기타
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                <CheckItem itemKey="registrationFee" label="명의개서료" hasData={!!detail.costs.registrationFee} />
                <CheckItem itemKey="stampDuty" label="인지대" hasData={!!detail.costs.stampDuty} />
                <CheckItem itemKey="agencyFee" label="대행수수료" hasData={!!detail.costs.agencyFee} />
                <CheckItem itemKey="otherCosts" label="부가비용" hasData={!!detail.costs.otherCosts} />

                <CheckItem itemKey="memo" label="기타 사항" hasData={!!detail.memo} />
                <CheckItem itemKey="manager" label="담당자 정보" />
              </div>
            </div>
          </div>
        </div>}
      </div>

      {/* 미리보기 구분선 */}
      <div className="flex items-center gap-4 print:hidden">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500 font-medium">
          미리보기
        </span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* 회원권 시트 */}
      <div ref={sheetRef}>
        <MembershipInfoSheet
          detail={detail}
          recipient={sheetRecipient || undefined}
          benefits={sheetBenefits || undefined}
          marketNote={sheetMarketNote || undefined}
          managerName={sheetManagerName || "김민정"}
          managerTitle={sheetManagerTitle || "팀장"}
          managerPhone={sheetManagerPhone || undefined}
          selectedMembershipIndex={selectedMembershipIndex}
          onMembershipChange={() => {}}
          hiddenItems={hiddenSheetItems}
        />
      </div>

      {/* 인쇄 / JPEG 다운로드 버튼 */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          인쇄하기
        </button>
        <button
          onClick={handleJpegDownload}
          disabled={jpegDownloading}
          className={`flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg transition-colors ${
            jpegDownloading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {jpegDownloading ? "다운로드 중..." : "JPEG 다운로드"}
        </button>
      </div>
    </div>
  );
}
