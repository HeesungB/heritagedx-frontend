"use client";

import { useState } from "react";
import { ClubDetail } from "@/types";

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

interface MembershipInfoSheetProps {
  detail: ClubDetail;
  recipient?: string;
  marketNote?: string;
  benefits?: string;
  managerName?: string;
  managerTitle?: string;
  managerPhone?: string;
  selectedMembershipIndex?: number;
  onMembershipChange?: (index: number) => void;
  hiddenItems?: Set<string>;
  customItems?: SheetCustomItemsMap;
}

export default function MembershipInfoSheet({
  detail,
  recipient,
  marketNote,
  benefits,
  managerName,
  managerTitle,
  managerPhone,
  selectedMembershipIndex: externalIndex,
  onMembershipChange,
  hiddenItems,
  customItems,
}: MembershipInfoSheetProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const memberships = detail.memberships || [];

  const selectedMembershipIndex =
    externalIndex !== undefined ? externalIndex : internalIndex;
  const membership = memberships[selectedMembershipIndex];
  const primaryContact =
    detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];

  const handleTabChange = (index: number) => {
    if (index === selectedMembershipIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      if (onMembershipChange) {
        onMembershipChange(index);
      } else {
        setInternalIndex(index);
      }
      setIsTransitioning(false);
    }, 150);
  };

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${
    today.getMonth() + 1
  }. ${today.getDate()}`;

  const v = (key: string) => !hiddenItems?.has(key);

  // 테이블 셀 스타일
  const thCls = "bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 whitespace-nowrap";
  const tdCls = "border border-gray-300 px-3 py-2";
  const thTopCls = `${thCls} align-top`;

  // 쌍 행 렌더 헬퍼: 두 항목 중 보이는 것만 렌더, 한쪽만 보이면 colSpan=3
  const renderPairRow = (
    leftKey: string, leftLabel: string, leftVal: string | undefined | null,
    rightKey: string, rightLabel: string, rightVal: string | undefined | null,
    rightTdClass?: string,
  ) => {
    const showL = v(leftKey) && leftVal;
    const showR = v(rightKey) && rightVal;
    if (!showL && !showR) return null;
    return (
      <tr>
        {showL && (
          <>
            <td className={thCls}>{leftLabel}</td>
            <td colSpan={showR ? 1 : 3} className={tdCls}>{leftVal}</td>
          </>
        )}
        {showR && (
          <>
            <td className={thCls}>{rightLabel}</td>
            <td colSpan={showL ? 1 : 3} className={rightTdClass || tdCls}>{rightVal}</td>
          </>
        )}
      </tr>
    );
  };

  // 커스텀 항목 쌍 렌더 헬퍼 (4열 테이블용)
  const renderCustomPairRows = (items: SheetCustomItem[] | undefined) => {
    if (!items) return null;
    const valid = items.filter((i) => i.label.trim() && i.value.trim());
    if (valid.length === 0) return null;
    const rows: SheetCustomItem[][] = [];
    for (let i = 0; i < valid.length; i += 2) {
      rows.push(valid.slice(i, i + 2));
    }
    return rows.map((row, idx) => (
      <tr key={`custom-${idx}`}>
        <td className={thCls}>{row[0].label}</td>
        <td colSpan={row.length === 1 ? 3 : 1} className={tdCls}>{row[0].value}</td>
        {row[1] && (
          <>
            <td className={thCls}>{row[1].label}</td>
            <td className={tdCls}>{row[1].value}</td>
          </>
        )}
      </tr>
    ));
  };

  // 골프장 정보 표시 여부
  const hasClubInfoItems =
    (v("clubName") && detail.name) ||
    (v("companyName") && detail.companyName) ||
    (v("holes") && detail.basicInfo.holes) ||
    (v("memberCount") && detail.basicInfo.memberCount) ||
    (v("address") && (detail.address || detail.region)) ||
    (v("phone") && primaryContact?.phoneNumber) ||
    (v("openingDate") && detail.basicInfo.openingDate) ||
    (v("totalLength") && detail.basicInfo.totalLength) ||
    (v("courseNames") && detail.basicInfo.courseNames && detail.basicInfo.courseNames.length > 0) ||
    (v("facilities") && detail.basicInfo.facilities) ||
    (customItems?.clubInfo?.some((i) => i.label.trim() && i.value.trim()));

  // 회원권 정보 표시 여부
  const hasMarketPriceData =
    membership?.estimatedSalePrice ||
    membership?.recentMarketPrice ||
    marketNote;

  const hasPriceDetailData =
    membership?.avgMarketPrice3y ||
    membership?.dealerPriceRange ||
    membership?.estimatedPriceDate;

  const hasMembershipInfoItems =
    (v("membershipType") && (membership?.membershipName || membership?.membershipType)) ||
    (v("initialSalePrice") && membership?.initialSalePrice) ||
    (v("benefits")) ||
    (v("reservation") && (membership?.reservationNotes || detail.registration.reservationNotes)) ||
    (v("marketPrice") && hasMarketPriceData) ||
    (v("priceDetail") && hasPriceDetailData) ||
    (customItems?.membershipInfo?.some((i) => i.label.trim() && i.value.trim()));

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm print:p-4 print:max-w-none print:m-0">
      {/* 상단 헤더 - 수신자 정보 */}
      {recipient && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="text-base text-gray-800 font-medium">{recipient}</div>
        </div>
      )}

      {/* 제목 영역 */}
      <div className="border-t-4 border-emerald-600 mb-6">
        <h1 className="text-center text-xl font-bold py-4 text-gray-800">
          {detail.name || detail.companyName}
        </h1>
      </div>

      {/* 회원권 탭 */}
      {memberships.length > 1 && externalIndex === undefined && (
        <div className="mb-6 print:hidden">
          <div className="relative flex gap-1 p-1 bg-gray-100 rounded-xl">
            {memberships.map((m, index) => (
              <button
                key={m.id || index}
                onClick={() => handleTabChange(index)}
                className={`relative z-10 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMembershipIndex === index
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {selectedMembershipIndex === index && (
                  <span className="absolute inset-0 bg-emerald-600 rounded-lg shadow-sm transition-all duration-200" />
                )}
                <span className="relative">
                  {m.membershipName ||
                    m.membershipType ||
                    `회원권 ${index + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`transition-opacity duration-150 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* ===== 골프장 정보 섹션 ===== */}
        {hasClubInfoItems && (
          <div className="mb-6">
            <div className="mb-3 flex justify-between items-center">
              <div>
                <span className="text-emerald-600 text-lg align-middle">🔑</span>
                <span className="font-semibold text-gray-800 ml-2">
                  골프장 정보
                </span>
              </div>
              <span className="text-sm text-gray-500">{formattedDate}</span>
            </div>
            <table className="w-full border-collapse border border-gray-300 table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-24" />
                <col />
              </colgroup>
              <tbody>
                {renderPairRow(
                  "clubName", "골프장명", detail.name,
                  "companyName", "회 사 명", detail.companyName,
                )}
                {renderPairRow(
                  "holes", "코스규모", detail.basicInfo.holes,
                  "memberCount", "회 원 수", detail.basicInfo.memberCount != null ? String(detail.basicInfo.memberCount) : null,
                )}
                {renderPairRow(
                  "address", "위 치", detail.address || detail.region,
                  "phone", "전화번호", primaryContact?.phoneNumber,
                )}
                {renderPairRow(
                  "openingDate", "개 장 일", detail.basicInfo.openingDate,
                  "totalLength", "코스거리", detail.basicInfo.totalLength,
                )}
                {renderPairRow(
                  "courseNames", "코 스 명",
                  detail.basicInfo.courseNames && detail.basicInfo.courseNames.length > 0 ? detail.basicInfo.courseNames.join(", ") : null,
                  "facilities", "부대시설", detail.basicInfo.facilities,
                )}
                {renderCustomPairRows(customItems?.clubInfo)}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== 회원권 정보 섹션 ===== */}
        {hasMembershipInfoItems && (
          <div className="mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-lg align-middle">🔑</span>
              <span className="font-semibold text-gray-800 ml-2">
                회원권 정보
              </span>
            </div>
            <table className="w-full border-collapse border border-gray-300 table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-24" />
                <col />
              </colgroup>
              <tbody>
                {renderPairRow(
                  "membershipType", "회원권명",
                  membership?.membershipName || membership?.membershipType,
                  "initialSalePrice", "분 양 가", membership?.initialSalePrice,
                )}
                {v("benefits") && (
                  <tr>
                    <td className={thTopCls}>회원 혜택</td>
                    <td colSpan={3} className={`${tdCls} whitespace-pre-wrap`}>
                      {benefits || "- 회원 혜택 정보가 없습니다."}
                    </td>
                  </tr>
                )}
                {v("reservation") && (membership?.reservationNotes || detail.registration.reservationNotes) && (
                  <tr>
                    <td className={thTopCls}>예약 안내</td>
                    <td colSpan={3} className={`${tdCls} whitespace-pre-wrap`}>
                      {(membership?.reservationNotes || detail.registration.reservationNotes)}
                    </td>
                  </tr>
                )}
                {v("marketPrice") && hasMarketPriceData && (
                  <tr>
                    <td className={thCls}>현재 시세</td>
                    <td colSpan={3} className={tdCls}>
                      {marketNote ||
                        (membership?.estimatedSalePrice
                          ? `${membership.estimatedSalePrice} (${
                              membership.estimatedPriceDate || "-"
                            })`
                          : membership?.recentMarketPrice
                            ? `*현재 시장가: ${membership.recentMarketPrice}`
                            : "-")}
                    </td>
                  </tr>
                )}
                {v("priceDetail") && hasPriceDetailData && (
                  <tr>
                    <td className={thTopCls}>시세 상세</td>
                    <td colSpan={3} className={tdCls}>
                      <div className="space-y-1 text-sm">
                        {membership?.avgMarketPrice3y && (
                          <p>
                            <span className="text-gray-500">3년 평균 시세:</span>{" "}
                            {membership.avgMarketPrice3y}
                          </p>
                        )}
                        {membership?.dealerPriceRange && (
                          <p>
                            <span className="text-gray-500">딜러 시세:</span>{" "}
                            {membership.dealerPriceRange}
                          </p>
                        )}
                        {membership?.estimatedPriceDate && (
                          <p>
                            <span className="text-gray-500">기준일:</span>{" "}
                            {membership.estimatedPriceDate}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {renderCustomPairRows(customItems?.membershipInfo)}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ===== 부가 비용 섹션 ===== */}
      {(() => {
        const costItems: { label: string; value: string }[] = [];
        if (v("registrationFee") && detail.costs.registrationFee) costItems.push({ label: "명의개서료", value: detail.costs.registrationFee });
        if (v("stampDuty") && detail.costs.stampDuty) costItems.push({ label: "인지대", value: detail.costs.stampDuty });
        if (v("agencyFee") && detail.costs.agencyFee) costItems.push({ label: "대행수수료", value: detail.costs.agencyFee });
        if (v("otherCosts") && detail.costs.otherCosts) costItems.push({ label: "부가비용", value: detail.costs.otherCosts });
        // 커스텀 항목 추가
        if (customItems?.costs) {
          customItems.costs
            .filter((i) => i.label.trim() && i.value.trim())
            .forEach((i) => costItems.push({ label: i.label, value: i.value }));
        }
        if (costItems.length === 0) return null;
        const rows: { label: string; value: string }[][] = [];
        for (let i = 0; i < costItems.length; i += 2) {
          rows.push(costItems.slice(i, i + 2));
        }
        return (
          <div className="mt-8 mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-lg align-middle">🔑</span>
              <span className="font-semibold text-gray-800 ml-2">부가 비용</span>
            </div>
            <table className="w-full border-collapse border border-gray-300 table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-24" />
                <col />
              </colgroup>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className={thCls}>{row[0].label}</td>
                    <td colSpan={row.length === 1 ? 3 : 1} className={tdCls}>{row[0].value}</td>
                    {row[1] && (
                      <>
                        <td className={thCls}>{row[1].label}</td>
                        <td className={tdCls}>{row[1].value}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ===== 기타 사항 섹션 ===== */}
      {v("memo") && (detail.memo || customItems?.memo?.some((i) => i.label.trim() && i.value.trim())) && (
        <div className="mt-8 mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-lg align-middle">🔑</span>
            <span className="font-semibold text-gray-800 ml-2">기타 사항</span>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {detail.memo && (
                <tr>
                  <td className="border border-gray-300 px-3 py-2 whitespace-pre-wrap">
                    {detail.memo}
                  </td>
                </tr>
              )}
              {customItems?.memo
                ?.filter((i) => i.label.trim() && i.value.trim())
                .map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="font-medium text-gray-600">{item.label}:</span>{" "}
                      {item.value}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== 담당자 정보 ===== */}
      {v("manager") && (
        <div className="border-t border-gray-300 pt-4">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="bg-emerald-700 text-white px-4 py-2 w-24 text-center font-semibold">
                  담 당 자
                </td>
                <td className="px-4 py-2">
                  <span className="font-medium">{managerName || "김민정"}</span>
                  <span className="text-gray-500 ml-2">{managerTitle || "팀장"}</span>
                  <span className="ml-6 text-gray-700">{managerPhone || "-"}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ===== 하단 로고 및 연락처 ===== */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <table className="w-full text-xs text-gray-500">
          <tbody>
            <tr>
              <td className="align-middle" style={{ width: "120px" }}>
                <span className="inline-block w-8 h-8 bg-emerald-700 rounded-full text-white font-bold text-xs text-center leading-8 align-middle">
                  참존
                </span>
                <span className="font-semibold text-emerald-700 ml-2">참존회원권</span>
              </td>
              <td className="text-right align-top">
                <p>서울 : 서울특별시 강남구 삼성로 531, 4층 &nbsp;&nbsp; T. 02) 6426 - 2000</p>
                <p>제주 : 제주특별자치도 제주시 다호5길 16, 4층 &nbsp;&nbsp; T. 064) 900 - 2244</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
