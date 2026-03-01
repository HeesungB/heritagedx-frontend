"use client";

import { Club, Membership } from "@/types";
import PriceChart from "./PriceChart";
import NearbyClubPrices from "./NearbyClubPrices";

interface MembershipInfoSectionProps {
  memberships: Membership[];
  selectedIndex: number;
  memo?: string | null;
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

export default function MembershipInfoSection({
  memberships,
  selectedIndex,
  memo,
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

  return (
    <div>
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
          {/* 특이 사항 */}
          <tr>
            <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
              특이 사항
            </td>
            <td
              colSpan={3}
              className="border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap"
            >
              {memo || "-"}
            </td>
          </tr>
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
          {/* 시세/거래 섹션 */}
          {(membership?.estimatedSalePrice || membership?.recentMarketPrice) && (
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium whitespace-nowrap">
                현재 시세
              </td>
              <td
                colSpan={3}
                className="border border-gray-300 px-3 py-2 text-sm"
              >
                {membership?.estimatedSalePrice || membership?.recentMarketPrice}
              </td>
            </tr>
          )}
          {(membership?.avgMarketPrice3y || membership?.dealerPriceRange || membership?.estimatedPriceDate) && (
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-600 font-medium align-top whitespace-nowrap">
                시세 상세
              </td>
              <td
                colSpan={3}
                className="border border-gray-300 px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  {membership?.avgMarketPrice3y && (
                    <div><span className="text-gray-500">3년 평균:</span> {membership.avgMarketPrice3y}</div>
                  )}
                  {membership?.dealerPriceRange && (
                    <div><span className="text-gray-500">딜러 시세:</span> {membership.dealerPriceRange}</div>
                  )}
                  {membership?.estimatedPriceDate && (
                    <div><span className="text-gray-500">기준일:</span> {membership.estimatedPriceDate}</div>
                  )}
                </div>
              </td>
            </tr>
          )}
          {/* 그린피 섹션 구분 */}
          <tr>
            <td
              colSpan={4}
              className="bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              그린피 (단위: 만원)
            </td>
          </tr>
          {/* 그린피 테이블 */}
          <tr>
            <td colSpan={4} className="border border-gray-300 p-0">
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
            </td>
          </tr>
          {/* 카트비/캐디피 */}
          {(effectiveCartFee || effectiveCaddyFee) && (
            <tr>
              <td
                colSpan={4}
                className="border border-gray-300 px-3 py-2 text-sm text-gray-600"
              >
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
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {membership?.id && <PriceChart membershipId={membership.id} />}
      {currentClubAddress && clubs && clubs.length > 0 && (
        <NearbyClubPrices
          currentClubAddress={currentClubAddress}
          currentClubName={currentClubName || ""}
          clubs={clubs}
          onClubClick={onClubNavigate}
        />
      )}
      {(registrationFee || stampDuty || agencyFee || otherCosts) && (() => {
        const costItems: { label: string; value: string }[] = [];
        if (registrationFee) costItems.push({ label: "명의개서료", value: registrationFee });
        if (stampDuty) costItems.push({ label: "인지대", value: stampDuty });
        if (agencyFee) costItems.push({ label: "대행수수료", value: agencyFee });
        if (otherCosts) costItems.push({ label: "부가비용", value: otherCosts });
        const rows: { label: string; value: string }[][] = [];
        for (let i = 0; i < costItems.length; i += 2) {
          rows.push(costItems.slice(i, i + 2));
        }
        return (
          <table className="w-full border-collapse table-fixed mt-4">
            <colgroup>
              <col className="w-24" />
              <col />
              <col className="w-24" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  부가 비용
                </td>
              </tr>
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
        );
      })()}
      {/* 명의개서 담당 */}
      {(membership?.transferManagerName || membership?.transferManagerPhone || membership?.buyerDocuments || membership?.sellerDocuments) && (
        <table className="w-full border-collapse table-fixed mt-4">
          <colgroup>
            <col className="w-24" />
            <col />
            <col className="w-24" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
              >
                명의개서 담당
              </td>
            </tr>
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
      )}
    </div>
  );
}
