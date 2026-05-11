"use client";

import { forwardRef, type CSSProperties } from "react";
import { ClubDetail } from "@/types";
import { OrganizationEntity } from "@/types/organization";
import { parseTransferFee } from "@heritage-dx/utils";
import styles from "./sheet-common/sheet.module.css";

interface EstimateSheetProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  recipient?: string;
  price: number;
  commission: number;
  stampDuty: number;
  otherCosts: number;
  deposit: number;
  organization: OrganizationEntity | null;
  userName?: string;
  managerTitle?: string;
  tradeType?: "매수" | "매도";
  onRecipientChange?: (value: string) => void;
  onManagerTitleChange?: (value: string) => void;
  onTradeTypeChange?: (value: "매수" | "매도") => void;
  onPriceChange?: (raw: string) => void;
  onCommissionChange?: (raw: string) => void;
  onStampDutyChange?: (raw: string) => void;
  onOtherCostsChange?: (raw: string) => void;
  onDepositChange?: (raw: string) => void;
  depositAuto?: boolean;
  onDepositAutoReset?: () => void;
  fieldOverrides?: Record<string, string>;
  onFieldOverrideChange?: (key: string, value: string) => void;
}

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const cellStyleRight: CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums" };

const EstimateSheet = forwardRef<HTMLDivElement, EstimateSheetProps>(
  function EstimateSheet(
    {
      detail,
      selectedMembershipIndex,
      recipient,
      price,
      commission,
      stampDuty,
      otherCosts,
      deposit,
      organization,
      userName,
      managerTitle,
      tradeType = "매수",
      onRecipientChange,
      onManagerTitleChange,
      onTradeTypeChange,
      onPriceChange,
      onCommissionChange,
      onStampDutyChange,
      onOtherCostsChange,
      onDepositChange,
      depositAuto,
      onDepositAutoReset,
      fieldOverrides,
      onFieldOverrideChange,
    },
    ref,
  ) {
    const isSell = tradeType === "매도";
    const membership = detail.memberships?.[selectedMembershipIndex];

    const resolveField = (key: string, original: string) =>
      fieldOverrides && key in fieldOverrides ? fieldOverrides[key] : original;

    const isEditable = !!onFieldOverrideChange;
    const clubName = resolveField("clubName", detail.name || "");
    const membershipName = resolveField(
      "membershipName",
      membership?.membershipName || membership?.membershipType || "",
    );

    const transferFeeWon = parseTransferFee(detail.costs.registrationFee) * 10000;
    const totalExtra = transferFeeWon + commission + stampDuty + otherCosts;
    const grandTotal = price + totalExtra;
    const balance = grandTotal - deposit;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;

    const fmt = (n: number) => (n ? n.toLocaleString("ko-KR") : "0");

    const handleNumInput = (value: string, onChange: (raw: string) => void) => {
      onChange(value.replace(/[^0-9]/g, ""));
    };

    const renderText = (
      key: string,
      original: string,
      opts: { placeholder?: string; style?: CSSProperties; className?: string } = {},
    ) => {
      const val = resolveField(key, original);
      if (isEditable) {
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
            placeholder={opts.placeholder}
            className={`${styles.editCell} ${opts.className ?? ""}`}
            style={{ width: "100%", ...opts.style }}
          />
        );
      }
      return <span style={opts.style}>{val || opts.placeholder || ""}</span>;
    };

    const renderNumWithAuto = (
      value: number,
      onChange?: (raw: string) => void,
      extra?: { auto?: boolean; onAutoReset?: () => void; autoLabel?: string },
    ) => {
      if (!onChange) {
        return (
          <span style={cellStyleRight}>
            {fmt(value)}
            <span style={{ marginLeft: 2 }}>원</span>
          </span>
        );
      }
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            <input
              type="text"
              value={fmt(value)}
              onChange={(e) => handleNumInput(e.target.value, onChange)}
              className={`${styles.editCell} ${styles.editCellRight}`}
              style={{ minWidth: 70, textAlign: "right" }}
              placeholder="0"
            />
            <span style={{ flexShrink: 0 }}>원</span>
          </span>
          {extra?.auto === false && extra.onAutoReset ? (
            <button
              type="button"
              onClick={extra.onAutoReset}
              className="print:hidden"
              style={{
                fontSize: 9,
                color: "#8a8f99",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {extra.autoLabel ?? "자동계산"}
            </button>
          ) : null}
        </div>
      );
    };

    // 구비서류 텍스트 - membership에서 기본값 가져오되 override 가능
    const docsKey = isSell ? "sellerDocuments" : "buyerDocuments";
    const docsOriginal = (isSell ? membership?.sellerDocuments : membership?.buyerDocuments) || "";
    const docsValue = resolveField(docsKey, docsOriginal);

    const notesValue = resolveField(
      "disclaimerNotes",
      [
        "* 상기 견적 금액은 시장 상황에 따라 변동될 수 있습니다.",
        "* 계약금 입금 후 잔금은 명의개서일 전일까지 입금 부탁드립니다.",
      ].join("\n"),
    );

    return (
      <div ref={ref} className={styles.paper}>
        {/* Title */}
        <h1 className={styles.docTitle}>
          {isEditable ? (
            <input
              type="text"
              value={clubName}
              onChange={(e) => onFieldOverrideChange!("clubName", e.target.value)}
              className={`${styles.editCell} ${styles.editCellCenter}`}
              style={{ width: `${Math.max(clubName.length, 4)}em`, display: "inline-block" }}
            />
          ) : (
            clubName
          )}
          {" 회원권 "}
          {onTradeTypeChange ? (
            <button
              type="button"
              className="tradeToggle"
              onClick={() => onTradeTypeChange(isSell ? "매수" : "매도")}
            >
              {tradeType}
            </button>
          ) : (
            tradeType
          )}
          {" 견적서"}
        </h1>

        {/* 수신자 정보 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>수신자 정보</div>
            <div className={styles.sectionUnit}>{formattedDate}</div>
          </div>
          <div className={styles.kvGrid}>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>수신</div>
              <div className={styles.kvVal}>
                {onRecipientChange ? (
                  <input
                    type="text"
                    value={recipient || ""}
                    onChange={(e) => onRecipientChange(e.target.value)}
                    className={styles.editCell}
                    placeholder="수신자"
                  />
                ) : (
                  recipient || ""
                )}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>견적일자</div>
              <div className={styles.kvVal}>{renderText("estimateDate", formattedDate)}</div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>연락처</div>
              <div className={styles.kvVal}>
                {renderText("recipientPhone", "", { placeholder: "연락처" })}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>담당자</div>
              <div className={styles.kvVal}>
                <span style={{ display: "inline-flex", gap: 6 }}>
                  {isEditable ? (
                    <input
                      type="text"
                      value={resolveField("managerName", userName || "")}
                      onChange={(e) => onFieldOverrideChange!("managerName", e.target.value)}
                      className={styles.editCell}
                      style={{ width: 80 }}
                      placeholder="이름"
                    />
                  ) : (
                    <span>{userName || ""}</span>
                  )}
                  {onManagerTitleChange ? (
                    <input
                      type="text"
                      value={managerTitle || ""}
                      onChange={(e) => onManagerTitleChange(e.target.value)}
                      className={styles.editCell}
                      style={{ width: 60, color: "#8a8f99" }}
                      placeholder="직책"
                    />
                  ) : managerTitle ? (
                    <span style={{ color: "#8a8f99" }}>{managerTitle}</span>
                  ) : null}
                </span>
              </div>
            </div>
            <div className={`${styles.kvRow} ${styles.kvRowFull}`}>
              <div className={styles.kvKey}>FAX</div>
              <div className={styles.kvVal}>
                {renderText("recipientFax", "", { placeholder: "FAX" })}
              </div>
            </div>
          </div>
        </section>

        {/* 공급자 정보 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>공급자 정보</div>
          </div>
          <div className={styles.kvGrid}>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>상호</div>
              <div className={styles.kvVal}>
                {renderText("orgBusinessName", organization?.businessName || organization?.name || "")}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>등록번호</div>
              <div className={styles.kvVal}>
                {renderText("orgRegistrationNumber", organization?.registrationNumber || "")}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>대표이사</div>
              <div className={styles.kvVal}>
                {renderText("orgRepresentativeName", organization?.representativeName || "")}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>종목</div>
              <div className={styles.kvVal}>
                {renderText("orgBusinessType", organization?.businessType || "")}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>TEL</div>
              <div className={styles.kvVal}>
                {renderText("orgTel", organization?.phoneNumber || "")}
              </div>
            </div>
            <div className={styles.kvRow}>
              <div className={styles.kvKey}>FAX</div>
              <div className={styles.kvVal}>{renderText("orgFax", organization?.faxNumber || "")}</div>
            </div>
            <div className={`${styles.kvRow} ${styles.kvRowFull}`}>
              <div className={styles.kvKey}>주소</div>
              <div className={styles.kvVal}>{renderText("orgAddress", organization?.address || "")}</div>
            </div>
            <div className={`${styles.kvRow} ${styles.kvRowFull}`}>
              <div className={styles.kvKey}>입금계좌</div>
              <div className={styles.kvVal}>
                {renderText("orgDepositAccount", organization?.depositAccount || "")}
              </div>
            </div>
          </div>
        </section>

        {/* 견적 내역 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>견적 내역</div>
            <div className={styles.sectionUnit}>단위: 원</div>
          </div>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th style={{ width: "22%" }}>회원권명</th>
                <th style={{ width: "14%" }}>{tradeType}금액</th>
                <th>명의개서료</th>
                <th>중개수수료</th>
                <th>인지세</th>
                <th>기타비용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.tdCenter}>
                  <span className={styles.tdNameMain}>{clubName}</span>
                  {membershipName ? (
                    <span className={styles.tdNameSub}>{membershipName}</span>
                  ) : null}
                </td>
                <td className={styles.tdNum}>{renderNumWithAuto(price, onPriceChange)}</td>
                <td className={styles.tdNum}>{fmt(transferFeeWon)} 원</td>
                <td className={styles.tdNum}>{renderNumWithAuto(commission, onCommissionChange)}</td>
                <td className={styles.tdNum}>{renderNumWithAuto(stampDuty, onStampDutyChange)}</td>
                <td className={styles.tdNum}>{renderNumWithAuto(otherCosts, onOtherCostsChange)}</td>
              </tr>
              <tr className={styles.sumHead}>
                <td colSpan={2}>합계</td>
                <td colSpan={2}>계약금</td>
                <td colSpan={2}>잔금</td>
              </tr>
              <tr className={styles.sumRow}>
                <td colSpan={2}>{fmt(grandTotal)} 원</td>
                <td colSpan={2}>
                  {renderNumWithAuto(deposit, onDepositChange, {
                    auto: depositAuto,
                    onAutoReset: onDepositAutoReset,
                    autoLabel: "자동(10%)",
                  })}
                </td>
                <td colSpan={2}>{fmt(balance)} 원</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 구비서류 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>{isSell ? "매도시 구비서류" : "매수시 구비서류"}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            {isEditable ? (
              <textarea
                ref={(el) => {
                  if (el) autoResize(el);
                }}
                value={docsValue}
                onChange={(e) => onFieldOverrideChange!(docsKey, e.target.value)}
                onInput={(e) => autoResize(e.currentTarget)}
                rows={4}
                className={styles.editCell}
                style={{ minHeight: "4em", whiteSpace: "pre-wrap", fontSize: 10.5, lineHeight: 1.55 }}
                placeholder={isSell ? "매도시 구비서류" : "매수시 구비서류"}
              />
            ) : (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 10.5,
                  lineHeight: 1.55,
                  color: "var(--sheet-ink-3)",
                }}
              >
                {docsValue || " "}
              </div>
            )}
          </div>
        </section>

        {/* Notes */}
        <div className={styles.notesBlock}>
          {isEditable ? (
            <textarea
              ref={(el) => {
                if (el) autoResize(el);
              }}
              value={notesValue}
              onChange={(e) => onFieldOverrideChange!("disclaimerNotes", e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              rows={2}
              className={styles.editCell}
              style={{ width: "100%", fontSize: 10.5 }}
            />
          ) : (
            notesValue.split("\n").map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>

        {/* Footer */}
        <div className={styles.docFoot}>
          <div className={styles.footInfo}>
            <div className={styles.footName}>
              {renderText(
                "footerCompanyName",
                organization?.businessName || organization?.name || "참존회원권",
                { style: { width: "auto", display: "inline-block", minWidth: 100 } },
              )}
            </div>
            <div className={styles.footLines}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {renderText(
                    "footerLine1",
                    organization?.address || "서울특별시 강남구 삼성로 531, 4층",
                    { style: { width: "100%" } },
                  )}
                </span>
                <span className={styles.footSep}>|</span>
                <b>T.</b>
                <span style={{ flex: "0 0 auto", width: 130 }}>
                  {renderText("footerTel1", organization?.phoneNumber || "02) 6426-2000", {
                    style: { width: "100%" },
                  })}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "nowrap" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {renderText("footerLine2", "제주특별자치도 제주시 다호5길 16, 4층", {
                    style: { width: "100%" },
                  })}
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
      </div>
    );
  },
);

export default EstimateSheet;
