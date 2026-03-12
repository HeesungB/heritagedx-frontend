"use client";

import { useState, useRef } from "react";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import { ClubDetail } from "@/types";
import MembershipInfoSheet from "../MembershipInfoSheet";
import type { SheetCustomItemsMap } from "@/hooks/useSheetStorage";

interface BenefitsSheetSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  fieldOverrides: Record<string, string>;
  onFieldOverrideChange: (key: string, value: string) => void;
  hiddenSheetItems: Set<string>;
  onHiddenSheetItemsChange: (items: Set<string>) => void;
  customItems: SheetCustomItemsMap;
  onCustomItemsChange: (items: SheetCustomItemsMap) => void;
  customTemplates: string[];
  onCustomTemplatesChange: (templates: string[]) => void;
  defaultManagerName?: string;
}

export default function BenefitsSheetSection({
  detail,
  selectedMembershipIndex,
  fieldOverrides,
  onFieldOverrideChange,
  hiddenSheetItems,
  onHiddenSheetItemsChange,
  customItems,
  onCustomItemsChange,
  customTemplates,
  onCustomTemplatesChange,
  defaultManagerName,
}: BenefitsSheetSectionProps) {
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
      {/* 프린트 항목 선택 (접힘) */}
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
                  "facilities", "homepage",
                  "membershipType", "initialSalePrice",
                  "memberComposition", "benefits", "reservation",
                  "specialNotes", "tradableType", "registrationFee",
                  "stampDuty", "agencyFee", "otherCosts",
                  "greenFee", "memo", "manager",
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <CheckItem itemKey="clubName" label="골프장명" hasData={!!detail.name} />
                <CheckItem itemKey="companyName" label="회사명" hasData={!!detail.companyName} />
                <CheckItem itemKey="holes" label="코스규모" hasData={!!detail.basicInfo.holes} />
                <CheckItem itemKey="memberCount" label="회원수" hasData={!!detail.basicInfo.memberCount} />
                <CheckItem itemKey="address" label="위치" hasData={!!(detail.address || detail.region)} />
                <CheckItem itemKey="phone" label="전화번호" hasData={!!detail.contacts?.length} />
                <CheckItem itemKey="openingDate" label="개장일" hasData={!!detail.basicInfo.openingDate} />
                <CheckItem itemKey="totalLength" label="코스거리" hasData={!!detail.basicInfo.totalLength} />
                <CheckItem itemKey="facilities" label="부대시설" hasData={!!detail.basicInfo.facilities} />
                <CheckItem itemKey="homepage" label="홈페이지" hasData={!!detail.website} />
              </div>
            </div>
            {/* 회원권 정보 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                회원권 정보
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <CheckItem itemKey="membershipType" label="회원권명" hasData={!!(membership?.membershipName || membership?.membershipType)} />
                <CheckItem itemKey="initialSalePrice" label="분양가" hasData={!!membership?.initialSalePrice} />
                <CheckItem itemKey="memberComposition" label="회원구성" hasData={!!detail.marketInfo?.membershipInfo} />
                <CheckItem itemKey="benefits" label="회원 혜택" />
                <CheckItem itemKey="reservation" label="예약 안내" hasData={!!(membership?.reservationNotes || detail.registration.reservationNotes)} />
                <CheckItem itemKey="specialNotes" label="특이사항" hasData={!!membership?.specialNotes} />
              </div>
            </div>
            {/* 기타 */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                기타
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <CheckItem itemKey="registrationFee" label="명의개서료" hasData={!!detail.costs.registrationFee} />
                <CheckItem itemKey="stampDuty" label="인지대" hasData={!!detail.costs.stampDuty} />
                <CheckItem itemKey="agencyFee" label="대행수수료" hasData={!!detail.costs.agencyFee} />
                <CheckItem itemKey="otherCosts" label="기타비용" hasData={!!detail.costs.otherCosts} />
                <CheckItem itemKey="greenFee" label="그린피" />
                <CheckItem itemKey="memo" label="기타정보" hasData={!!detail.memo} />
                <CheckItem itemKey="manager" label="담당자 정보" />
              </div>
            </div>
          </div>
        </div>}
      </div>

      {/* Sheet (inline editing) */}
      <div ref={sheetRef}>
        <MembershipInfoSheet
          detail={detail}
          selectedMembershipIndex={selectedMembershipIndex}
          onMembershipChange={() => {}}
          hiddenItems={hiddenSheetItems}
          customItems={customItems}
          fieldOverrides={fieldOverrides}
          onFieldOverrideChange={onFieldOverrideChange}
          onHiddenItemsChange={onHiddenSheetItemsChange}
          onCustomItemsChange={onCustomItemsChange}
          defaultManagerName={defaultManagerName}
        />
      </div>

      {/* Actions */}
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
