"use client";

import { useState, useMemo } from "react";
import { formatManwon, parseTransferFee } from "@/utils/formatCurrency";
import { EntityType, TransactionType, CalculatorInput } from "@/types/tax";
import { calculateTax, getScenarioLabel, getResultLabel } from "@/utils/taxCalculator";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import TaxSettingsModal from "./TaxSettingsModal";

interface MembershipCalculatorProps {
  transferFee?: string | null;
  recentMarketPrice?: string | null;
  onShowTaxGuide: () => void;
}

export default function MembershipCalculator({
  transferFee,
  recentMarketPrice,
  onShowTaxGuide,
}: MembershipCalculatorProps) {
  // 거래 주체 및 유형
  const [entityType, setEntityType] = useState<EntityType>("personal");
  const [transactionType, setTransactionType] = useState<TransactionType>("buy");

  // 금액 입력
  const [priceManwon, setPriceManwon] = useState<number>(10000);
  const [acquisitionPriceManwon, setAcquisitionPriceManwon] = useState<number>(10000); // 개인 매도 시 취득가액
  const [bookValueManwon, setBookValueManwon] = useState<number>(10000); // 법인 매도 시 장부가

  // 설정 모달
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 세율 설정
  const { settings, updateSettings, isLoaded } = useTaxSettings();

  // 명의개서료 (만원)
  const transferFeeManwon = parseTransferFee(transferFee);

  // 최근 시세에서 초기값 가져오기
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

  // 계산 결과
  const calculation = useMemo(() => {
    if (!isLoaded) return null;

    const input: CalculatorInput = {
      entityType,
      transactionType,
      transactionPrice: priceManwon,
      transferFee: transferFeeManwon,
    };

    // 매도 시 추가 입력값
    if (transactionType === "sell") {
      if (entityType === "personal") {
        input.acquisitionPrice = acquisitionPriceManwon;
      } else {
        input.bookValue = bookValueManwon;
      }
    }

    return calculateTax(input, settings);
  }, [
    entityType,
    transactionType,
    priceManwon,
    acquisitionPriceManwon,
    bookValueManwon,
    transferFeeManwon,
    settings,
    isLoaded,
  ]);

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

  const handleAcquisitionPriceChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      setAcquisitionPriceManwon(num);
    } else if (value === "") {
      setAcquisitionPriceManwon(0);
    }
  };

  const handleAcquisitionPriceAdjust = (delta: number) => {
    setAcquisitionPriceManwon((prev) => Math.max(0, prev + delta));
  };

  const handleBookValueChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      setBookValueManwon(num);
    } else if (value === "") {
      setBookValueManwon(0);
    }
  };

  const handleBookValueAdjust = (delta: number) => {
    setBookValueManwon((prev) => Math.max(0, prev + delta));
  };

  const handleReset = () => {
    setPriceManwon(getInitialPrice());
    setAcquisitionPriceManwon(15000);
    setBookValueManwon(15000);
  };

  // 손익 계산
  const profitOrLoss = useMemo(() => {
    if (!calculation) return 0;

    if (transactionType === "buy") {
      return -calculation.totalCost; // 매수 시 손실 = 추가 비용
    } else {
      return calculation.summary.profitOrLoss ?? 0;
    }
  }, [calculation, transactionType]);

  // 조정 버튼 렌더링
  const renderAdjustButtons = (onAdjust: (delta: number) => void) => (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => onAdjust(100)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        +100만원
      </button>
      <button
        onClick={() => onAdjust(1000)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        +1,000만원
      </button>
      <button
        onClick={() => onAdjust(10000)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        +1억원
      </button>
      <button
        onClick={() => onAdjust(-100)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        -100만원
      </button>
      <button
        onClick={() => onAdjust(-1000)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        -1,000만원
      </button>
      <button
        onClick={() => onAdjust(-10000)}
        className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
      >
        -1억원
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 헤더 - 설정 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="세율 설정"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* 거래 주체 선택 (개인/법인) */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          onClick={() => setEntityType("personal")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            entityType === "personal"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          개인
        </button>
        <button
          onClick={() => setEntityType("corporate")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            entityType === "corporate"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          법인
        </button>
      </div>

      {/* 거래 유형 선택 (매수/매도) */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          onClick={() => setTransactionType("buy")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            transactionType === "buy"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          매수 (취득)
        </button>
        <button
          onClick={() => setTransactionType("sell")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            transactionType === "sell"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          매도 (양도)
        </button>
      </div>

      {/* 시나리오 표시 */}
      <div className="text-center">
        <span className="inline-block px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          {getScenarioLabel(entityType, transactionType)}
        </span>
      </div>

      {/* 거래 금액 입력 */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500 mb-4">
          {transactionType === "buy" ? "매수 금액" : "매도 금액"}
        </p>
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
          <p className="text-sm text-gray-400 mt-1">{formatManwon(priceManwon)}</p>
        </div>
        {renderAdjustButtons(handlePriceChange)}
      </div>

      {/* 매도 시 추가 입력 - 개인: 취득가액 */}
      {transactionType === "sell" && entityType === "personal" && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-4">
            구매했을 때 가격은 얼마였나요? (양도세 계산용)
          </p>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-2">
              <input
                type="text"
                value={acquisitionPriceManwon.toLocaleString("ko-KR")}
                onChange={(e) => handleAcquisitionPriceChange(e.target.value)}
                className="text-4xl font-bold text-right bg-transparent border-none outline-none w-40 focus:ring-0"
              />
              <span className="text-lg text-gray-500">만원</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {formatManwon(acquisitionPriceManwon)}
            </p>
          </div>
          {renderAdjustButtons(handleAcquisitionPriceAdjust)}
        </div>
      )}

      {/* 매도 시 추가 입력 - 법인: 장부가 */}
      {transactionType === "sell" && entityType === "corporate" && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">
            회원권의 장부가액은 얼마인가요? (법인세 계산용)
          </p>
          <p className="text-xs text-gray-400 mb-4">
            장부가 = 취득원가 + 부대비용 (중개수수료, 명의개서료 등)
          </p>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-2">
              <input
                type="text"
                value={bookValueManwon.toLocaleString("ko-KR")}
                onChange={(e) => handleBookValueChange(e.target.value)}
                className="text-4xl font-bold text-right bg-transparent border-none outline-none w-40 focus:ring-0"
              />
              <span className="text-lg text-gray-500">만원</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{formatManwon(bookValueManwon)}</p>
          </div>
          {renderAdjustButtons(handleBookValueAdjust)}
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
      {calculation && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700 underline decoration-gray-400">
                손익 요약
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {transactionType === "buy"
                  ? `비용 부담률 ${calculation.summary.costRatio.toFixed(1)}% · 세금 비중 ${calculation.summary.taxRatio.toFixed(1)}%`
                  : `실수령률 ${(100 - calculation.summary.costRatio).toFixed(1)}% · 세금 비중 ${calculation.summary.taxRatio.toFixed(1)}%`}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 text-gray-700">
              {profitOrLoss >= 0 ? (
                <>예상 이익 +{profitOrLoss.toLocaleString()}만원</>
              ) : (
                <>예상 손실 {profitOrLoss.toLocaleString()}만원</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 비용 상세 */}
      {calculation && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="space-y-3">
            {/* 기준 금액 */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {transactionType === "buy" ? "매수가" : "매도가"}
              </span>
              <span className="font-semibold">{formatManwon(calculation.basePrice)}</span>
            </div>

            {/* 세금 항목들 */}
            {calculation.items.map((item) => (
              <div key={item.key} className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-gray-600">{item.label}</span>
                  {item.key.includes("Tax") && (
                    <button
                      onClick={onShowTaxGuide}
                      className="ml-1 text-blue-500 text-xs hover:underline"
                    >
                      세금 안내
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <span className="text-gray-700 whitespace-nowrap ml-2">
                  {item.isAddition ? "+" : "-"} {item.amount.toLocaleString()}만원
                </span>
              </div>
            ))}

            {/* 양도차익이 없는 경우 안내 (매도 시) */}
            {transactionType === "sell" &&
              calculation.items.filter((i) =>
                ["capitalGainsTax", "corporateTax"].includes(i.key)
              ).length === 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  양도차익이 없어{" "}
                  {entityType === "personal" ? "양도소득세" : "법인세"}가 발생하지
                  않습니다.
                </div>
              )}

            <hr className="my-3" />

            {/* 결과 */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                {getResultLabel(transactionType)}
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatManwon(calculation.netResult)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 그룹 */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          초기화
        </button>
      </div>

      {/* 세율 설정 모달 */}
      <TaxSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
