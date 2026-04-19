"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Club, Membership } from "@/types";

// recharts 는 무거우므로 초기 번들 분리 — 클라이언트에서만 로드 (1-2)
const PriceChart = dynamic(() => import("./PriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded animate-pulse" aria-label="차트 로딩 중" />
  ),
});

interface MembershipInfoSectionProps {
  memberships: Membership[];
  selectedIndex: number;
  membershipId?: string;
  memo?: string | null;
  membershipInfo?: string | null;
  reservationNotes?: string | null;
  caddyFee?: number;
  cartFee?: number;
  registrationFee?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  currentClubAddress?: string;
  currentClubName?: string;
  clubs?: Club[];
  onClubNavigate?: (clubCode: string) => void;
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && children}
    </div>
  );
}

export default function MembershipInfoSection({
  memberships,
  selectedIndex,
  membershipId,
  memo,
  membershipInfo,
  reservationNotes,
  caddyFee,
  cartFee,
  registrationFee,
  stampDuty,
  agencyFee,
  otherCosts,
  currentClubAddress,
  currentClubName,
  clubs,
  onClubNavigate,
}: MembershipInfoSectionProps) {
  const membership = memberships[selectedIndex];

  const [openSections, setOpenSections] = useState({
    basic: true,
    fee: true,
    costs: true,
    transfer: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // 그린피: 회원권 값 사용, 캐디피/카트피: 골프장(props) 값 사용
  const effectiveWeekdayFee = membership?.weekdayGreenFee;
  const effectiveWeekendFee = membership?.weekendGreenFee;
  const effectiveCaddyFee = caddyFee;
  const effectiveCartFee = cartFee;

  const formatFeeInManwon = (fee?: number) => {
    if (!fee && fee !== 0) return "-";
    return `${(fee / 10000).toLocaleString()}`;
  };

  const getGreenFeeTypes = (
    weekdayFee?: number | Record<string, number>,
    weekendFee?: number | Record<string, number>
  ) => {
    const types = new Set<string>();
    if (weekdayFee && typeof weekdayFee === "object") {
      Object.keys(weekdayFee).forEach((key) => types.add(key));
    }
    if (weekendFee && typeof weekendFee === "object") {
      Object.keys(weekendFee).forEach((key) => types.add(key));
    }
    const order = ["정회원", "준회원", "무기명회원", "비회원"];
    return Array.from(types).sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  const getGreenFeeValue = (
    fee?: number | Record<string, number>,
    type?: string
  ) => {
    if (!fee && fee !== 0) return "-";
    if (typeof fee === "number") return formatFeeInManwon(fee);
    if (typeof fee === "object" && type && fee[type] !== undefined) {
      return formatFeeInManwon(fee[type]);
    }
    return "-";
  };

  const greenFeeTypes = getGreenFeeTypes(effectiveWeekdayFee, effectiveWeekendFee);

  const displayTypeName = (type: string) =>
    type === "준회원" ? "가족(준)회원" : type;

  const hasCosts = !!(registrationFee || stampDuty || agencyFee || otherCosts);
  const hasTransfer = !!(membership?.transferManagerName || membership?.transferManagerPhone || membership?.buyerDocuments || membership?.sellerDocuments);

  return (
    <div className="space-y-3">
      {/* 회원권 기본정보 */}
      <CollapsibleSection
        title="회원권 정보"
        isOpen={openSections.basic}
        onToggle={() => toggleSection("basic")}
      >
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col className="w-24" />
            <col />
            <col className="w-24" />
            <col />
          </colgroup>
          <tbody>
            {/* 회원권명, 분양가 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                회원권명
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm">
                {membership?.membershipName ||
                  membership?.membershipType ||
                  "-"}
              </td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                분 양 가
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm">
                {membership?.initialSalePrice || "-"}
              </td>
            </tr>
            {/* 회원구성 */}
            {membershipInfo && (
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                  회원구성
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {membershipInfo}
                </td>
              </tr>
            )}
            {/* 회원 혜택 */}
            {membership?.memberBenefits && (
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                  회원 혜택
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {membership.memberBenefits}
                </td>
              </tr>
            )}
            {/* 예약 안내 */}
            {reservationNotes && (
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                  예약 안내
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {reservationNotes}
                </td>
              </tr>
            )}
            {/* 특이사항 (회원권별) */}
            {membership?.specialNotes && (
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                  특이사항
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {membership.specialNotes}
                </td>
              </tr>
            )}
            {/* 기타정보 */}
            {memo && (
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                  기타정보
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                >
                  {memo}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* 이용 요금 */}
      <CollapsibleSection
        title="그린피 정보 (단위: 만원)"
        isOpen={openSections.fee}
        onToggle={() => toggleSection("fee")}
      >
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-gray-100 border-b border-r border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium w-16">
                  구분
                </th>
                {greenFeeTypes.length > 0 ? (
                  greenFeeTypes.map((type, idx) => (
                    <th
                      key={type}
                      className={`bg-gray-100 border-b border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium text-center ${idx < greenFeeTypes.length - 1 ? "border-r" : ""}`}
                    >
                      {displayTypeName(type)}
                    </th>
                  ))
                ) : (
                  <th className="bg-gray-100 border-b border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium text-center">
                    회원
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="bg-gray-100 border-b border-r border-gray-300 px-3 py-2 text-xs text-gray-600 text-center font-medium">
                  주중
                </td>
                {greenFeeTypes.length > 0 ? (
                  greenFeeTypes.map((type, idx) => (
                    <td
                      key={type}
                      className={`border-b border-gray-300 px-3 py-2 text-sm text-center ${idx < greenFeeTypes.length - 1 ? "border-r" : ""}`}
                    >
                      {getGreenFeeValue(effectiveWeekdayFee, type)}
                    </td>
                  ))
                ) : (
                  <td className="border-b border-gray-300 px-3 py-2 text-sm text-center">
                    {typeof effectiveWeekdayFee === "number"
                      ? formatFeeInManwon(effectiveWeekdayFee)
                      : "-"}
                  </td>
                )}
              </tr>
              <tr>
                <td className="bg-gray-100 border-r border-gray-300 px-3 py-2 text-xs text-gray-600 text-center font-medium">
                  주말
                </td>
                {greenFeeTypes.length > 0 ? (
                  greenFeeTypes.map((type, idx) => (
                    <td
                      key={type}
                      className={`px-3 py-2 text-sm text-center ${idx < greenFeeTypes.length - 1 ? "border-r border-gray-300" : ""}`}
                    >
                      {getGreenFeeValue(effectiveWeekendFee, type)}
                    </td>
                  ))
                ) : (
                  <td className="px-3 py-2 text-sm text-center">
                    {typeof effectiveWeekendFee === "number"
                      ? formatFeeInManwon(effectiveWeekendFee)
                      : "-"}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
          {/* 카트비/캐디피 */}
          {(effectiveCartFee || effectiveCaddyFee) && (
            <div className="border-t border-gray-300 px-3 py-2 text-sm text-gray-600">
              {effectiveCartFee && (
                <span className="mr-4">
                  <span className="font-medium">카트비:</span>{" "}
                  {(effectiveCartFee / 10000).toLocaleString()}만원
                </span>
              )}
              {effectiveCaddyFee && (
                <span>
                  <span className="font-medium">캐디피:</span>{" "}
                  {(effectiveCaddyFee / 10000).toLocaleString()}만원
                </span>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* 시세 추이 */}
      {membershipId && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <PriceChart key={membershipId} membershipId={membershipId} />
        </div>
      )}

      {/* 부가 비용 */}
      {hasCosts && (() => {
        const costItems: { label: string; value: string }[] = [];
        if (registrationFee) costItems.push({ label: "명의개서료", value: registrationFee });
        if (stampDuty) costItems.push({ label: "인지대", value: stampDuty });
        if (agencyFee) costItems.push({ label: "대행수수료", value: agencyFee });
        if (otherCosts) costItems.push({ label: "기타비용", value: otherCosts });
        const rows: { label: string; value: string }[][] = [];
        for (let i = 0; i < costItems.length; i += 2) {
          rows.push(costItems.slice(i, i + 2));
        }
        return (
          <CollapsibleSection
            title="기타 비용"
            isOpen={openSections.costs}
            onToggle={() => toggleSection("costs")}
          >
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-24" />
                <col />
              </colgroup>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                      {row[0].label}
                    </td>
                    <td colSpan={row.length === 1 ? 3 : 1} className="border border-gray-300 px-3 py-2 text-sm">
                      {row[0].value}
                    </td>
                    {row[1] && (
                      <>
                        <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                          {row[1].label}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {row[1].value}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CollapsibleSection>
        );
      })()}

      {/* 명의개서 담당 */}
      {hasTransfer && (
        <CollapsibleSection
          title="구비서류"
          isOpen={openSections.transfer}
          onToggle={() => toggleSection("transfer")}
        >
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-24" />
              <col />
              <col className="w-24" />
              <col />
            </colgroup>
            <tbody>
              {(membership?.transferManagerName || membership?.transferManagerPhone) && (
                <tr>
                  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                    담당자
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {membership?.transferManagerName || "-"}
                  </td>
                  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                    연락처
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {membership?.transferManagerPhone || "-"}
                  </td>
                </tr>
              )}
              {membership?.buyerDocuments && (
                <tr>
                  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                    매수 서류
                  </td>
                  <td
                    colSpan={3}
                    className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                  >
                    {membership.buyerDocuments}
                  </td>
                </tr>
              )}
              {membership?.sellerDocuments && (
                <tr>
                  <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                    매도 서류
                  </td>
                  <td
                    colSpan={3}
                    className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
                  >
                    {membership.sellerDocuments}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
    </div>
  );
}
