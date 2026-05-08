"use client";

import { forwardRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { SheetOverrides } from "@/hooks/settlement-sheet-adapter";

const inlineInputCls =
  "bg-transparent border-none outline-none w-full hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors";
const inlineNumberCls =
  "bg-transparent border-none outline-none w-full text-right hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 tabular-nums transition-colors";

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const fmtNum = (raw: string) => {
  const n = parseInt((raw || "").replace(/[^0-9]/g, ""), 10);
  if (!n) return "";
  return n.toLocaleString("ko-KR");
};

/** 양식 셀의 에러 메시지를 RHF formState 에서 단일 string 으로 추출. */
function useCellError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<SheetOverrides>();
  const entry = errors[name];
  if (!entry) return undefined;
  const msg = (entry as { message?: unknown }).message;
  return typeof msg === "string" ? msg : undefined;
}

const errorRing = "ring-1 ring-red-400 bg-red-50";
const errorText = "mt-0.5 text-[10px] text-red-600 leading-tight whitespace-pre-line";

// 모듈 스코프 셀 컴포넌트들 — reference 가 안정적이라 부모 리렌더에 입력이 끊기지 않는다.
function TextCell({
  keyName,
  placeholder,
  className = "",
}: {
  keyName: string;
  placeholder?: string;
  className?: string;
}) {
  const { register } = useFormContext<SheetOverrides>();
  const error = useCellError(keyName);
  return (
    <>
      <input
        type="text"
        {...register(keyName)}
        placeholder={placeholder}
        className={`${inlineInputCls} ${className} ${error ? errorRing : ""}`}
      />
      {error && <div className={errorText}>{error}</div>}
    </>
  );
}

function NumCell({
  keyName,
  placeholder,
  prefix,
}: {
  keyName: string;
  placeholder?: string;
  prefix?: string;
}) {
  const { control } = useFormContext<SheetOverrides>();
  const error = useCellError(keyName);
  return (
    <div>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-gray-500 flex-shrink-0">{prefix}</span>}
        <Controller
          control={control}
          name={keyName}
          render={({ field }) => (
            <input
              type="text"
              value={fmtNum(field.value ?? "")}
              onChange={(e) =>
                field.onChange(e.target.value.replace(/[^0-9]/g, ""))
              }
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={placeholder ?? "0"}
              className={`${inlineNumberCls} ${error ? errorRing : ""}`}
            />
          )}
        />
      </div>
      {error && <div className={errorText}>{error}</div>}
    </div>
  );
}

function Check({
  groupKey,
  option,
  label,
}: {
  groupKey: string;
  option: string;
  label: string;
}) {
  const { watch, setValue } = useFormContext<SheetOverrides>();
  const error = useCellError(groupKey);
  const selected = watch(groupKey) === option;
  return (
    <button
      type="button"
      onClick={() =>
        setValue(groupKey, selected ? "" : option, { shouldDirty: true })
      }
      className={`inline-flex items-center gap-1 px-1 py-0.5 text-[12px] hover:bg-emerald-50 rounded transition-colors ${selected ? "font-semibold text-gray-900" : "text-gray-600"} ${error ? "ring-1 ring-red-400" : ""}`}
    >
      <span className="font-mono">{selected ? "■" : "□"}</span>
      <span>{label}</span>
    </button>
  );
}

/**
 * inline `<input {...register("...")}/>` 들을 한 곳에서 관리하기 위한 wrapper.
 * 에러 표시(빨간 ring + 메시지) 일관 적용.
 */
function RegisteredInput({
  name,
  placeholder,
  className = "",
  showMessage = true,
}: {
  name: string;
  placeholder?: string;
  className?: string;
  showMessage?: boolean;
}) {
  const { register } = useFormContext<SheetOverrides>();
  const error = useCellError(name);
  return (
    <>
      <input
        type="text"
        {...register(name)}
        placeholder={placeholder}
        className={`${className} ${error ? errorRing : ""}`}
      />
      {error && showMessage && <div className={errorText}>{error}</div>}
    </>
  );
}

const ApprovalRequestSheet = forwardRef<HTMLDivElement>(
  function ApprovalRequestSheet(_props, ref) {
    const { register } = useFormContext<SheetOverrides>();
    const remarksRegister = register("remarks");
    const remarksError = useCellError("remarks");

    const thLabelCls =
      "bg-gray-50 border border-gray-300 px-2 py-1.5 text-[12px] font-semibold text-gray-700 whitespace-nowrap text-center align-middle";
    const tdCls =
      "border border-gray-300 px-2 py-1.5 text-[12px] align-middle";
    const sectionTitleCls =
      "border border-gray-300 px-2 py-2 text-[13px] font-bold text-gray-800 text-center bg-emerald-50";

    return (
      <div
        ref={ref}
        className="bg-white px-6 py-5 mx-auto font-sans text-[12px] text-gray-800 print:p-3 print:m-0"
        style={{ width: "1050px", maxWidth: "100%" }}
      >
        <h1 className="text-center text-lg font-bold mb-2 tracking-wide text-gray-900">
          회원권 거래 승인요청서
        </h1>

        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={`${tdCls} font-semibold`} colSpan={2}>
                <TextCell keyName="companyName" placeholder="㈜참존회원권" />
              </td>
              <td className={tdCls} colSpan={4}></td>
              <td className={`${tdCls} text-right`}>
                <TextCell keyName="date" placeholder="2025. 12. 17." className="text-right" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls} rowSpan={2}>회 원 권 명</td>
              <td className={tdCls} rowSpan={2}>
                <TextCell keyName="membershipName" placeholder="사이프러스 49" />
              </td>
              <td className={thLabelCls}>매도담당</td>
              <td className={tdCls}>
                <TextCell keyName="sellManager" />
              </td>
              <td className={thLabelCls}>매수담당</td>
              <td className={tdCls} colSpan={2}>
                <TextCell keyName="buyManager" />
              </td>
            </tr>
            <tr>
              <td className={`${thLabelCls} leading-tight`}>
                매도성명
                <div className="text-[10px] text-gray-500">(거래처)</div>
              </td>
              <td className={tdCls}>
                <TextCell keyName="sellCompany" />
                <RegisteredInput
                  name="sellContact"
                  placeholder="연락처"
                  className={`${inlineInputCls} mt-0.5 text-[11px] text-gray-400 placeholder:text-gray-300`}
                />
              </td>
              <td className={`${thLabelCls} leading-tight`}>
                매수성명
                <div className="text-[10px] text-gray-500">(거래처)</div>
              </td>
              <td className={tdCls} colSpan={2}>
                <TextCell keyName="buyCompany" />
                <RegisteredInput
                  name="buyContact"
                  placeholder="연락처"
                  className={`${inlineInputCls} mt-0.5 text-[11px] text-gray-400 placeholder:text-gray-300`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 회원권 출금 */}
        <div className={`${sectionTitleCls} mt-2`}>회원권 출금</div>
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={thLabelCls}>구　분</td>
              <td className={tdCls} colSpan={9}>
                <div className="flex items-center gap-4">
                  <Check groupKey="outClassification" option="개인" label="개인" />
                  <Check groupKey="outClassification" option="과세법인" label="과세법인" />
                  <Check groupKey="outClassification" option="비과세법인" label="비과세법인" />
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>회원권 금액</td>
              <td className={tdCls} colSpan={9}>
                <NumCell keyName="outAmount" prefix="₩" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>계 약 금</td>
              <td className={tdCls}>
                <NumCell keyName="outDeposit" prefix="₩" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={7}>
                <TextCell keyName="outDepositDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>수 수 료</td>
              <td className={tdCls}>
                <NumCell keyName="outFee" prefix="₩" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={7}>
                <TextCell keyName="outFeeDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>출금될잔금</td>
              <td className={tdCls}>
                <NumCell keyName="outBalance" prefix="₩" />
              </td>
              <td className={`${thLabelCls} text-[11px]`} colSpan={2}>
                <div className="flex items-center justify-center gap-2">
                  <span>수수료</span>
                  <Check groupKey="outFeeIncluded" option="공제" label="공제" />
                  <Check groupKey="outFeeIncluded" option="비공제" label="비공제" />
                </div>
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="outBalanceDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>출금계좌</td>
              <td className={tdCls}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500">예금주</span>
                  <TextCell keyName="outBankHolder" />
                </div>
              </td>
              <td className={tdCls} colSpan={2}>
                <div className="flex items-center gap-1">
                  <TextCell keyName="outBank" placeholder="" />
                  <span className="text-[11px] text-gray-500 flex-shrink-0">은행</span>
                </div>
              </td>
              <td className={thLabelCls}>계좌번호</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="outAccount" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>기타사항</td>
              <td className={tdCls} colSpan={9}>
                <TextCell keyName="outNote" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 회원권 입금 */}
        <div className={`${sectionTitleCls} mt-2`}>회원권 입금</div>
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={thLabelCls}>구　분</td>
              <td className={tdCls} colSpan={9}>
                <div className="flex items-center gap-4">
                  <Check groupKey="inClassification" option="개인" label="개인" />
                  <Check groupKey="inClassification" option="과세법인" label="과세법인" />
                  <Check groupKey="inClassification" option="비과세법인" label="비과세법인" />
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>회원권 금액</td>
              <td className={tdCls} colSpan={9}>
                <NumCell keyName="inAmount" prefix="₩" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>계 약 금</td>
              <td className={tdCls}>
                <NumCell keyName="inDeposit" prefix="₩" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={7}>
                <TextCell keyName="inDepositDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>수 수 료</td>
              <td className={tdCls}>
                <NumCell keyName="inFee" prefix="₩" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={7}>
                <TextCell keyName="inFeeDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>개 서 료</td>
              <td className={tdCls}>
                <NumCell keyName="inIssueFee" prefix="₩" />
              </td>
              <td className={thLabelCls}>인지</td>
              <td className={tdCls}>
                <div className="flex items-center gap-3">
                  <Check groupKey="inFeePaper" option="포함" label="포함" />
                  <Check groupKey="inFeePaper" option="미포함" label="미포함" />
                </div>
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="inIssueDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>기타부가비용</td>
              <td className={tdCls}>
                <NumCell keyName="inEtcCost" prefix="₩" />
              </td>
              <td className={thLabelCls}>품명</td>
              <td className={tdCls}>
                <TextCell keyName="inItemName" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="inEtcDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>입금될잔금</td>
              <td className={tdCls} colSpan={3}>
                <NumCell keyName="inBalance" prefix="₩" />
              </td>
              <td className={thLabelCls}>일 자</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="inBalanceDate" placeholder="MM월 DD일" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>입금계좌</td>
              <td className={tdCls}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500">예금주</span>
                  <TextCell keyName="inBankHolder" />
                </div>
              </td>
              <td className={tdCls} colSpan={2}>
                <div className="flex items-center gap-1">
                  <TextCell keyName="inBank" placeholder="" />
                  <span className="text-[11px] text-gray-500 flex-shrink-0">은행</span>
                </div>
              </td>
              <td className={thLabelCls}>계좌번호</td>
              <td className={tdCls} colSpan={5}>
                <TextCell keyName="inAccount" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>기타사항</td>
              <td className={tdCls} colSpan={9}>
                <TextCell keyName="inNote" />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 매매계약서 / 세금계산서 / 거래경로 / 수익금 / 세무신고 / 특이사항 */}
        <table className="w-full border-collapse mt-2">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td className={thLabelCls} colSpan={2}>매매계약서</td>
              <td className={tdCls} colSpan={4}>
                <NumCell keyName="contractAmount" prefix="₩" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls} rowSpan={2}>세금계산서</td>
              <td className={thLabelCls}>매출(발행)</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <RegisteredInput
                      name="taxIssueAmount"
                      placeholder="발행금액"
                      className={`${inlineInputCls} w-full`}
                    />
                  </div>
                  <span className="text-gray-500 flex-shrink-0">--&gt;</span>
                  <div className="flex-1">
                    <RegisteredInput
                      name="taxIssueRecipient"
                      placeholder="수령인"
                      className={`${inlineInputCls} w-full`}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>매입(수령)</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <RegisteredInput
                      name="taxReceiveAmount"
                      placeholder="수령금액"
                      className={`${inlineInputCls} w-full`}
                    />
                  </div>
                  <span className="text-gray-500 flex-shrink-0">&lt;--</span>
                  <div className="flex-1">
                    <RegisteredInput
                      name="taxReceiveIssuer"
                      placeholder="발행인"
                      className={`${inlineInputCls} w-full`}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls} rowSpan={2}>거래 경로</td>
              <td className={thLabelCls}>매도자</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex flex-wrap items-center gap-3">
                  <Check groupKey="sellerRoute" option="기존거래자" label="기존거래자" />
                  <div className="flex items-center gap-1">
                    <Check groupKey="sellerRoute" option="소개" label="소개" />
                    <span className="text-gray-400">(</span>
                    <RegisteredInput
                      name="sellerRouteIntro"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none text-[11px] focus:border-emerald-500"
                      showMessage={false}
                    />
                    <span className="text-gray-400">)</span>
                  </div>
                  <Check groupKey="sellerRoute" option="신규T/M" label="신규T/M" />
                  <Check groupKey="sellerRoute" option="문의전화" label="문의전화" />
                  <Check groupKey="sellerRoute" option="기타" label="기타" />
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>매수자</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex flex-wrap items-center gap-3">
                  <Check groupKey="buyerRoute" option="기존거래자" label="기존거래자" />
                  <div className="flex items-center gap-1">
                    <Check groupKey="buyerRoute" option="소개" label="소개" />
                    <span className="text-gray-400">(</span>
                    <RegisteredInput
                      name="buyerRouteIntro"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none text-[11px] focus:border-emerald-500"
                      showMessage={false}
                    />
                    <span className="text-gray-400">)</span>
                  </div>
                  <Check groupKey="buyerRoute" option="신규T/M" label="신규T/M" />
                  <Check groupKey="buyerRoute" option="문의전화" label="문의전화" />
                  <Check groupKey="buyerRoute" option="기타" label="기타" />
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls} rowSpan={2}>수익금</td>
              <td className={tdCls} rowSpan={2}>
                <div className="text-center text-gray-400 text-[11px]">₩</div>
              </td>
              <td className={tdCls}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500 flex-shrink-0">매도수익</span>
                  <NumCell keyName="sellRevenue" />
                  <span className="text-[11px] text-gray-500 flex-shrink-0">만원</span>
                </div>
              </td>
              <td className={tdCls} colSpan={3}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500 flex-shrink-0">매수수익</span>
                  <NumCell keyName="buyRevenue" />
                  <span className="text-[11px] text-gray-500 flex-shrink-0">만원</span>
                </div>
              </td>
            </tr>
            <tr>
              <td className={tdCls}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-gray-500 flex-shrink-0">지　출</span>
                  <NumCell keyName="expense" />
                  <span className="text-[11px] text-gray-500 flex-shrink-0">만원</span>
                </div>
              </td>
              <td className={thLabelCls}>지출내역</td>
              <td className={tdCls} colSpan={2}>
                <TextCell keyName="expenseNote" />
              </td>
            </tr>
            <tr>
              <td className={thLabelCls} rowSpan={2}>세무신고</td>
              <td className={thLabelCls}>양도</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex flex-wrap items-center gap-3">
                  <Check groupKey="transferReport" option="신고필요" label="신고필요" />
                  <Check groupKey="transferReport" option="불필요" label="불필요" />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">신고금액</span>
                    <RegisteredInput
                      name="transferAmount"
                      className="w-24 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">마감일</span>
                    <RegisteredInput
                      name="transferDeadline"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">완료 일자</span>
                    <RegisteredInput
                      name="transferDoneAt"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>취득</td>
              <td className={tdCls} colSpan={4}>
                <div className="flex flex-wrap items-center gap-3">
                  <Check groupKey="acquireReport" option="신고필요" label="신고필요" />
                  <Check groupKey="acquireReport" option="불필요" label="불필요" />
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">신고금액</span>
                    <RegisteredInput
                      name="acquireAmount"
                      className="w-24 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">마감일</span>
                    <RegisteredInput
                      name="acquireDeadline"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-500">완료 일자</span>
                    <RegisteredInput
                      name="acquireDoneAt"
                      className="w-20 bg-transparent border-b border-gray-300 outline-none focus:border-emerald-500"
                      showMessage={false}
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className={thLabelCls}>특이사항</td>
              <td className={tdCls} colSpan={5}>
                <textarea
                  {...remarksRegister}
                  onChange={(e) => {
                    void remarksRegister.onChange(e);
                    autoResize(e.target);
                  }}
                  ref={(el) => {
                    remarksRegister.ref(el);
                    if (el) autoResize(el);
                  }}
                  rows={2}
                  className={`w-full bg-transparent border-none outline-none resize-none hover:bg-emerald-50 focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1 -mx-1 transition-colors ${remarksError ? errorRing : ""}`}
                />
                {remarksError && <div className={errorText}>{remarksError}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
);

export default ApprovalRequestSheet;
