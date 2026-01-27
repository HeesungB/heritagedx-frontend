"use client";

import { useState } from "react";
import { ClubDetail, CustomFieldValue } from "@/types";

interface MembershipInfoSheetProps {
  detail: ClubDetail;
  recipient?: string;
  marketNote?: string;
  benefits?: string;
  notes?: string[];
  managerName?: string;
  managerTitle?: string;
  managerPhone?: string;
}

export default function MembershipInfoSheet({
  detail,
  recipient,
  marketNote,
  benefits,
  notes,
  managerName,
  managerTitle,
  managerPhone,
}: MembershipInfoSheetProps) {
  const [selectedMembershipIndex, setSelectedMembershipIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const memberships = detail.memberships || [];
  const membership = memberships[selectedMembershipIndex];
  const primaryContact = detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];

  // 탭 전환 핸들러 (애니메이션 포함)
  const handleTabChange = (index: number) => {
    if (index === selectedMembershipIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedMembershipIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  // 날짜 포맷
  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;

  // 그린피 포맷 함수 (만원 단위)
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
    // 순서 정렬: 정회원 -> 가족회원 -> 비회원 순
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

  // 그린피 값 가져오기
  const getGreenFeeValue = (fee?: number | Record<string, number>, type?: string) => {
    if (!fee && fee !== 0) return "-";
    if (typeof fee === "number") return formatFeeInManwon(fee);
    if (typeof fee === "object" && type && fee[type] !== undefined) {
      return formatFeeInManwon(fee[type]);
    }
    return "-";
  };

  const greenFeeTypes = getGreenFeeTypes(membership?.weekdayGreenFee, membership?.weekendGreenFee);

  // 커스텀 필드 값 포맷 함수
  const formatCustomFieldValue = (field: CustomFieldValue) => {
    if (field.type === "boolean") {
      return field.value ? "있음" : "없음";
    }
    return String(field.value);
  };

  // 커스텀 필드 배열로 변환
  const customFieldsArray = detail.customFields
    ? Object.entries(detail.customFields).map(([key, field]) => ({
        key,
        ...field,
      }))
    : [];

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm print:p-4 print:max-w-none print:m-0">
      {/* 상단 헤더 - 수신자 정보 */}
      {recipient && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="text-base text-gray-800 font-medium">
            {recipient}
          </div>
        </div>
      )}

      {/* 제목 영역 */}
      <div className="border-t-4 border-[#8BC34A] mb-6">
        <h1 className="text-center text-xl font-bold py-4 text-gray-800">
          {detail.name} {membership?.membershipType || "회원권"}
        </h1>
      </div>

      {/* 회원권 탭 (여러 개인 경우) */}
      {memberships.length > 1 && (
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
                  <span className="absolute inset-0 bg-[#8BC34A] rounded-lg shadow-sm transition-all duration-200" />
                )}
                <span className="relative">{m.membershipType || `회원권 ${index + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
      {/* 골프장 정보 섹션 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#8BC34A] text-lg">🔑</span>
          <span className="font-semibold text-gray-700">골프장 정보</span>
          <span className="ml-auto text-sm text-gray-500">{formattedDate}</span>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">골프장명</td>
              <td className="border border-gray-300 px-3 py-2">{detail.name}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">회 사 명</td>
              <td className="border border-gray-300 px-3 py-2">{detail.memo || "-"}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">코스규모</td>
              <td className="border border-gray-300 px-3 py-2">{detail.holes || "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">회 원 수</td>
              <td className="border border-gray-300 px-3 py-2">{detail.memberCount || "-"}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">위 치</td>
              <td className="border border-gray-300 px-3 py-2">{detail.address || detail.region || "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">전화번호</td>
              <td className="border border-gray-300 px-3 py-2">{primaryContact?.phoneNumber || "-"}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">홈페이지</td>
              <td colSpan={3} className="border border-gray-300 px-3 py-2">
                {detail.externalUrl ? (
                  <a href={detail.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {detail.externalUrl}
                  </a>
                ) : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 회원권 정보 섹션 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#8BC34A] text-lg">🔑</span>
          <span className="font-semibold text-gray-700">회원권 정보</span>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            {/* 회원권명, 분양가 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">회원권명</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.membershipType || "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">분 양 가</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.initialSalePrice || "-"}</td>
            </tr>
            {/* 구분, 회원구성 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">구 분</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.membershipType || "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">회원구성</td>
              <td className="border border-gray-300 px-3 py-2">
                {membership?.registeredPersonCount ? `${membership.registeredPersonCount}인` : "-"}
              </td>
            </tr>
            {/* 준회원 제도 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">준회원 제도</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.hasAssociateMember ? "있음" : "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">준회원 예약권한</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.associateMemberCondition || "-"}</td>
            </tr>
            {/* 가족회원 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">가족회원</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.hasFamilyMember ? "있음" : "-"}</td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">가족회원 조건</td>
              <td className="border border-gray-300 px-3 py-2">{membership?.familyMemberCondition || "-"}</td>
            </tr>
            {/* 카트비, 캐디피 */}
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">카 트 비</td>
              <td className="border border-gray-300 px-3 py-2">
                {membership?.cartFee ? `${(membership.cartFee / 10000).toLocaleString()} 만원` : "-"}
              </td>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600">캐 디 피</td>
              <td className="border border-gray-300 px-3 py-2">
                {membership?.caddyFee ? `${(membership.caddyFee / 10000).toLocaleString()} 만원` : "-"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 그린피 정보 섹션 - 별도 테이블로 보기 좋게 표시 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#8BC34A] text-lg">🔑</span>
          <span className="font-semibold text-gray-700">그린피 (단위: 만원)</span>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 font-medium w-20">구분</th>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <th key={type} className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 font-medium text-center">
                    {type}
                  </th>
                ))
              ) : (
                <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-gray-600 font-medium text-center">
                  회원
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-3 text-gray-600 text-center font-medium">주중</td>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <td key={type} className="border border-gray-300 px-3 py-3 text-center font-medium">
                    {getGreenFeeValue(membership?.weekdayGreenFee, type)}
                  </td>
                ))
              ) : (
                <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                  {typeof membership?.weekdayGreenFee === "number"
                    ? formatFeeInManwon(membership.weekdayGreenFee)
                    : "-"}
                </td>
              )}
            </tr>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-3 text-gray-600 text-center font-medium">주말</td>
              {greenFeeTypes.length > 0 ? (
                greenFeeTypes.map(type => (
                  <td key={type} className="border border-gray-300 px-3 py-3 text-center font-medium">
                    {getGreenFeeValue(membership?.weekendGreenFee, type)}
                  </td>
                ))
              ) : (
                <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                  {typeof membership?.weekendGreenFee === "number"
                    ? formatFeeInManwon(membership.weekendGreenFee)
                    : "-"}
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

      {/* 회원 혜택 */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600 text-center">회원 혜택</td>
              <td className="border border-gray-300 px-3 py-2">
                {benefits || "- 회원 혜택 정보가 없습니다."}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 회원권 시세 */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600 text-center">회원권 시세</td>
              <td className="border border-gray-300 px-3 py-2">
                {membership?.estimatedSalePrice
                  ? `${membership.estimatedSalePrice} (${membership.estimatedPriceDate || "-"})`
                  : marketNote || (membership?.recentMarketPrice ? `*현재 시장가: ${membership.recentMarketPrice}` : "-")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 위임 관련 정보 */}
      {membership?.canDelegate && (
        <div className="mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600 text-center">위임 가능</td>
                <td className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1 text-sm">
                    {membership.delegationWeekdayRule && (
                      <p><span className="text-gray-500">주중:</span> {membership.delegationWeekdayRule}</p>
                    )}
                    {membership.delegationWeekendRule && (
                      <p><span className="text-gray-500">주말:</span> {membership.delegationWeekendRule}</p>
                    )}
                    {membership.delegationRestriction && (
                      <p className="text-red-600"><span className="text-gray-500">제한:</span> {membership.delegationRestriction}</p>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 기타 사항 */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600 text-center align-top">기타 사항</td>
              <td className="border border-gray-300 px-3 py-2">
                {notes && notes.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {notes.map((note, index) => (
                      <li key={index} className="text-gray-700">{note}</li>
                    ))}
                  </ul>
                ) : detail.memo ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{detail.memo}</p>
                ) : (
                  <p className="text-gray-500">기타 사항 없음</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 부가 정보 (커스텀 필드) */}
      {customFieldsArray.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#8BC34A] text-lg">🔑</span>
            <span className="font-semibold text-gray-700">부가 정보</span>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {/* 2열씩 표시 */}
              {Array.from({ length: Math.ceil(customFieldsArray.length / 2) }).map((_, rowIndex) => {
                const firstField = customFieldsArray[rowIndex * 2];
                const secondField = customFieldsArray[rowIndex * 2 + 1];
                return (
                  <tr key={rowIndex}>
                    <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">{firstField.label}</td>
                    <td className="border border-gray-300 px-3 py-2">{formatCustomFieldValue(firstField)}</td>
                    {secondField ? (
                      <>
                        <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600">{secondField.label}</td>
                        <td className="border border-gray-300 px-3 py-2">{formatCustomFieldValue(secondField)}</td>
                      </>
                    ) : (
                      <>
                        <td className="bg-gray-100 border border-gray-300 px-3 py-2 w-24 text-gray-600"></td>
                        <td className="border border-gray-300 px-3 py-2"></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 담당자 정보 */}
      <div className="border-t border-gray-300 pt-4">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="bg-[#8BC34A] text-white px-4 py-2 w-24 text-center font-semibold">담 당 자</td>
              <td className="px-4 py-2">
                <span className="font-medium">{managerName || "김민정"}</span>
                <span className="text-gray-500 ml-2">{managerTitle || "팀장"}</span>
                <span className="ml-6 text-gray-700">{managerPhone || "-"}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      {/* 하단 로고 및 연락처 */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8BC34A] rounded-full flex items-center justify-center text-white font-bold text-xs">
              참존
            </div>
            <span className="font-semibold text-[#8BC34A]">참존회원권</span>
          </div>
          <div className="text-right space-y-0.5">
            <p>주소 : 서울시 서초구 서래불 4길 8, 주빌리빌딩 5층 &nbsp;&nbsp; T. 02) 6287 - 8210</p>
            <p>제주 : 제주도 제주시 나란5길 16, 4층 &nbsp;&nbsp; T. 064) 900 - 2244</p>
          </div>
        </div>
      </div>
    </div>
  );
}
