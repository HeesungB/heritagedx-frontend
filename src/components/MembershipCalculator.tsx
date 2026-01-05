"use client";

import { useState, useMemo } from "react";
import { formatManwon, parseTransferFee } from "@/utils/formatCurrency";

interface MembershipCalculatorProps {
  transferFee?: string | null;
  recentMarketPrice?: string | null;
  onShowTaxGuide: () => void;
}

type CalculatorMode = "buy" | "sell";

// 양도세 세율표 (2024년 기준)
const TAX_BRACKETS = [
  { max: 14000000, rate: 0.06, deduction: 0 },
  { max: 50000000, rate: 0.15, deduction: 1260000 },
  { max: 88000000, rate: 0.24, deduction: 5760000 },
  { max: 150000000, rate: 0.35, deduction: 15440000 },
  { max: 300000000, rate: 0.38, deduction: 19940000 },
  { max: 500000000, rate: 0.4, deduction: 25940000 },
  { max: 1000000000, rate: 0.42, deduction: 35940000 },
  { max: Infinity, rate: 0.45, deduction: 65940000 },
];

// 기본공제액 (연 1회, 250만원)
const BASIC_DEDUCTION = 2500000;

export default function MembershipCalculator({
  transferFee,
  recentMarketPrice,
  onShowTaxGuide,
}: MembershipCalculatorProps) {
  const [mode, setMode] = useState<CalculatorMode>("buy");
  const [priceManwon, setPriceManwon] = useState<number>(10000);
  const [purchasePriceManwon, setPurchasePriceManwon] = useState<number>(10000); // 판매 시 취득가액

  // 명의개서료 (만원)
  const transferFeeManwon = parseTransferFee(transferFee);

  // 최근 시세에서 초기값 설정
  const getInitialPrice = () => {
    if (recentMarketPrice) {
      const match = recentMarketPrice.match(/([0-9,]+)/);
      if (match) {
        const num = parseInt(match[1].replace(/,/g, ""), 10);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return 10000;
  };

  // 구매 비용 계산
  const buyCalculation = useMemo(() => {
    const priceWon = priceManwon * 10000; // 만원 -> 원

    // 거래수수료 (0.4%)
    const transactionFee = Math.round(priceWon * 0.004);
    const transactionFeeManwon = Math.round(transactionFee / 10000);

    // 인지세 (15만원 고정)
    const stampDuty = 150000;
    const stampDutyManwon = 15;

    // 취득세 (2.2%)
    const acquisitionTax = Math.round(priceWon * 0.022);
    const acquisitionTaxManwon = Math.round(acquisitionTax / 10000);

    // 총 비용 (추가 비용만)
    const additionalCostManwon =
      transactionFeeManwon +
      transferFeeManwon +
      stampDutyManwon +
      acquisitionTaxManwon;

    // 총 비용
    const totalManwon = priceManwon + additionalCostManwon;

    // 비용 부담률 (추가 비용 / 구매가)
    const costRatio = priceManwon > 0 ? (additionalCostManwon / priceManwon) * 100 : 0;

    // 세금 비중 (취득세 / 구매가)
    const taxRatio = priceManwon > 0 ? (acquisitionTaxManwon / priceManwon) * 100 : 0;

    return {
      priceManwon,
      transactionFeeManwon,
      transferFeeManwon,
      stampDutyManwon,
      acquisitionTaxManwon,
      additionalCostManwon,
      totalManwon,
      costRatio,
      taxRatio,
    };
  }, [priceManwon, transferFeeManwon]);

  // 판매 비용 계산
  const sellCalculation = useMemo(() => {
    const priceWon = priceManwon * 10000;
    const purchasePriceWon = purchasePriceManwon * 10000;

    // 거래수수료 (0.4%)
    const transactionFee = Math.round(priceWon * 0.004);
    const transactionFeeManwon = Math.round(transactionFee / 10000);

    // 필요경비 (구매 시 거래수수료 + 명의개서료 + 판매 시 거래수수료)
    const buyTransactionFee = Math.round(purchasePriceWon * 0.004);
    const necessaryExpenses =
      buyTransactionFee + transferFeeManwon * 10000 + transactionFee;

    // 양도차익 = 판매가 - 구매가 - 필요경비
    const capitalGain = priceWon - purchasePriceWon - necessaryExpenses;

    // 과세표준 = 양도차익 - 기본공제 (250만원)
    const taxableAmount = Math.max(0, capitalGain - BASIC_DEDUCTION);

    // 양도세 계산
    let transferTax = 0;
    if (taxableAmount > 0) {
      const bracket =
        TAX_BRACKETS.find((b) => taxableAmount <= b.max) ||
        TAX_BRACKETS[TAX_BRACKETS.length - 1];
      transferTax = Math.round(
        taxableAmount * bracket.rate - bracket.deduction
      );
    }
    const transferTaxManwon = Math.round(transferTax / 10000);

    // 주민세 (양도세의 10%)
    const localTax = Math.round(transferTax * 0.1);
    const localTaxManwon = Math.round(localTax / 10000);

    // 총 세금
    const totalTaxManwon = transferTaxManwon + localTaxManwon;

    // 예상 수령액 = 판매가 - 거래수수료 - 양도세 - 주민세
    const netProceedsManwon =
      priceManwon - transactionFeeManwon - totalTaxManwon;

    // 양도차익 (만원)
    const capitalGainManwon = Math.round(capitalGain / 10000);

    // 예상 이익 = 판매 예상 수령액 - 구매가
    const expectedProfitManwon = netProceedsManwon - purchasePriceManwon;

    // 실수령률 (수령액 / 판매가)
    const netProceedsRatio = priceManwon > 0 ? (netProceedsManwon / priceManwon) * 100 : 0;

    // 세금 비중 (총 세금 / 판매가)
    const taxRatio = priceManwon > 0 ? (totalTaxManwon / priceManwon) * 100 : 0;

    return {
      priceManwon,
      purchasePriceManwon,
      transactionFeeManwon,
      capitalGainManwon,
      taxableAmountManwon: Math.round(taxableAmount / 10000),
      transferTaxManwon,
      localTaxManwon,
      totalTaxManwon,
      netProceedsManwon,
      expectedProfitManwon,
      netProceedsRatio,
      taxRatio,
    };
  }, [priceManwon, purchasePriceManwon, transferFeeManwon]);

  const handlePriceChange = (delta: number) => {
    setPriceManwon((prev) => Math.max(0, prev + delta));
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      setPriceManwon(num);
    } else if (value === "") {
      setPriceManwon(0);
    }
  };

  const handlePurchasePriceChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      setPurchasePriceManwon(num);
    } else if (value === "") {
      setPurchasePriceManwon(0);
    }
  };

  const handlePurchasePriceAdjust = (delta: number) => {
    setPurchasePriceManwon((prev) => Math.max(0, prev + delta));
  };

  const handleReset = () => {
    setPriceManwon(getInitialPrice());
    setPurchasePriceManwon(15000);
  };

  return (
    <div className="space-y-4">
      {/* 탭 선택 */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          onClick={() => setMode("buy")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "buy"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          구매 비용
        </button>
        <button
          onClick={() => setMode("sell")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "sell"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          판매 비용
        </button>
      </div>

      {/* 금액 입력 */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500 mb-4">거래 금액</p>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-2">
            <input
              type="text"
              value={priceManwon.toLocaleString("ko-KR")}
              onChange={(e) => handleInputChange(e.target.value)}
              className="text-4xl font-bold text-right bg-transparent border-none outline-none w-40 focus:ring-0"
            />
            <span className="text-lg text-gray-500">만원</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {formatManwon(priceManwon)}
          </p>
        </div>
        {/* 금액 조절 버튼 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handlePriceChange(100)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            +100만원
          </button>
          <button
            onClick={() => handlePriceChange(1000)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            +1,000만원
          </button>
          <button
            onClick={() => handlePriceChange(10000)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            +1억원
          </button>
          <button
            onClick={() => handlePriceChange(-100)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            -100만원
          </button>
          <button
            onClick={() => handlePriceChange(-1000)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            -1,000만원
          </button>
          <button
            onClick={() => handlePriceChange(-10000)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            -1억원
          </button>
        </div>
      </div>

      {/* 판매 시 취득가액 입력 */}
      {mode === "sell" && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-4">
            구매했을 때 가격은 얼마였나요? (양도세 계산용)
          </p>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-2">
              <input
                type="text"
                value={purchasePriceManwon.toLocaleString("ko-KR")}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                className="text-4xl font-bold text-right bg-transparent border-none outline-none w-40 focus:ring-0"
              />
              <span className="text-lg text-gray-500">만원</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {formatManwon(purchasePriceManwon)}
            </p>
          </div>
          {/* 금액 조절 버튼 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handlePurchasePriceAdjust(100)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              +100만원
            </button>
            <button
              onClick={() => handlePurchasePriceAdjust(1000)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              +1,000만원
            </button>
            <button
              onClick={() => handlePurchasePriceAdjust(10000)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              +1억원
            </button>
            <button
              onClick={() => handlePurchasePriceAdjust(-100)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              -100만원
            </button>
            <button
              onClick={() => handlePurchasePriceAdjust(-1000)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              -1,000만원
            </button>
            <button
              onClick={() => handlePurchasePriceAdjust(-10000)}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              -1억원
            </button>
          </div>
        </div>
      )}

      {/* 화살표 */}
      <div className="flex justify-center">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* 손익 요약 */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700 underline decoration-gray-400">손익 요약</p>
            <p className="text-xs text-gray-500 mt-1">
              {mode === "buy"
                ? `비용 부담률 ${buyCalculation.costRatio.toFixed(1)}% · 세금 비중 ${buyCalculation.taxRatio.toFixed(1)}%`
                : `실수령률 ${sellCalculation.netProceedsRatio.toFixed(1)}% · 세금 비중 ${sellCalculation.taxRatio.toFixed(1)}%`}
            </p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              mode === "buy"
                ? "border-gray-300 text-gray-700"
                : sellCalculation.expectedProfitManwon >= 0
                ? "border-gray-300 text-gray-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            {mode === "buy" ? (
              <>예상 손실 -{buyCalculation.additionalCostManwon.toLocaleString()}만원</>
            ) : (
              <>
                {sellCalculation.expectedProfitManwon >= 0 ? "예상 이익 +" : "예상 손실 "}
                {sellCalculation.expectedProfitManwon.toLocaleString()}만원
              </>
            )}
          </div>
        </div>
      </div>

      {/* 비용 상세 */}
      <div className="p-4 border border-gray-200 rounded-lg">
        {mode === "buy" ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">구매가</span>
              <span className="font-semibold">
                {formatManwon(buyCalculation.priceManwon)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">거래 서비스 비용</span>
              <span className="text-gray-700">
                + {buyCalculation.transactionFeeManwon.toLocaleString()}만원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">명의변경 관련 비용</span>
              <span className="text-gray-700">
                + {buyCalculation.transferFeeManwon.toLocaleString()}만원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">인지세</span>
              <span className="text-gray-700">
                + {buyCalculation.stampDutyManwon}만원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">취득세 (2.2%)</span>
              <span className="text-gray-700">
                + 예상 {buyCalculation.acquisitionTaxManwon.toLocaleString()}
                만원
              </span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">예상 총 비용</span>
              <span className="text-xl font-bold text-gray-900">
                {formatManwon(buyCalculation.totalManwon)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">판매가</span>
              <span className="font-semibold">
                {formatManwon(sellCalculation.priceManwon)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">거래 서비스 비용</span>
              <span className="text-gray-700">
                - {sellCalculation.transactionFeeManwon.toLocaleString()}만원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">양도차익</span>
              <span className="text-gray-700">
                {formatManwon(sellCalculation.capitalGainManwon)}
              </span>
            </div>
            {sellCalculation.capitalGainManwon > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    양도세
                    <button
                      onClick={onShowTaxGuide}
                      className="ml-1 text-blue-500 text-xs hover:underline"
                    >
                      세금 안내
                    </button>
                  </span>
                  <span className="text-gray-700">
                    - 예상 {sellCalculation.transferTaxManwon.toLocaleString()}
                    만원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">주민세 (양도세의 10%)</span>
                  <span className="text-gray-700">
                    - 예상 {sellCalculation.localTaxManwon.toLocaleString()}만원
                  </span>
                </div>
              </>
            )}
            {sellCalculation.capitalGainManwon <= 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                양도차익이 없어 양도세가 발생하지 않습니다.
              </div>
            )}
            <hr className="my-3" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                판매 예상 수령액
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatManwon(sellCalculation.netProceedsManwon)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 버튼 그룹 */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
