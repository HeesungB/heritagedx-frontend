"use client";

import { forwardRef } from "react";
import { ClubDetail } from "@/types";
import { Organization } from "@/types/organization";
import { parseTransferFee } from "@heritage-dx/utils";

const inlineInputCls =
  "bg-transparent border-none outline-none w-full hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors";
const inlineNumberCls =
  "bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 tabular-nums transition-colors";

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

interface EstimateSheetProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  recipient?: string;
  price: number;
  commission: number;
  acqTax: number;
  stampDuty: number;
  otherCosts: number;
  deposit: number;
  organization: Organization | null;
  userName?: string;
  managerTitle?: string;
  tradeType?: "매수" | "매도";
  // Inline editing callbacks (all optional)
  onRecipientChange?: (value: string) => void;
  onManagerTitleChange?: (value: string) => void;
  onTradeTypeChange?: (value: "매수" | "매도") => void;
  onPriceChange?: (raw: string) => void;
  onCommissionChange?: (raw: string) => void;
  onAcqTaxChange?: (raw: string) => void;
  onStampDutyChange?: (raw: string) => void;
  onOtherCostsChange?: (raw: string) => void;
  onDepositChange?: (raw: string) => void;
  acqTaxAuto?: boolean;
  depositAuto?: boolean;
  onAcqTaxAutoReset?: () => void;
  onDepositAutoReset?: () => void;
  // Data field overrides
  fieldOverrides?: Record<string, string>;
  onFieldOverrideChange?: (key: string, value: string) => void;
}

const EstimateSheet = forwardRef<HTMLDivElement, EstimateSheetProps>(
  function EstimateSheet(
    {
      detail,
      selectedMembershipIndex,
      recipient,
      price,
      commission,
      acqTax,
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
      onAcqTaxChange,
      onStampDutyChange,
      onOtherCostsChange,
      onDepositChange,
      acqTaxAuto,
      depositAuto,
      onAcqTaxAutoReset,
      onDepositAutoReset,
      fieldOverrides,
      onFieldOverrideChange,
    },
    ref,
  ) {
    const isSell = tradeType === "매도";
    const membership = detail.memberships?.[selectedMembershipIndex];
    const membershipNameOriginal =
      membership?.membershipName || membership?.membershipType || "";
    const clubNameOriginal = detail.name || "";

    // Resolve overridden data fields
    const resolveField = (key: string, original: string) =>
      fieldOverrides && key in fieldOverrides ? fieldOverrides[key] : original;

    const clubName = resolveField("clubName", clubNameOriginal);
    const membershipName = resolveField("membershipName", membershipNameOriginal);

    const transferFeeWon = parseTransferFee(detail.costs.registrationFee) * 10000;
    const effectiveAcqTax = isSell ? 0 : acqTax;
    const totalExtra = transferFeeWon + commission + effectiveAcqTax + stampDuty + otherCosts;
    const grandTotal = price + totalExtra;
    const balance = grandTotal - deposit;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;

    const fmt = (n: number) => {
      if (!n) return "";
      return `${n.toLocaleString("ko-KR")}원`;
    };

    const fmtNum = (n: number) => {
      if (!n) return "";
      return n.toLocaleString("ko-KR");
    };

    const handleNumInput = (value: string, onChange: (raw: string) => void) => {
      onChange(value.replace(/[^0-9]/g, ""));
    };

    const thCls =
      "bg-gray-100 border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-600 whitespace-nowrap text-center";
    const tdCls = "border border-gray-300 px-2 py-1.5 text-xs";
    const thAccent =
      "bg-gray-100 border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap text-center";

    const isDataEditable = !!onFieldOverrideChange;

    const sectionTitleCls = "font-semibold text-gray-800 text-sm ml-1.5";
    const renderSectionTitle = (key: string, defaultLabel: string) =>
      isDataEditable ? (
        <input
          type="text"
          value={resolveField(key, defaultLabel)}
          onChange={(e) => onFieldOverrideChange!(key, e.target.value)}
          className={`${sectionTitleCls} bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors`}
        />
      ) : (
        <span className={sectionTitleCls}>{resolveField(key, defaultLabel)}</span>
      );

    // 테이블 th 라벨 편집
    const editableLabel = (key: string, defaultLabel: string) =>
      isDataEditable ? (
        <input
          type="text"
          value={resolveField(`label_${key}`, defaultLabel)}
          onChange={(e) => onFieldOverrideChange!(`label_${key}`, e.target.value)}
          className="bg-transparent border-none outline-none w-full hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors text-inherit font-inherit text-xs text-center"
        />
      ) : defaultLabel;

    const renderNumCell = (
      value: number,
      onChange?: (raw: string) => void,
      extra?: { auto?: boolean; onAutoReset?: () => void; autoLabel?: string },
    ) => (
      <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>
        {onChange ? (
          <div>
            <div className="flex items-center gap-0.5">
              <input
                type="text"
                value={fmtNum(value)}
                onChange={(e) => handleNumInput(e.target.value, onChange)}
                className={inlineNumberCls}
                placeholder="0"
              />
              <span className="flex-shrink-0">원</span>
            </div>
            {extra?.auto === false && extra.onAutoReset && (
              <button
                type="button"
                onClick={extra.onAutoReset}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline mt-0.5 print:hidden"
              >
                {extra.autoLabel || "자동계산"}
              </button>
            )}
          </div>
        ) : (
          fmt(value)
        )}
      </td>
    );

    // Number of "부대비용" sub-columns
    const extraCols = isSell ? 4 : 5;

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm print:p-4 print:max-w-none print:m-0"
      >
        {/* 제목 영역 */}
        <div className="border-t-4 border-emerald-600 mb-6">
          <h1 className="text-center text-xl font-bold py-4 text-gray-800">
            {isDataEditable ? (
              <input
                type="text"
                value={clubName}
                onChange={(e) => onFieldOverrideChange!("clubName", e.target.value)}
                className={`${inlineInputCls} inline-block text-center text-xl font-bold w-auto max-w-xs`}
                style={{ width: `${Math.max(clubName.length, 4)}em` }}
              />
            ) : (
              clubName
            )}{" "}
            회원권{" "}
            {onTradeTypeChange ? (
              <button
                type="button"
                onClick={() =>
                  onTradeTypeChange(tradeType === "매수" ? "매도" : "매수")
                }
                className="text-emerald-600 underline decoration-emerald-300 cursor-pointer hover:text-emerald-700 print:no-underline print:text-gray-800 transition-colors"
              >
                {tradeType}
              </button>
            ) : (
              tradeType
            )}{" "}
            견적서
          </h1>
        </div>

        {/* 수신 / 공급자 정보 (단일 테이블) */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "3%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <tbody>
              {/* 1행: 수신 / 등록번호 + 대표이사 */}
              <tr>
                <td className={thCls}>{editableLabel("recipient", "수  신")}</td>
                <td className={tdCls}>
                  {onRecipientChange ? (
                    <input
                      type="text"
                      value={recipient || ""}
                      onChange={(e) => onRecipientChange(e.target.value)}
                      placeholder="수신자"
                      className={inlineInputCls}
                    />
                  ) : (
                    recipient || ""
                  )}
                </td>
                <td
                  rowSpan={5}
                  className="bg-emerald-700 border border-gray-300 text-white text-sm font-bold text-center align-middle"
                  style={{ writingMode: "vertical-rl", letterSpacing: "0.2em" }}
                >
                  {isDataEditable ? (
                    <input type="text" value={resolveField("label_supplier", "공급자")} onChange={(e) => onFieldOverrideChange!("label_supplier", e.target.value)} className="bg-transparent border-none outline-none w-full text-center text-white hover:bg-emerald-600 focus:bg-emerald-600 focus:ring-1 focus:ring-white rounded transition-colors" style={{ writingMode: "vertical-rl" }} />
                  ) : "공급자"}
                </td>
                <td className={thCls}>{editableLabel("orgRegistrationNumber", "등 록 번 호")}</td>
                <td className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgRegistrationNumber", organization?.registrationNumber || "")} onChange={(e) => onFieldOverrideChange!("orgRegistrationNumber", e.target.value)} className={inlineInputCls} placeholder="등록번호" />
                  ) : (organization?.registrationNumber || "")}
                </td>
                <td className={thCls}>{editableLabel("orgRepresentativeName", "대 표 이 사")}</td>
                <td className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgRepresentativeName", organization?.representativeName || "")} onChange={(e) => onFieldOverrideChange!("orgRepresentativeName", e.target.value)} className={inlineInputCls} placeholder="대표이사" />
                  ) : (
                    <>
                      {organization?.representativeName || ""}
                      {organization?.logoUrl && (
                        <img src={organization.logoUrl} alt="직인" className="inline-block h-14 ml-2 align-middle opacity-80" />
                      )}
                    </>
                  )}
                </td>
              </tr>
              {/* 2행: 견적일자 / 상호 */}
              <tr>
                <td className={thCls}>{editableLabel("estimateDate", "견 적 일 자")}</td>
                <td className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("estimateDate", formattedDate)} onChange={(e) => onFieldOverrideChange!("estimateDate", e.target.value)} className={inlineInputCls} />
                  ) : formattedDate}
                </td>
                <td className={thCls}>{editableLabel("orgBusinessName", "상  호")}</td>
                <td colSpan={3} className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgBusinessName", organization?.businessName || organization?.name || "")} onChange={(e) => onFieldOverrideChange!("orgBusinessName", e.target.value)} className={inlineInputCls} placeholder="상호" />
                  ) : (organization?.businessName || organization?.name || "")}
                </td>
              </tr>
              {/* 3행: 담당자 / 주소 */}
              <tr>
                <td className={thCls}>{editableLabel("manager", "담 당 자")}</td>
                <td className={tdCls}>
                  <span className="inline-flex items-center gap-1">
                    {isDataEditable ? (
                      <input type="text" value={resolveField("managerName", userName || "")} onChange={(e) => onFieldOverrideChange!("managerName", e.target.value)} placeholder="이름" className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors w-20" />
                    ) : (
                      <span>{userName || ""}</span>
                    )}
                    {onManagerTitleChange ? (
                      <input
                        type="text"
                        value={managerTitle || ""}
                        onChange={(e) => onManagerTitleChange(e.target.value)}
                        placeholder="직책"
                        className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors w-16"
                      />
                    ) : (
                      managerTitle ? <span>{managerTitle}</span> : null
                    )}
                  </span>
                </td>
                <td className={thCls}>{editableLabel("orgAddress", "주  소")}</td>
                <td colSpan={3} className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgAddress", organization?.address || "")} onChange={(e) => onFieldOverrideChange!("orgAddress", e.target.value)} className={inlineInputCls} placeholder="주소" />
                  ) : (organization?.address || "")}
                </td>
              </tr>
              {/* 4행: 연락처 / 종목 */}
              <tr>
                <td className={thCls}>{editableLabel("orgPhone", "연 락 처")}</td>
                <td className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgPhone", organization?.phoneNumber || "")} onChange={(e) => onFieldOverrideChange!("orgPhone", e.target.value)} className={inlineInputCls} placeholder="연락처" />
                  ) : (organization?.phoneNumber || "")}
                </td>
                <td className={thCls}>{editableLabel("orgBusinessType", "종  목")}</td>
                <td colSpan={3} className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgBusinessType", organization?.businessType || "")} onChange={(e) => onFieldOverrideChange!("orgBusinessType", e.target.value)} className={inlineInputCls} placeholder="종목" />
                  ) : (organization?.businessType || "")}
                </td>
              </tr>
              {/* 5행: FAX / TEL */}
              <tr>
                <td className={thCls}>{editableLabel("orgFax", "F A X")}</td>
                <td className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgFax", organization?.faxNumber || "")} onChange={(e) => onFieldOverrideChange!("orgFax", e.target.value)} className={inlineInputCls} placeholder="FAX" />
                  ) : (organization?.faxNumber || "")}
                </td>
                <td className={thCls}>{editableLabel("orgTel", "T E L")}</td>
                <td colSpan={3} className={tdCls}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgTel", organization?.phoneNumber || "")} onChange={(e) => onFieldOverrideChange!("orgTel", e.target.value)} className={inlineInputCls} placeholder="TEL" />
                  ) : (organization?.phoneNumber || "")}
                </td>
              </tr>
              {/* 6행: 입금계좌 (전체 너비) */}
              <tr>
                <td className={thCls}>{editableLabel("orgDepositAccount", "입 금 계 좌")}</td>
                <td colSpan={6} className={`${tdCls} text-center font-semibold`}>
                  {isDataEditable ? (
                    <input type="text" value={resolveField("orgDepositAccount", organization?.depositAccount || "")} onChange={(e) => onFieldOverrideChange!("orgDepositAccount", e.target.value)} className={`${inlineInputCls} text-center font-semibold`} placeholder="입금계좌" />
                  ) : (organization?.depositAccount || "")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="text-center text-sm text-emerald-800 py-3 bg-emerald-50 border border-emerald-200 rounded mb-6">
          {isDataEditable ? (
            <input
              type="text"
              value={resolveField("estimateIntro", "의뢰하신 件에 대하여 아래와 같이 견적합니다.")}
              onChange={(e) => onFieldOverrideChange!("estimateIntro", e.target.value)}
              className="bg-transparent border-none outline-none w-full text-center hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
            />
          ) : (
            resolveField("estimateIntro", "의뢰하신 件에 대하여 아래와 같이 견적합니다.")
          )}
        </div>

        {/* 견적 내역 */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-base align-middle">🔑</span>
            {renderSectionTitle("sectionEstimate", "견적 내역")}
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              {!isSell && <col />}
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className={thAccent} rowSpan={2}>
                  {editableLabel("membershipCol", "회원권명")}
                </th>
                <th className={thAccent} rowSpan={2}>
                  {editableLabel("priceCol", `${tradeType}금액`)}
                  <br />
                  <span className="text-xs font-normal text-gray-500">(VAT포함)</span>
                </th>
                <th className={thAccent} colSpan={extraCols}>
                  {editableLabel("extraCostsCol", "부대비용")}
                </th>
              </tr>
              <tr>
                <th className={thAccent}>{editableLabel("transferFeeCol", "명의개서료")}</th>
                <th className={thAccent}>{editableLabel("commissionCol", "중개수수료")}</th>
                {!isSell && <th className={thAccent}>{editableLabel("acqTaxCol", "취득세")}</th>}
                <th className={thAccent}>{editableLabel("stampDutyCol", "인지세")}</th>
                <th className={thAccent}>{editableLabel("otherCostsCol", "기타비용")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${tdCls} text-center font-medium`}>
                  {isDataEditable ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <input
                        type="text"
                        value={clubName}
                        onChange={(e) => onFieldOverrideChange!("clubName", e.target.value)}
                        className="bg-transparent border-none outline-none text-center font-medium hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors w-full"
                      />
                      {membershipName !== undefined && (
                        <input
                          type="text"
                          value={membershipName}
                          onChange={(e) => onFieldOverrideChange!("membershipName", e.target.value)}
                          placeholder="회원권 종류"
                          className="bg-transparent border-none outline-none text-center text-xs text-gray-500 hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors w-full"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {clubName}
                      {membershipName && (
                        <>
                          <br />
                          <span className="text-xs text-gray-500">
                            ({membershipName})
                          </span>
                        </>
                      )}
                    </>
                  )}
                </td>
                {renderNumCell(price, onPriceChange)}
                <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>{fmt(transferFeeWon)}</td>
                {renderNumCell(commission, onCommissionChange)}
                {!isSell &&
                  renderNumCell(acqTax, onAcqTaxChange, {
                    auto: acqTaxAuto,
                    onAutoReset: onAcqTaxAutoReset,
                    autoLabel: "자동(2.2%)",
                  })}
                {renderNumCell(stampDuty, onStampDutyChange)}
                {renderNumCell(otherCosts, onOtherCostsChange)}
              </tr>
              {/* 합계 / 계약금 / 잔금 요약 행 (가로) */}
              <tr>
                <th colSpan={isSell ? 3 : 3} className={thAccent}>{editableLabel("totalCol", "합계")}</th>
                <th colSpan={isSell ? 2 : 3} className={thAccent}>{editableLabel("depositCol", "계약금")}</th>
                <th colSpan={isSell ? 2 : 1} className={thAccent}>{editableLabel("balanceCol", "잔금")}</th>
              </tr>
              <tr>
                <td colSpan={isSell ? 3 : 3} className={`${tdCls} text-right tabular-nums font-semibold`}>{fmt(grandTotal)}</td>
                <td colSpan={isSell ? 2 : 3} className={`${tdCls} text-right tabular-nums font-medium`}>
                  {onDepositChange ? (
                    <div>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="text"
                          value={fmtNum(deposit)}
                          onChange={(e) => handleNumInput(e.target.value, onDepositChange)}
                          className={inlineNumberCls}
                          placeholder="0"
                        />
                        <span className="flex-shrink-0">원</span>
                      </div>
                      {depositAuto === false && onDepositAutoReset && (
                        <button
                          type="button"
                          onClick={onDepositAutoReset}
                          className="text-[10px] text-gray-400 hover:text-gray-600 underline mt-0.5 print:hidden"
                        >
                          자동(10%)
                        </button>
                      )}
                    </div>
                  ) : (
                    fmt(deposit)
                  )}
                </td>
                <td colSpan={isSell ? 2 : 1} className={`${tdCls} text-right tabular-nums font-semibold`}>{fmt(balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 구비서류 */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-base align-middle">🔑</span>
            {renderSectionTitle("sectionDocuments", isSell ? "매도시 구비서류" : "매수시 구비서류")}
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className={`${tdCls} whitespace-pre-wrap`} style={{ minHeight: 80 }}>
                  {isDataEditable ? (
                    <textarea
                      ref={(el) => { if (el) autoResize(el); }}
                      value={resolveField(
                        isSell ? "sellerDocuments" : "buyerDocuments",
                        (isSell ? membership?.sellerDocuments : membership?.buyerDocuments) || "",
                      )}
                      onChange={(e) =>
                        onFieldOverrideChange!(
                          isSell ? "sellerDocuments" : "buyerDocuments",
                          e.target.value,
                        )
                      }
                      onInput={(e) => autoResize(e.currentTarget)}
                      className={`${inlineInputCls} resize-none overflow-hidden min-h-[4em]`}
                      rows={4}
                    />
                  ) : (
                    (isSell
                      ? (membership?.sellerDocuments || "\u00A0")
                      : (membership?.buyerDocuments || "\u00A0"))
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="text-xs text-gray-500 space-y-1 mb-8 pl-1">
          {isDataEditable ? (
            <textarea
              ref={(el) => { if (el) autoResize(el); }}
              value={resolveField(
                "disclaimerNotes",
                [
                  "* 상기 견적 금액은 시장 상황에 따라 변동될 수 있습니다.",
                  ...(!isSell ? ["* 취득세는 매수금액 기준 2.2% (농어촌특별세 포함)로 산출되었습니다."] : []),
                  "* 계약금 입금 후 잔금은 명의개서일 전일까지 입금 부탁드립니다.",
                ].join("\n"),
              )}
              onChange={(e) => onFieldOverrideChange!("disclaimerNotes", e.target.value)}
              onInput={(e) => autoResize(e.currentTarget)}
              className={`${inlineInputCls} resize-none overflow-hidden text-xs text-gray-500`}
              rows={3}
            />
          ) : (
            <>
              <p>* 상기 견적 금액은 시장 상황에 따라 변동될 수 있습니다.</p>
              {!isSell && <p>* 취득세는 매수금액 기준 2.2% (농어촌특별세 포함)로 산출되었습니다.</p>}
              <p>* 계약금 입금 후 잔금은 명의개서일 전일까지 입금 부탁드립니다.</p>
            </>
          )}
        </div>

        {/* 하단 로고 및 연락처 */}
        <div className="pt-4 border-t border-gray-200">
          <table className="w-full text-xs text-gray-500">
            <tbody>
              <tr>
                <td className="align-middle" style={{ width: 120 }}>
                  {organization?.logoUrl ? (
                    <img
                      src={organization.logoUrl}
                      alt="logo"
                      className="h-8 object-contain"
                    />
                  ) : (
                    <>
                      <span className="inline-block w-8 h-8 bg-emerald-700 rounded-full text-white font-bold text-xs text-center leading-8 align-middle">
                        참존
                      </span>
                    </>
                  )}
                  {isDataEditable ? (
                    <input
                      type="text"
                      value={resolveField("footerCompanyName", organization?.businessName || organization?.name || "참존회원권")}
                      onChange={(e) => onFieldOverrideChange!("footerCompanyName", e.target.value)}
                      className="bg-transparent border-none outline-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 transition-colors font-semibold text-emerald-700 w-20 ml-1"
                    />
                  ) : (
                    <span className="font-semibold text-emerald-700 ml-2">
                      {organization?.businessName || organization?.name || "참존회원권"}
                    </span>
                  )}
                </td>
                <td className="text-right align-top">
                  {isDataEditable ? (
                    <>
                      <input
                        type="text"
                        value={resolveField("footerLine1", `${organization?.address || "서울특별시 강남구 삼성로 531, 4층"}   T. ${organization?.phoneNumber || "02) 6426 - 2000"}`)}
                        onChange={(e) => onFieldOverrideChange!("footerLine1", e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
                      />
                      <input
                        type="text"
                        value={resolveField("footerLine2", `${organization?.faxNumber ? `FAX. ${organization.faxNumber}` : "제주 : 제주특별자치도 제주시 다호5길 16, 4층   T. 064) 900 - 2244"}`)}
                        onChange={(e) => onFieldOverrideChange!("footerLine2", e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors"
                      />
                    </>
                  ) : (
                    <>
                      <p>서울 : 서울특별시 강남구 삼성로 531, 4층 &nbsp;&nbsp; T. 02) 6426 - 2000</p>
                      <p>제주 : 제주특별자치도 제주시 다호5길 16, 4층 &nbsp;&nbsp; T. 064) 900 - 2244</p>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

export default EstimateSheet;
