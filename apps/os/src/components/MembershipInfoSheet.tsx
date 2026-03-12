"use client";

import React, { forwardRef, useState } from "react";
import { ClubDetail } from "@/types";
import type { SheetCustomItemsMap, SheetCustomItem } from "@/hooks/useSheetStorage";

const inlineInputCls =
  "bg-transparent border-none outline-none w-full hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors";

// 담당자 전용 input 클래스 (w-full 제거)
const managerInputCls =
  "bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors";

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

interface MembershipInfoSheetProps {
  detail: ClubDetail;
  selectedMembershipIndex?: number;
  onMembershipChange?: (index: number) => void;
  hiddenItems?: Set<string>;
  customItems?: SheetCustomItemsMap;
  fieldOverrides?: Record<string, string>;
  onFieldOverrideChange?: (key: string, value: string) => void;
  onHiddenItemsChange?: (items: Set<string>) => void;
  onCustomItemsChange?: (items: SheetCustomItemsMap) => void;
  defaultManagerName?: string;
}

const MembershipInfoSheet = forwardRef<HTMLDivElement, MembershipInfoSheetProps>(function MembershipInfoSheet({
  detail,
  selectedMembershipIndex: externalIndex,
  onMembershipChange,
  hiddenItems,
  customItems,
  fieldOverrides,
  onFieldOverrideChange,
  onHiddenItemsChange,
  onCustomItemsChange,
  defaultManagerName,
}, ref) {
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

  // Resolve override or fallback to original value
  const resolve = (key: string, original: string | null | undefined) =>
    fieldOverrides && key in fieldOverrides ? fieldOverrides[key] : (original ?? "");

  const isEditable = !!onFieldOverrideChange;

  // 섹션 타이틀 렌더 (편집 가능)
  const sectionTitleCls = "font-semibold text-gray-800 text-sm ml-1.5";
  const renderSectionTitle = (key: string, defaultLabel: string) =>
    isEditable ? (
      <input
        type="text"
        value={resolve(key, defaultLabel)}
        onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
        className={`${sectionTitleCls} bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors`}
      />
    ) : (
      <span className={sectionTitleCls}>{resolve(key, defaultLabel)}</span>
    );

  // 테이블 셀 스타일
  const thCls = "bg-gray-100 border border-gray-300 px-2 py-1.5 text-xs text-gray-600 whitespace-nowrap text-center";
  const tdCls = "border border-gray-300 px-2 py-1.5 text-xs";
  const thTopCls = `${thCls} align-top`;

  // 테이블 th 라벨 편집
  const editableLabel = (key: string, defaultLabel: string) =>
    isEditable ? (
      <input
        type="text"
        value={resolve(`label_${key}`, defaultLabel)}
        onChange={(e) => onFieldOverrideChange!(`label_${key}`, e.target.value)}
        className="bg-transparent border-none outline-none w-full hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors text-gray-600 text-xs text-center"
      />
    ) : defaultLabel;

  // Render an editable input or plain text
  const renderEditableCell = (key: string, original: string | null | undefined, opts?: {
    type?: "input" | "textarea";
    placeholder?: string;
    className?: string;
    rows?: number;
  }) => {
    const value = resolve(key, original);
    if (isEditable) {
      if (opts?.type === "textarea") {
        return (
          <textarea
            ref={(el) => { if (el) autoResize(el); }}
            value={value}
            onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
            onInput={(e) => autoResize(e.currentTarget)}
            placeholder={opts?.placeholder}
            className={`${inlineInputCls} resize-none overflow-hidden min-h-[3em] ${opts?.className || ""}`}
            rows={opts?.rows || 3}
          />
        );
      }
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
          placeholder={opts?.placeholder}
          className={`${inlineInputCls} ${opts?.className || ""}`}
        />
      );
    }
    return value || null;
  };

  // 쌍 행 렌더 헬퍼: 두 항목 중 보이는 것만 렌더, 한쪽만 보이면 colSpan=3
  const renderPairRow = (
    leftKey: string, leftLabel: string, leftOriginal: string | undefined | null,
    rightKey: string, rightLabel: string, rightOriginal: string | undefined | null,
    leftOpts?: { type?: "input" | "textarea"; placeholder?: string },
    rightOpts?: { type?: "input" | "textarea"; placeholder?: string },
  ) => {
    const leftVal = resolve(leftKey, leftOriginal);
    const rightVal = resolve(rightKey, rightOriginal);
    const showL = v(leftKey) && (leftVal || isEditable);
    const showR = v(rightKey) && (rightVal || isEditable);
    if (!showL && !showR) return null;
    return (
      <tr>
        {showL && (
          <>
            <td className={thCls}>{editableLabel(leftKey, leftLabel)}</td>
            <td colSpan={showR ? 1 : 3} className={tdCls}>
              {renderEditableCell(leftKey, leftOriginal, leftOpts)}
            </td>
          </>
        )}
        {showR && (
          <>
            <td className={thCls}>{editableLabel(rightKey, rightLabel)}</td>
            <td colSpan={showL ? 1 : 3} className={tdCls}>
              {renderEditableCell(rightKey, rightOriginal, rightOpts)}
            </td>
          </>
        )}
      </tr>
    );
  };

  // Full-width row
  const renderFullRow = (
    key: string, label: string, original: string | undefined | null,
    opts?: { type?: "input" | "textarea"; placeholder?: string; rows?: number; thClass?: string },
  ) => {
    const val = resolve(key, original);
    if (!v(key)) return null;
    if (!val && !isEditable) return null;
    return (
      <tr>
        <td className={opts?.thClass || thCls}>{editableLabel(key, label)}</td>
        <td colSpan={3} className={`${tdCls} whitespace-pre-wrap`}>
          {renderEditableCell(key, original, opts)}
        </td>
      </tr>
    );
  };

  // 커스텀 항목 렌더 (읽기 전용 — 쌍 배치)
  const renderCustomPairRowsReadOnly = (items: SheetCustomItem[] | undefined) => {
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

  // 커스텀 항목 렌더 (인라인 편집 — 각 항목 1행)
  const renderCustomItemsEditable = (sectionKey: keyof SheetCustomItemsMap) => {
    if (!onCustomItemsChange || !customItems) return renderCustomPairRowsReadOnly(customItems?.[sectionKey]);
    const items = customItems[sectionKey];
    return (
      <>
        {items.map((item) => (
          <tr key={item.id} className="group/custom">
            <td className={thCls}>
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const updated = items.map((ci) =>
                    ci.id === item.id ? { ...ci, label: e.target.value } : ci
                  );
                  onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                }}
                placeholder="항목명"
                className={`${inlineInputCls} text-gray-600`}
              />
            </td>
            <td colSpan={3} className={tdCls}>
              <div className="flex items-start gap-1">
                <textarea
                  ref={(el) => { if (el) autoResize(el); }}
                  value={item.value}
                  onChange={(e) => {
                    const updated = items.map((ci) =>
                      ci.id === item.id ? { ...ci, value: e.target.value } : ci
                    );
                    onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                  }}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="값"
                  rows={1}
                  className={`${inlineInputCls} flex-1 resize-none overflow-hidden`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = items.filter((ci) => ci.id !== item.id);
                    onCustomItemsChange({ ...customItems, [sectionKey]: updated });
                  }}
                  className="opacity-0 group-hover/custom:opacity-100 text-gray-400 hover:text-red-500 transition-opacity print:hidden flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
        <tr className="print:hidden">
          <td colSpan={4} className="border border-gray-300 px-3 py-1">
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
          </td>
        </tr>
      </>
    );
  };

  // 골프장 정보 표시 여부
  const hasClubInfoItems =
    (v("clubName") && (detail.name || isEditable)) ||
    (v("companyName") && (detail.companyName || isEditable)) ||
    (v("holes") && (detail.basicInfo.holes || isEditable)) ||
    (v("memberCount") && (detail.basicInfo.memberCount || isEditable)) ||
    (v("address") && (detail.address || detail.region || isEditable)) ||
    (v("phone") && (primaryContact?.phoneNumber || isEditable)) ||
    (v("openingDate") && (detail.basicInfo.openingDate || isEditable)) ||
    (v("totalLength") && (detail.basicInfo.totalLength || isEditable)) ||
    (v("facilities") && (detail.basicInfo.facilities || isEditable)) ||
    (v("homepage") && (detail.website || isEditable)) ||
    (customItems?.clubInfo?.some((i) => i.label.trim() && i.value.trim())) ||
    (onCustomItemsChange); // 편집 모드에서는 항상 표시 (추가 가능)

  // 회원권 정보 표시 여부
  const hasMembershipInfoItems =
    (v("membershipType") && (membership?.membershipName || membership?.membershipType || isEditable)) ||
    (v("initialSalePrice") && (membership?.initialSalePrice || isEditable)) ||
    (v("memberComposition") && (detail.marketInfo?.membershipInfo || isEditable)) ||
    (v("benefits")) ||
    (v("reservation") && (membership?.reservationNotes || detail.registration.reservationNotes || isEditable)) ||
    (v("specialNotes") && (membership?.specialNotes || isEditable)) ||
    (v("memo") && (detail.memo || isEditable)) ||
    (customItems?.membershipInfo?.some((i) => i.label.trim() && i.value.trim())) ||
    (onCustomItemsChange);

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm print:p-4 print:max-w-none print:m-0">
      {/* 상단 헤더 - 수신자 정보 */}
      {(resolve("recipient", "") || isEditable) && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          {isEditable ? (
            <input
              type="text"
              value={resolve("recipient", "")}
              onChange={(e) => onFieldOverrideChange!("recipient", e.target.value)}
              placeholder="수신자 (예: 수산    (주)한아 귀중)"
              className={`${inlineInputCls} text-base text-gray-800 font-medium`}
            />
          ) : (
            <div className="text-base text-gray-800 font-medium">{resolve("recipient", "")}</div>
          )}
        </div>
      )}

      {/* 제목 영역 */}
      <div className="border-t-4 border-emerald-600 mb-6">
        <h1 className="text-center text-xl font-bold py-4 text-gray-800">
          {resolve("clubName", detail.name) || detail.companyName}
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
                <span className="text-emerald-600 text-base align-middle">🔑</span>
                {renderSectionTitle("sectionClubInfo", "골프장 정보")}
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
                {renderFullRow("facilities", "부대시설", detail.basicInfo.facilities)}
                {/* 홈페이지: editable or link */}
                {v("homepage") && (() => {
                  const hpVal = resolve("homepage", detail.website);
                  if (!hpVal && !isEditable) return null;
                  return (
                    <tr>
                      <td className={thCls}>{editableLabel("homepage", "홈페이지")}</td>
                      <td colSpan={3} className={tdCls}>
                        {isEditable ? (
                          <input
                            type="text"
                            value={hpVal}
                            onChange={(e) => onFieldOverrideChange!("homepage", e.target.value)}
                            placeholder="홈페이지 URL"
                            className={inlineInputCls}
                          />
                        ) : (
                          <a href={hpVal.startsWith("http") ? hpVal : `https://${hpVal}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {hpVal}
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })()}
                {renderCustomItemsEditable("clubInfo")}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== 회원권 정보 섹션 ===== */}
        {hasMembershipInfoItems && (
          <div className="mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-base align-middle">🔑</span>
              {renderSectionTitle("sectionMembershipInfo", "회원권 정보")}
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
                {renderFullRow("memberComposition", "회원구성", detail.marketInfo?.membershipInfo)}
                {renderFullRow("benefits", "회원 혜택", membership?.memberBenefits, {
                  type: "textarea", placeholder: "예: - 월 주중 8회 주말 7회 우선예약", rows: 3, thClass: thTopCls,
                })}
                {renderFullRow("reservation", "예약 안내", membership?.reservationNotes || detail.registration.reservationNotes, {
                  type: "textarea", rows: 3, thClass: thTopCls,
                })}
                {renderFullRow("specialNotes", "특이사항", membership?.specialNotes, {
                  type: "textarea", rows: 2, thClass: thTopCls,
                })}
                {renderFullRow("memo", "기타정보", detail.memo, {
                  type: "textarea", rows: 2, thClass: thTopCls,
                })}
                {renderCustomItemsEditable("membershipInfo")}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ===== 그린피 정보 섹션 ===== */}
      {v("greenFee") && (() => {
        const weekdayFee = membership?.weekdayGreenFee;
        const weekendFee = membership?.weekendGreenFee;
        const caddyFee = detail.costs.caddyFee;
        const cartFee = detail.costs.cartFee;
        if (!weekdayFee && !weekendFee && !caddyFee && !cartFee && !isEditable) return null;

        const formatFee = (fee?: number) => {
          if (!fee && fee !== 0) return "-";
          return `${(fee / 10000).toLocaleString()}`;
        };
        const getFeeTypes = (wd?: number | Record<string, number>, we?: number | Record<string, number>) => {
          const types = new Set<string>();
          if (wd && typeof wd === "object") Object.keys(wd).forEach((k) => types.add(k));
          if (we && typeof we === "object") Object.keys(we).forEach((k) => types.add(k));
          const order = ["정회원", "준회원", "무기명회원", "비회원"];
          return Array.from(types).sort((a, b) => {
            const ai = order.indexOf(a), bi = order.indexOf(b);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
        };
        const getFeeVal = (fee?: number | Record<string, number>, type?: string) => {
          if (!fee && fee !== 0) return "-";
          if (typeof fee === "number") return formatFee(fee);
          if (typeof fee === "object" && type && fee[type] !== undefined) return formatFee(fee[type]);
          return "-";
        };
        const feeTypes = getFeeTypes(weekdayFee, weekendFee);
        const displayType = (t: string) => t === "준회원" ? "가족(준)회원" : t;

        const feeThCls = "bg-gray-100 border border-gray-300 px-2 py-1.5 text-xs text-gray-600 font-medium text-center";
        const feeTdCls = "border border-gray-300 px-2 py-1.5 text-xs text-center";

        // 그린피 셀 렌더 (편집 가능)
        const renderFeeCell = (key: string, original: string) => (
          <td className={feeTdCls}>
            {isEditable ? (
              <input
                type="text"
                value={resolve(key, original)}
                onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
                className="bg-transparent border-none outline-none w-full text-center hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
                placeholder="-"
              />
            ) : (
              resolve(key, original)
            )}
          </td>
        );

        return (
          <div className="mt-8 mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-base align-middle">🔑</span>
              {renderSectionTitle("sectionGreenFee", "그린피 정보 (단위: 만원)")}
            </div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className={`${feeThCls} w-16`}>{editableLabel("greenFee_header", "구분")}</th>
                  {feeTypes.length > 0 ? feeTypes.map((type) => (
                    <th key={type} className={`${feeThCls} text-center`}>{editableLabel(`greenFee_type_${type}`, displayType(type))}</th>
                  )) : (
                    <th className={`${feeThCls} text-center`}>{editableLabel("greenFee_type_default", "회원")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${feeThCls} text-center`}>{editableLabel("greenFee_weekday", "주중")}</td>
                  {feeTypes.length > 0 ? feeTypes.map((type) => (
                    <React.Fragment key={type}>
                      {renderFeeCell(`greenFee_weekday_${type}`, getFeeVal(weekdayFee, type))}
                    </React.Fragment>
                  )) : (
                    renderFeeCell("greenFee_weekday", typeof weekdayFee === "number" ? formatFee(weekdayFee) : "-")
                  )}
                </tr>
                <tr>
                  <td className={`${feeThCls} text-center`}>{editableLabel("greenFee_weekend", "주말")}</td>
                  {feeTypes.length > 0 ? feeTypes.map((type) => (
                    <React.Fragment key={type}>
                      {renderFeeCell(`greenFee_weekend_${type}`, getFeeVal(weekendFee, type))}
                    </React.Fragment>
                  )) : (
                    renderFeeCell("greenFee_weekend", typeof weekendFee === "number" ? formatFee(weekendFee) : "-")
                  )}
                </tr>
              </tbody>
            </table>
            {(cartFee || caddyFee || isEditable) && (
              <div className="border-t border-gray-300 px-2 py-1.5 text-xs text-gray-600">
                <span className="inline-flex items-center mr-4">
                  <span className="font-medium">카트비:</span>
                  {isEditable ? (
                    <input
                      type="text"
                      value={resolve("cartFee", cartFee ? `${(cartFee / 10000).toLocaleString()}만원` : "")}
                      onChange={(e) => onFieldOverrideChange!("cartFee", e.target.value)}
                      className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 transition-colors w-20 ml-1"
                      placeholder="0만원"
                    />
                  ) : (
                    <span className="ml-1">{resolve("cartFee", cartFee ? `${(cartFee / 10000).toLocaleString()}만원` : "-")}</span>
                  )}
                </span>
                <span className="inline-flex items-center">
                  <span className="font-medium">캐디피:</span>
                  {isEditable ? (
                    <input
                      type="text"
                      value={resolve("caddyFee", caddyFee ? `${(caddyFee / 10000).toLocaleString()}만원` : "")}
                      onChange={(e) => onFieldOverrideChange!("caddyFee", e.target.value)}
                      className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 transition-colors w-20 ml-1"
                      placeholder="0만원"
                    />
                  ) : (
                    <span className="ml-1">{resolve("caddyFee", caddyFee ? `${(caddyFee / 10000).toLocaleString()}만원` : "-")}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ===== 기타 비용 섹션 ===== */}
      {(() => {
        const costKeys: { key: string; label: string; original: string | null | undefined }[] = [
          { key: "registrationFee", label: "명의개서료", original: detail.costs.registrationFee },
          { key: "stampDutyCost", label: "인지대", original: detail.costs.stampDuty },
          { key: "agencyFee", label: "대행수수료", original: detail.costs.agencyFee },
          { key: "otherCostsFee", label: "기타비용", original: detail.costs.otherCosts },
        ];
        const costItems: { key: string; label: string; value: string }[] = [];
        for (const c of costKeys) {
          const val = resolve(c.key, c.original);
          if (v(c.key === "stampDutyCost" ? "stampDuty" : c.key === "otherCostsFee" ? "otherCosts" : c.key) && (val || isEditable)) {
            costItems.push({ key: c.key, label: c.label, value: val });
          }
        }
        // 읽기 전용 커스텀 항목 추가
        if (!onCustomItemsChange && customItems?.costs) {
          customItems.costs
            .filter((i) => i.label.trim() && i.value.trim())
            .forEach((i) => costItems.push({ key: `custom-${i.id}`, label: i.label, value: i.value }));
        }
        const hasEditableCustom = onCustomItemsChange && customItems;
        if (costItems.length === 0 && !hasEditableCustom) return null;
        const rows: { key: string; label: string; value: string }[][] = [];
        for (let i = 0; i < costItems.length; i += 2) {
          rows.push(costItems.slice(i, i + 2));
        }
        return (
          <div className="mt-8 mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-base align-middle">🔑</span>
              {renderSectionTitle("sectionCosts", "기타 비용")}
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
                    <td className={thCls}>{editableLabel(row[0].key, row[0].label)}</td>
                    <td colSpan={row.length === 1 ? 3 : 1} className={tdCls}>
                      {isEditable && !row[0].key.startsWith("custom-") ? (
                        <input
                          type="text"
                          value={row[0].value}
                          onChange={(e) => onFieldOverrideChange!(row[0].key, e.target.value)}
                          className={inlineInputCls}
                        />
                      ) : row[0].value}
                    </td>
                    {row[1] && (
                      <>
                        <td className={thCls}>{editableLabel(row[1].key, row[1].label)}</td>
                        <td className={tdCls}>
                          {isEditable && !row[1].key.startsWith("custom-") ? (
                            <input
                              type="text"
                              value={row[1].value}
                              onChange={(e) => onFieldOverrideChange!(row[1].key, e.target.value)}
                              className={inlineInputCls}
                            />
                          ) : row[1].value}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {renderCustomItemsEditable("costs")}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ===== 기타 사항 섹션 ===== */}
      {(() => {
        const hasReadOnlyMemo = !onCustomItemsChange && customItems?.memo?.some((i) => i.label.trim() && i.value.trim());
        const hasEditableMemo = onCustomItemsChange && customItems;
        if (!hasReadOnlyMemo && !hasEditableMemo) return null;
        return (
          <div className="mt-8 mb-6">
            <div className="mb-3">
              <span className="text-emerald-600 text-base align-middle">🔑</span>
              {renderSectionTitle("sectionMemo", "기타 사항")}
            </div>
            <table className="w-full border-collapse border border-gray-300 table-fixed">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-24" />
                <col />
              </colgroup>
              <tbody>
                {onCustomItemsChange ? (
                  renderCustomItemsEditable("memo")
                ) : (
                  customItems?.memo
                    ?.filter((i) => i.label.trim() && i.value.trim())
                    .map((item) => (
                      <tr key={item.id}>
                        <td className={thCls}>{item.label}</td>
                        <td colSpan={3} className={tdCls}>{item.value}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ===== 담당자 정보 ===== */}
      {v("manager") && (
        <div className="border-t border-gray-300 pt-4">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="bg-emerald-700 text-white px-4 py-2 w-24 text-center font-semibold">
                  {isEditable ? (
                    <input
                      type="text"
                      value={resolve("label_manager", "담 당 자")}
                      onChange={(e) => onFieldOverrideChange!("label_manager", e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-center text-white hover:bg-emerald-600 focus:bg-emerald-600 focus:ring-1 focus:ring-white rounded px-1 -mx-1 transition-colors"
                    />
                  ) : (
                    resolve("label_manager", "담 당 자")
                  )}
                </td>
                <td className="px-4 py-2">
                  {isEditable ? (
                    <div className="flex items-center gap-2 flex-nowrap min-w-0">
                      <input
                        type="text"
                        value={resolve("managerName", defaultManagerName || "김민정")}
                        onChange={(e) => onFieldOverrideChange!("managerName", e.target.value)}
                        placeholder="이름"
                        className={`${managerInputCls} w-24 font-medium flex-shrink-0`}
                      />
                      <input
                        type="text"
                        value={resolve("managerTitle", "팀장")}
                        onChange={(e) => onFieldOverrideChange!("managerTitle", e.target.value)}
                        placeholder="직책"
                        className={`${managerInputCls} w-16 text-gray-500 flex-shrink-0`}
                      />
                      <input
                        type="text"
                        value={resolve("managerPhone", "")}
                        onChange={(e) => onFieldOverrideChange!("managerPhone", e.target.value)}
                        placeholder="연락처"
                        className={`${managerInputCls} w-36 text-gray-700 flex-shrink-0`}
                      />
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{resolve("managerName", defaultManagerName || "김민정")}</span>
                      <span className="text-gray-500 ml-2">{resolve("managerTitle", "팀장")}</span>
                      <span className="ml-6 text-gray-700">{resolve("managerPhone", "") || "-"}</span>
                    </>
                  )}
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
                {isEditable ? (
                  <input
                    type="text"
                    value={resolve("footerCompanyName", "참존회원권")}
                    onChange={(e) => onFieldOverrideChange!("footerCompanyName", e.target.value)}
                    className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 transition-colors font-semibold text-emerald-700 w-20 ml-1"
                  />
                ) : (
                  <span className="font-semibold text-emerald-700 ml-2">{resolve("footerCompanyName", "참존회원권")}</span>
                )}
              </td>
              <td className="text-right align-top">
                {isEditable ? (
                  <>
                    <input
                      type="text"
                      value={resolve("footerLine1", "서울 : 서울특별시 강남구 삼성로 531, 4층   T. 02) 6426 - 2000")}
                      onChange={(e) => onFieldOverrideChange!("footerLine1", e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
                    />
                    <input
                      type="text"
                      value={resolve("footerLine2", "제주 : 제주특별자치도 제주시 다호5길 16, 4층   T. 064) 900 - 2244")}
                      onChange={(e) => onFieldOverrideChange!("footerLine2", e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
                    />
                  </>
                ) : (
                  <>
                    <p>{resolve("footerLine1", "서울 : 서울특별시 강남구 삼성로 531, 4층   T. 02) 6426 - 2000")}</p>
                    <p>{resolve("footerLine2", "제주 : 제주특별자치도 제주시 다호5길 16, 4층   T. 064) 900 - 2244")}</p>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default MembershipInfoSheet;
