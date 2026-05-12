"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { ClubDetail } from "@/types";
import type { SheetCustomItemsMap, SheetCustomItem } from "@/hooks/useSheetStorage";
import styles from "./sheet-common/sheet.module.css";

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

// 모듈 스코프 컴포넌트: 부모 함수 안에 두면 매 렌더마다 새 reference 가 만들어져
// React 가 다른 component type 으로 간주하고 input 을 unmount/remount 시킨다.
// 포커스 손실로 "한 글자 입력 후 다음 키 불가" 증상이 생기므로 모듈 스코프로 분리.

function KVRow({
  itemKey,
  label,
  original,
  full,
  tall,
  med,
  multiline,
  placeholder,
  hiddenItems,
  fieldOverrides,
  isEditable,
  onFieldOverrideChange,
}: {
  itemKey: string;
  label: string;
  original: string | null | undefined;
  full?: boolean;
  tall?: boolean;
  med?: boolean;
  multiline?: boolean;
  placeholder?: string;
  hiddenItems?: Set<string>;
  fieldOverrides?: Record<string, string>;
  isEditable: boolean;
  onFieldOverrideChange?: (key: string, value: string) => void;
}) {
  if (hiddenItems?.has(itemKey)) return null;
  const val =
    fieldOverrides && itemKey in fieldOverrides
      ? fieldOverrides[itemKey]
      : (original ?? "");
  if (!val && !isEditable) return null;
  const rowCls = [
    styles.kvRow,
    full ? styles.kvRowFull : "",
    tall ? styles.kvRowTall : "",
    med ? styles.kvRowMed : "",
  ]
    .filter(Boolean)
    .join(" ");

  let content: ReactNode;
  if (isEditable && onFieldOverrideChange) {
    if (multiline) {
      content = (
        <textarea
          ref={(el) => {
            if (el) autoResize(el);
          }}
          value={val}
          onChange={(e) => onFieldOverrideChange(itemKey, e.target.value)}
          onInput={(e) => autoResize(e.currentTarget)}
          placeholder={placeholder}
          className={styles.editCell}
          style={{ width: "100%" }}
          rows={1}
        />
      );
    } else {
      content = (
        <input
          type="text"
          value={val}
          onChange={(e) => onFieldOverrideChange(itemKey, e.target.value)}
          placeholder={placeholder}
          className={styles.editCell}
          style={{ width: "100%" }}
        />
      );
    }
  } else {
    content = val || "";
  }

  return (
    <div className={rowCls}>
      <div className={styles.kvKey}>{label}</div>
      <div className={styles.kvVal}>{content}</div>
    </div>
  );
}

function CustomRows({
  section,
  customItems,
  onCustomItemsChange,
}: {
  section: keyof SheetCustomItemsMap;
  customItems?: SheetCustomItemsMap;
  onCustomItemsChange?: (items: SheetCustomItemsMap) => void;
}) {
  if (!customItems) return null;
  const items = customItems[section];
  if (!onCustomItemsChange) {
    const filled = items.filter((i) => i.label.trim() && i.value.trim());
    if (filled.length === 0) return null;
    return (
      <>
        {filled.map((it) => (
          <div className={styles.kvRow} key={it.id}>
            <div className={styles.kvKey}>{it.label}</div>
            <div className={styles.kvVal}>{it.value}</div>
          </div>
        ))}
      </>
    );
  }
  const setItems = (next: SheetCustomItem[]) =>
    onCustomItemsChange({ ...customItems, [section]: next });
  return (
    <>
      {items.map((it) => (
        <div className={`${styles.kvRow} ${styles.kvRowFull}`} key={it.id}>
          <div className={styles.kvKey}>
            <input
              type="text"
              value={it.label}
              onChange={(e) =>
                setItems(items.map((ci) => (ci.id === it.id ? { ...ci, label: e.target.value } : ci)))
              }
              className={styles.editCell}
              style={{ width: "100%" }}
              placeholder="항목명"
            />
          </div>
          <div className={styles.kvVal} style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
            <textarea
              ref={(el) => {
                if (el) autoResize(el);
              }}
              value={it.value}
              onChange={(e) =>
                setItems(items.map((ci) => (ci.id === it.id ? { ...ci, value: e.target.value } : ci)))
              }
              onInput={(e) => autoResize(e.currentTarget)}
              rows={1}
              className={styles.editCell}
              style={{ flex: 1 }}
              placeholder="값"
            />
            <button
              type="button"
              onClick={() => setItems(items.filter((ci) => ci.id !== it.id))}
              className="print:hidden"
              style={{
                background: "transparent",
                border: 0,
                color: "#b6bac3",
                cursor: "pointer",
                padding: 2,
                fontSize: 12,
                flexShrink: 0,
              }}
              aria-label="항목 삭제"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <div className={`${styles.kvRow} ${styles.kvRowFull} print:hidden`} style={{ borderBottom: "0", minHeight: 26 }}>
        <div />
        <div>
          <button
            type="button"
            onClick={() =>
              setItems([...items, { id: crypto.randomUUID(), label: "", value: "" }])
            }
            style={{
              background: "transparent",
              border: 0,
              color: "#16a34a",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              padding: 0,
            }}
          >
            + 항목 추가
          </button>
        </div>
      </div>
    </>
  );
}

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

const MembershipInfoSheet = forwardRef<HTMLDivElement, MembershipInfoSheetProps>(
  function MembershipInfoSheet(
    {
      detail,
      selectedMembershipIndex = 0,
      hiddenItems,
      customItems,
      fieldOverrides,
      onFieldOverrideChange,
      onCustomItemsChange,
    },
    ref,
  ) {
    const memberships = detail.memberships || [];
    const membership = memberships[selectedMembershipIndex];
    const primaryContact = detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;

    const isVisible = (key: string) => !hiddenItems?.has(key);
    const isEditable = !!onFieldOverrideChange;

    const resolve = (key: string, original: string | null | undefined) =>
      fieldOverrides && key in fieldOverrides
        ? fieldOverrides[key]
        : (original ?? "");

    const renderText = (
      key: string,
      original: string | null | undefined,
      opts: { placeholder?: string; multiline?: boolean; style?: CSSProperties } = {},
    ): ReactNode => {
      const val = resolve(key, original);
      if (isEditable) {
        if (opts.multiline) {
          return (
            <textarea
              ref={(el) => {
                if (el) autoResize(el);
              }}
              value={val}
              onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              placeholder={opts.placeholder}
              className={styles.editCell}
              style={{ width: "100%", ...opts.style }}
              rows={1}
            />
          );
        }
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
            placeholder={opts.placeholder}
            className={styles.editCell}
            style={{ width: "100%", ...opts.style }}
          />
        );
      }
      return val || "";
    };

    // KVRow 가 받을 공통 컨텍스트. 매 렌더마다 새 객체지만 module-scope 컴포넌트의
    // element type 이 안정적이라 reconciler 가 input 을 remount 시키지 않는다.
    const kvCtx = { hiddenItems, fieldOverrides, isEditable, onFieldOverrideChange };

    // 그린피 데이터
    const weekdayFee = membership?.weekdayGreenFee;
    const weekendFee = membership?.weekendGreenFee;
    const cartFee = detail.costs.cartFee;
    const caddyFee = detail.costs.caddyFee;

    const formatFee = (fee?: number) => {
      if (fee === undefined || fee === null) return "-";
      return `${(fee / 10000).toLocaleString()}`;
    };
    const getFeeVal = (fee?: number | Record<string, number>, type?: string) => {
      if (fee === undefined || fee === null) return "-";
      if (typeof fee === "number") return formatFee(fee);
      if (typeof fee === "object" && type && fee[type] !== undefined) return formatFee(fee[type]);
      return "-";
    };
    // 회원 유형이 아닌 키 (카트/캐디 등은 별도 카드에서 노출하므로 컬럼에서 제외)
    const NON_MEMBER_FEE_KEYS = new Set(["카트/캐디", "카트", "캐디", "카트비", "캐디비"]);
    const getFeeTypes = () => {
      const types = new Set<string>();
      if (weekdayFee && typeof weekdayFee === "object") Object.keys(weekdayFee).forEach((k) => types.add(k));
      if (weekendFee && typeof weekendFee === "object") Object.keys(weekendFee).forEach((k) => types.add(k));
      const order = ["정회원", "준회원", "무기명회원", "가족회원", "비회원"];
      return Array.from(types)
        .filter((k) => !NON_MEMBER_FEE_KEYS.has(k))
        .sort((a, b) => {
          const ai = order.indexOf(a), bi = order.indexOf(b);
          if (ai === -1 && bi === -1) return 0;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
    };
    const feeTypes = getFeeTypes();
    const displayType = (t: string) => (t === "준회원" ? "가족(준)회원" : t);

    const showGreenFee =
      isVisible("greenFee") &&
      (weekdayFee || weekendFee || cartFee || caddyFee || isEditable);

    // 기타 비용 데이터
    const costItems: { key: string; label: string; original: string }[] = [
      { key: "stampDuty", label: "인지대", original: detail.costs.stampDuty || "" },
      { key: "agencyFee", label: "대행수수료", original: detail.costs.agencyFee || "" },
      { key: "otherCosts", label: "기타비용", original: detail.costs.otherCosts || "" },
      { key: "registrationFee", label: "명의개서료", original: detail.costs.registrationFee || "" },
    ].filter((c) => isVisible(c.key) && (resolve(c.key, c.original) || isEditable));

    const showCosts = costItems.length > 0;
    const showMemo = isVisible("memo") && (detail.memo || isEditable || customItems?.memo?.some((i) => i.label.trim() && i.value.trim()));

    const recipientVal = resolve("recipient", "");

    return (
      <div ref={ref} className={styles.paper}>
        {/* 상단 헤더 */}
        <div className={styles.docMeta}>
          <div className="metaGrp" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="metaK" style={{ color: "#0e1014", fontWeight: 600, letterSpacing: "0.04em" }}>
              수신자
            </span>
            <span className="metaSep" style={{ color: "#b6bac3" }}>:</span>
            <span>{renderText("recipient", recipientVal, { placeholder: "수신자" })}</span>
          </div>
          <div className="metaGrp" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="metaK" style={{ color: "#0e1014", fontWeight: 600, letterSpacing: "0.04em" }}>
              일자
            </span>
            <span className="metaSep" style={{ color: "#b6bac3" }}>:</span>
            <span>{renderText("sheetDate", formattedDate)}</span>
          </div>
        </div>

        <h1 className={styles.docTitle}>
          {renderText("sheetTitle", "혜택지 상세 정보", { style: { display: "inline-block", minWidth: 240, textAlign: "center" } })}
        </h1>

        {/* 골프장 정보 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>골프장 정보</div>
          </div>
          <div className={styles.kvGrid}>
            <KVRow {...kvCtx} itemKey="clubName" label="골프장명" original={detail.name} />
            <KVRow {...kvCtx} itemKey="companyName" label="회사명" original={detail.companyName} />
            <KVRow {...kvCtx} itemKey="address" label="위치" original={detail.address || detail.region} full />
            <KVRow {...kvCtx} itemKey="openingDate" label="개장일" original={detail.basicInfo.openingDate} />
            <KVRow {...kvCtx} itemKey="holes" label="코스규모" original={detail.basicInfo.holes} />
            <KVRow {...kvCtx} itemKey="totalLength" label="코스거리" original={detail.basicInfo.totalLength} />
            <KVRow {...kvCtx} itemKey="memberCount" label="회원수" original={detail.basicInfo.memberCount != null ? String(detail.basicInfo.memberCount) : null} />
            <KVRow {...kvCtx} itemKey="phone" label="전화번호" original={primaryContact?.phoneNumber} />
            <KVRow {...kvCtx} itemKey="facilities" label="부대시설" original={detail.basicInfo.facilities} full />
            <KVRow {...kvCtx} itemKey="homepage" label="홈페이지" original={detail.website} full />
            <CustomRows section="clubInfo" customItems={customItems} onCustomItemsChange={onCustomItemsChange} />
          </div>
        </section>

        {/* 회원권 정보 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>회원권 정보</div>
          </div>
          <div className={styles.kvGrid}>
            <KVRow
              {...kvCtx}
              itemKey="membershipType"
              label="회원권명"
              original={membership?.membershipName || membership?.membershipType}
            />
            <KVRow {...kvCtx} itemKey="initialSalePrice" label="분양가" original={membership?.initialSalePrice} />
            <KVRow {...kvCtx} itemKey="memberComposition" label="회원구성" original={detail.marketInfo?.membershipInfo} full />
            <KVRow {...kvCtx} itemKey="specialNotes" label="특이사항" original={membership?.specialNotes} full multiline />
            <KVRow {...kvCtx} itemKey="benefits" label="회원 혜택" original={membership?.memberBenefits} full med multiline />
            <KVRow
              {...kvCtx}
              itemKey="reservation"
              label="예약 안내"
              original={membership?.reservationNotes || detail.registration.reservationNotes}
              full
              tall
              multiline
            />
            <KVRow {...kvCtx} itemKey="memo" label="기타정보" original={detail.memo} full med multiline />
            <CustomRows section="membershipInfo" customItems={customItems} onCustomItemsChange={onCustomItemsChange} />
          </div>
        </section>

        {/* 그린피 정보 */}
        {showGreenFee ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>그린피 정보</div>
              <div className={styles.sectionUnit}>단위: 만원</div>
            </div>
            <div className={styles.gfWrap}>
              <table className={styles.tbl} style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}></th>
                    {feeTypes.length > 0 ? (
                      feeTypes.map((t) => <th key={t}>{displayType(t)}</th>)
                    ) : (
                      <th>회원</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tdCenter}>평일</td>
                    {feeTypes.length > 0 ? (
                      feeTypes.map((t) => (
                        <td key={t} className={styles.tdCenter}>
                          {renderText(`greenFee_weekday_${t}`, getFeeVal(weekdayFee, t), {
                            style: { textAlign: "center" },
                          })}
                        </td>
                      ))
                    ) : (
                      <td className={styles.tdCenter}>
                        {renderText(
                          "greenFee_weekday",
                          typeof weekdayFee === "number" ? formatFee(weekdayFee) : "-",
                          { style: { textAlign: "center" } },
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className={styles.tdCenter}>주말</td>
                    {feeTypes.length > 0 ? (
                      feeTypes.map((t) => (
                        <td key={t} className={styles.tdCenter}>
                          {renderText(`greenFee_weekend_${t}`, getFeeVal(weekendFee, t), {
                            style: { textAlign: "center" },
                          })}
                        </td>
                      ))
                    ) : (
                      <td className={styles.tdCenter}>
                        {renderText(
                          "greenFee_weekend",
                          typeof weekendFee === "number" ? formatFee(weekendFee) : "-",
                          { style: { textAlign: "center" } },
                        )}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
              <div className={styles.gfSide}>
                <div className={styles.gfCard}>
                  <div className={styles.gfCardLbl}>카트비</div>
                  <div className={styles.gfCardVal}>
                    {renderText(
                      "cartFee",
                      cartFee ? `${(cartFee / 10000).toLocaleString()}만원` : "",
                      { placeholder: "0만원" },
                    )}
                  </div>
                </div>
                <div className={styles.gfCard}>
                  <div className={styles.gfCardLbl}>캐디비</div>
                  <div className={styles.gfCardVal}>
                    {renderText(
                      "caddyFee",
                      caddyFee ? `${(caddyFee / 10000).toLocaleString()}만원` : "",
                      { placeholder: "0만원" },
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* 기타 비용 + 기타 사항 */}
        {showCosts || showMemo ? (
          <section className={styles.section}>
            <div className={styles.etcRow}>
              {showCosts ? (
                <div>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>기타 비용</div>
                  </div>
                  <table className={styles.tbl}>
                    <thead>
                      <tr>
                        {costItems.map((c) => (
                          <th key={c.key}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {costItems.map((c) => (
                          <td key={c.key} className={styles.tdCenter}>
                            {renderText(c.key, c.original, { style: { textAlign: "center" } })}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div />
              )}
              {showMemo ? (
                <div>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>기타 사항</div>
                  </div>
                  <div className={styles.etcMemo}>
                    {customItems && onCustomItemsChange ? (
                      <CustomRows section="memo" customItems={customItems} onCustomItemsChange={onCustomItemsChange} />
                    ) : (
                      renderText("memoFreeText", detail.memo, {
                        multiline: true,
                        placeholder: "기타 사항을 입력하세요",
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Footer (회사 정보) */}
        {isVisible("manager") ? (
          <div className={styles.docFoot}>
            <div className={styles.footInfo}>
              <div className={styles.footName}>
                {renderText("footerCompanyName", "참존회원권", { style: { width: "auto", display: "inline-block", minWidth: 100 } })}
              </div>
              <div className={styles.footLines}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {renderText("footerLine1", "서울특별시 강남구 삼성로 531, 4층", { style: { width: "100%" } })}
                  </span>
                  <span className={styles.footSep}>|</span>
                  <b>T.</b>
                  <span style={{ flex: "0 0 auto", width: 130 }}>
                    {renderText("footerTel1", "02) 6426-2000", { style: { width: "100%" } })}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {renderText("footerLine2", "제주특별자치도 제주시 다호5길 16, 4층", { style: { width: "100%" } })}
                  </span>
                  <span className={styles.footSep}>|</span>
                  <b>T.</b>
                  <span style={{ flex: "0 0 auto", width: 130 }}>
                    {renderText("footerTel2", "064) 900-2244", { style: { width: "100%" } })}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.footBadge}>C</div>
          </div>
        ) : null}
      </div>
    );
  },
);

export default MembershipInfoSheet;
