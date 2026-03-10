"use client";

import { useState, useRef } from "react";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import { ClubDetail } from "@/types";
import MembershipInfoSheet from "../MembershipInfoSheet";

interface SheetCustomItem {
  id: string;
  label: string;
  value: string;
}

type SheetCustomItemsMap = {
  clubInfo: SheetCustomItem[];
  membershipInfo: SheetCustomItem[];
  costs: SheetCustomItem[];
  memo: SheetCustomItem[];
};

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
  customItems: SheetCustomItemsMap;
  onCustomItemsChange: (items: SheetCustomItemsMap) => void;
  customTemplates: string[];
  onCustomTemplatesChange: (templates: string[]) => void;
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
  customItems,
  onCustomItemsChange,
  customTemplates,
  onCustomTemplatesChange,
}: BenefitsSheetSectionProps) {
  const [isInputSectionOpen, setIsInputSectionOpen] = useState(false);
  const [isPrintSectionOpen, setIsPrintSectionOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);

  const handleJpegDownload = async () => {
    if (!sheetRef.current || !detail) return;
    setJpegDownloading(true);

    try {
      const blob = await captureSheetAsJpeg(sheetRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${detail.name}_혜택지.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        {isInputSectionOpen && <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* 섹션별 추가 항목 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">섹션별 추가 항목</h4>
              {customTemplates.length > 0 && (
                <div className="relative group">
                  <button
                    type="button"
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    저장된 항목명 관리
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px] hidden group-hover:block">
                    {customTemplates.map((tmpl) => (
                      <div key={tmpl} className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-gray-50">
                        <span className="text-gray-700">{tmpl}</span>
                        <button
                          type="button"
                          onClick={() => onCustomTemplatesChange(customTemplates.filter((t) => t !== tmpl))}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <datalist id="sheet-custom-templates">
              {customTemplates.map((tmpl) => (
                <option key={tmpl} value={tmpl} />
              ))}
            </datalist>
            {(["clubInfo", "membershipInfo", "costs", "memo"] as const).map((sectionKey) => {
              const sectionLabels: Record<string, string> = {
                clubInfo: "골프장 정보",
                membershipInfo: "회원권 정보",
                costs: "부가 비용",
                memo: "기타 사항",
              };
              const items = customItems[sectionKey];
              return (
                <div key={sectionKey} className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">{sectionLabels[sectionKey]}</div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          list="sheet-custom-templates"
                          value={item.label}
                          onChange={(e) => {
                            const updated = items.map((ci) =>
                              ci.id === item.id ? { ...ci, label: e.target.value } : ci
                            );
                            onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                          }}
                          onBlur={(e) => {
                            const label = e.target.value.trim();
                            if (label && !customTemplates.includes(label)) {
                              onCustomTemplatesChange([...customTemplates, label]);
                            }
                          }}
                          placeholder="항목명"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const updated = items.map((ci) =>
                              ci.id === item.id ? { ...ci, value: e.target.value } : ci
                            );
                            onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                          }}
                          placeholder="값"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = items.filter((ci) => ci.id !== item.id);
                            onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        onCustomItemsChange({
                          ...customItems,
                          [sectionKey]: [
                            ...items,
                            { id: crypto.randomUUID(), label: "", value: "" },
                          ],
                        });
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + 항목 추가
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
          customItems={customItems}
        />
      </div>

      {/* 인쇄 / JPEG 다운로드 버튼 */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={() => printSheetFitToPage(sheetRef.current!)}
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
