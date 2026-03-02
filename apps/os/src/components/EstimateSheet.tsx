"use client";

import { forwardRef } from "react";
import { ClubDetail } from "@/types";
import { Organization } from "@/types/organization";
import { parseTransferFee } from "@heritage-dx/utils";

interface EstimateSheetProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  recipient?: string;
  price: number;
  commission: number;
  acqTax: number;
  stampDuty: number;
  deposit: number;
  organization: Organization | null;
  userName?: string;
  managerTitle?: string;
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
      deposit,
      organization,
      userName,
      managerTitle,
    },
    ref,
  ) {
    const membership = detail.memberships?.[selectedMembershipIndex];
    const membershipName =
      membership?.membershipName || membership?.membershipType || "";
    const clubName = detail.name || "";

    const transferFeeWon = parseTransferFee(detail.costs.registrationFee) * 10000;
    const totalExtra = transferFeeWon + commission + acqTax + stampDuty;
    const grandTotal = price + totalExtra;
    const balance = grandTotal - deposit;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}. ${today.getMonth() + 1}. ${today.getDate()}`;

    const fmt = (n: number) => {
      if (!n) return "";
      return `${n.toLocaleString("ko-KR")}원`;
    };

    const thCls =
      "bg-gray-100 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 whitespace-nowrap";
    const tdCls = "border border-gray-300 px-3 py-2 text-sm";
    const thAccent =
      "bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 whitespace-nowrap text-center";

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-4xl mx-auto font-sans text-sm print:p-4 print:max-w-none print:m-0"
      >
        {/* 제목 영역 */}
        <div className="border-t-4 border-emerald-600 mb-6">
          <h1 className="text-center text-xl font-bold py-4 text-gray-800">
            {clubName} 회원권 매수 견적서
          </h1>
        </div>

        {/* 수신 / 공급자 정보 (단일 테이블) */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <colgroup>
              {/* 좌측: th(수신 등) + td(값) */}
              <col style={{ width: "11%" }} />
              <col style={{ width: "22%" }} />
              {/* 우측: 공급자 세로셀 + th(등록번호 등) + td(값) + th(대표이사) + td(대표이사 값) */}
              <col style={{ width: "3%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <tbody>
              {/* 1행: 수신 / 등록번호 + 대표이사 */}
              <tr>
                <td className={thCls}>수&nbsp;&nbsp;신</td>
                <td className={tdCls}>{recipient || ""}</td>
                <td
                  rowSpan={5}
                  className="bg-emerald-700 border border-gray-300 text-white text-sm font-bold text-center align-middle"
                  style={{ writingMode: "vertical-rl", letterSpacing: "0.2em" }}
                >
                  공급자
                </td>
                <td className={thCls}>등 록 번 호</td>
                <td className={tdCls}>{organization?.registrationNumber || ""}</td>
                <td className={thCls}>대 표 이 사</td>
                <td className={tdCls}>
                  {organization?.representativeName || ""}
                  {organization?.logoUrl && (
                    <img
                      src={organization.logoUrl}
                      alt="직인"
                      className="inline-block h-14 ml-2 align-middle opacity-80"
                    />
                  )}
                </td>
              </tr>
              {/* 2행: 견적일자 / 상호 */}
              <tr>
                <td className={thCls}>견 적 일 자</td>
                <td className={tdCls}>{formattedDate}</td>
                <td className={thCls}>상&nbsp;&nbsp;호</td>
                <td colSpan={3} className={tdCls}>{organization?.businessName || organization?.name || ""}</td>
              </tr>
              {/* 3행: 담당자 / 주소 */}
              <tr>
                <td className={thCls}>담 당 자</td>
                <td className={tdCls}>{userName || ""}{managerTitle && ` ${managerTitle}`}</td>
                <td className={thCls}>주&nbsp;&nbsp;소</td>
                <td colSpan={3} className={tdCls}>{organization?.address || ""}</td>
              </tr>
              {/* 4행: 연락처 / 종목 */}
              <tr>
                <td className={thCls}>연 락 처</td>
                <td className={tdCls}>{organization?.phoneNumber || ""}</td>
                <td className={thCls}>종&nbsp;&nbsp;목</td>
                <td colSpan={3} className={`${tdCls} text-xs`}>{organization?.businessType || ""}</td>
              </tr>
              {/* 5행: FAX / TEL */}
              <tr>
                <td className={thCls}>F&nbsp;A&nbsp;X</td>
                <td className={tdCls}>{organization?.faxNumber || ""}</td>
                <td className={thCls}>T&nbsp;E&nbsp;L</td>
                <td colSpan={3} className={tdCls}>{organization?.phoneNumber || ""}</td>
              </tr>
              {/* 6행: 입금계좌 (전체 너비) */}
              <tr>
                <td className={thCls}>입 금 계 좌</td>
                <td colSpan={6} className={`${tdCls} text-center font-semibold`}>
                  {organization?.depositAccount || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="text-center text-sm text-emerald-800 py-3 bg-emerald-50 border border-emerald-200 rounded mb-6">
          의뢰하신 件에 대하여 아래와 같이 견적합니다.
        </div>

        {/* 견적 내역 */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-lg align-middle">🔑</span>
            <span className="font-semibold text-gray-800 ml-2">견적 내역</span>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className={thAccent} rowSpan={2}>
                  회원권명
                </th>
                <th className={thAccent} rowSpan={2}>
                  매수금액
                  <br />
                  <span className="text-xs font-normal text-gray-500">(VAT포함)</span>
                </th>
                <th className={thAccent} colSpan={4}>
                  부대비용
                </th>
                <th className={thAccent} rowSpan={2}>
                  합계
                </th>
              </tr>
              <tr>
                <th className={thAccent}>명의개서료</th>
                <th className={thAccent}>중개수수료</th>
                <th className={thAccent}>취득세</th>
                <th className={thAccent}>인지세</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${tdCls} text-center font-medium`}>
                  {clubName}
                  {membershipName && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">
                        ({membershipName})
                      </span>
                    </>
                  )}
                </td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(price)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(transferFeeWon)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(commission)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(acqTax)}</td>
                <td className={`${tdCls} text-right tabular-nums`}>{fmt(stampDuty)}</td>
                <td className={`${tdCls} text-right tabular-nums font-semibold`}>
                  {fmt(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 진행 사항 */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-lg align-middle">🔑</span>
            <span className="font-semibold text-gray-800 ml-2">진행 사항</span>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <colgroup>
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th className={thAccent}>합계 (매수+부대/취득세)</th>
                <th className={thAccent}>계약금</th>
                <th className={thAccent}>잔금 (합계-계약금)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${tdCls} text-right tabular-nums font-medium`}>{fmt(grandTotal)}</td>
                <td className={`${tdCls} text-right tabular-nums font-medium`}>{fmt(deposit)}</td>
                <td className={`${tdCls} text-right tabular-nums font-semibold`}>{fmt(balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 매수시 구비서류 */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-emerald-600 text-lg align-middle">🔑</span>
            <span className="font-semibold text-gray-800 ml-2">매수시 구비서류</span>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className={`${tdCls} whitespace-pre-wrap`} style={{ minHeight: 80 }}>
                  {membership?.buyerDocuments || "\u00A0"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="text-xs text-gray-500 space-y-1 mb-8 pl-1">
          <p>* 상기 견적 금액은 시장 상황에 따라 변동될 수 있습니다.</p>
          <p>* 취득세는 매수금액 기준 2.2% (농어촌특별세 포함)로 산출되었습니다.</p>
          <p>* 계약금 입금 후 잔금은 명의개서일 전일까지 입금 부탁드립니다.</p>
        </div>

        {/* 하단 로고 및 연락처 — 혜택지와 동일 */}
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
                      <span className="font-semibold text-emerald-700 ml-2">
                        참존회원권
                      </span>
                    </>
                  )}
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
  },
);

export default EstimateSheet;
