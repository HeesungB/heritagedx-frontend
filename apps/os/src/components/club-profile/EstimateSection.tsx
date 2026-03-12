"use client";

import { useState, useRef, useEffect } from "react";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import { ClubDetail } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import EstimateSheet from "../EstimateSheet";
import { trackEvent } from "@/lib/gtag";

interface EstimateSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  fieldOverrides: Record<string, string>;
  onFieldOverrideChange: (key: string, value: string) => void;
}

export default function EstimateSection({
  detail,
  selectedMembershipIndex,
  fieldOverrides,
  onFieldOverrideChange,
}: EstimateSectionProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);

  // 취득세 자동계산 여부 추적
  const [acqTaxAuto, setAcqTaxAuto] = useState(true);
  // 계약금 자동계산 여부 추적
  const [depositAuto, setDepositAuto] = useState(true);

  const recipient = fieldOverrides.recipient || "";
  const price = fieldOverrides.price || "";
  const commission = fieldOverrides.commission || "";
  const acqTax = fieldOverrides.acqTax || "";
  const stampDuty = fieldOverrides.stampDuty || "";
  const otherCosts = fieldOverrides.otherCosts || "";
  const deposit = fieldOverrides.deposit || "";
  const managerTitle = fieldOverrides.managerTitle || "";
  const tradeType = (fieldOverrides.tradeType as "매수" | "매도") || "매수";

  const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
  const commissionNum = parseInt(commission.replace(/[^0-9]/g, ""), 10) || 0;
  const acqTaxNum = parseInt(acqTax.replace(/[^0-9]/g, ""), 10) || 0;
  const stampDutyNum = parseInt(stampDuty.replace(/[^0-9]/g, ""), 10) || 0;
  const otherCostsNum = parseInt(otherCosts.replace(/[^0-9]/g, ""), 10) || 0;
  const depositNum = parseInt(deposit.replace(/[^0-9]/g, ""), 10) || 0;

  // 매도 시 취득세 강제 0
  useEffect(() => {
    if (tradeType === "매도") {
      onFieldOverrideChange("acqTax", "0");
    } else if (acqTaxAuto && priceNum > 0) {
      const autoAcqTax = Math.round(priceNum * 0.022);
      onFieldOverrideChange("acqTax", autoAcqTax.toString());
    }
  }, [tradeType]); // eslint-disable-line react-hooks/exhaustive-deps

  // 취득세 자동계산: 매수금액 변경 시
  useEffect(() => {
    if (tradeType === "매도") return;
    if (acqTaxAuto && priceNum > 0) {
      const autoAcqTax = Math.round(priceNum * 0.022);
      onFieldOverrideChange("acqTax", autoAcqTax.toString());
    }
  }, [priceNum, acqTaxAuto]); // eslint-disable-line react-hooks/exhaustive-deps

  // 계약금 자동계산: 합계 변경 시
  useEffect(() => {
    if (depositAuto) {
      const tfWon = parseTransferFeeToWon(detail.costs.registrationFee);
      const effectiveAcqTax = tradeType === "매도" ? 0 : acqTaxNum;
      const grandTotal = priceNum + tfWon + commissionNum + effectiveAcqTax + stampDutyNum + otherCostsNum;
      const autoDeposit = Math.round(grandTotal * 0.1);
      if (autoDeposit > 0) {
        onFieldOverrideChange("deposit", autoDeposit.toString());
      }
    }
  }, [priceNum, commissionNum, acqTaxNum, stampDutyNum, otherCostsNum, depositAuto, detail.costs.registrationFee, tradeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcqTaxChange = (value: string) => {
    setAcqTaxAuto(false);
    onFieldOverrideChange("acqTax", value);
  };

  const handleDepositChange = (value: string) => {
    setDepositAuto(false);
    onFieldOverrideChange("deposit", value);
  };

  const handleJpegDownload = async () => {
    if (!sheetRef.current || !detail) return;
    setJpegDownloading(true);

    try {
      const blob = await captureSheetAsJpeg(sheetRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${detail.name}_견적서.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      trackEvent("estimate_generate", { club_name: detail.name });
    } catch (error) {
      console.error("JPEG 다운로드 에러:", error);
      alert("JPEG 다운로드에 실패했습니다.");
    } finally {
      setJpegDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sheet (inline editing) */}
      <EstimateSheet
        ref={sheetRef}
        detail={detail}
        selectedMembershipIndex={selectedMembershipIndex}
        recipient={recipient || undefined}
        price={priceNum}
        commission={commissionNum}
        acqTax={tradeType === "매도" ? 0 : acqTaxNum}
        stampDuty={stampDutyNum}
        otherCosts={otherCostsNum}
        deposit={depositNum}
        organization={organization}
        userName={user?.name}
        managerTitle={managerTitle || undefined}
        tradeType={tradeType}
        onRecipientChange={(v) => onFieldOverrideChange("recipient", v)}
        onManagerTitleChange={(v) => onFieldOverrideChange("managerTitle", v)}
        onTradeTypeChange={(v) => onFieldOverrideChange("tradeType", v)}
        onPriceChange={(v) => onFieldOverrideChange("price", v)}
        onCommissionChange={(v) => onFieldOverrideChange("commission", v)}
        onAcqTaxChange={handleAcqTaxChange}
        onStampDutyChange={(v) => onFieldOverrideChange("stampDuty", v)}
        onOtherCostsChange={(v) => onFieldOverrideChange("otherCosts", v)}
        onDepositChange={handleDepositChange}
        acqTaxAuto={acqTaxAuto}
        depositAuto={depositAuto}
        onAcqTaxAutoReset={() => setAcqTaxAuto(true)}
        onDepositAutoReset={() => setDepositAuto(true)}
        fieldOverrides={fieldOverrides}
        onFieldOverrideChange={onFieldOverrideChange}
      />

      {/* Actions */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={() => printSheetFitToPage(sheetRef.current!)}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          인쇄하기
        </button>
        <button
          onClick={handleJpegDownload}
          disabled={jpegDownloading}
          className={`flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg transition-colors ${
            jpegDownloading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {jpegDownloading ? "다운로드 중..." : "JPEG 다운로드"}
        </button>
      </div>
    </div>
  );
}

// 명의개서료 문자열 -> 원 단위 변환
function parseTransferFeeToWon(feeStr: string | null | undefined): number {
  if (!feeStr) return 990000;

  if (feeStr.includes("만원")) {
    const match = feeStr.match(/([0-9,]+)/);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ""), 10);
      return isNaN(num) ? 990000 : num * 10000;
    }
  }

  const match = feeStr.match(/([0-9,]+)/);
  if (match) {
    const won = parseInt(match[1].replace(/,/g, ""), 10);
    if (!isNaN(won)) {
      return won >= 10000 ? won : won * 10000;
    }
  }

  return 990000;
}
