"use client";

import { useState, useRef, useEffect } from "react";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import { ClubDetail } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import EstimateSheet from "../EstimateSheet";
import SheetToolbar from "../sheet-common/SheetToolbar";
import sheetStyles from "../sheet-common/sheet.module.css";
import { trackEvent } from "@/lib/gtag";
import { parseTransferFeeToWon } from "@heritage-dx/utils";

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
  const [depositAuto, setDepositAuto] = useState(true);

  const recipient = fieldOverrides.recipient || "";
  const price = fieldOverrides.price || "";
  const commission = fieldOverrides.commission || "";
  const stampDuty = fieldOverrides.stampDuty || "";
  const otherCosts = fieldOverrides.otherCosts || "";
  const deposit = fieldOverrides.deposit || "";
  const managerTitle = fieldOverrides.managerTitle || "";
  const tradeType = (fieldOverrides.tradeType as "매수" | "매도") || "매수";

  const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
  const commissionNum = parseInt(commission.replace(/[^0-9]/g, ""), 10) || 0;
  const stampDutyNum = parseInt(stampDuty.replace(/[^0-9]/g, ""), 10) || 0;
  const otherCostsNum = parseInt(otherCosts.replace(/[^0-9]/g, ""), 10) || 0;
  const depositNum = parseInt(deposit.replace(/[^0-9]/g, ""), 10) || 0;

  useEffect(() => {
    if (depositAuto) {
      const tfWon = parseTransferFeeToWon(detail.costs.registrationFee);
      const grandTotal = priceNum + tfWon + commissionNum + stampDutyNum + otherCostsNum;
      const autoDeposit = Math.round(grandTotal * 0.1);
      if (autoDeposit > 0) {
        onFieldOverrideChange("deposit", autoDeposit.toString());
      }
    }
  }, [priceNum, commissionNum, stampDutyNum, otherCostsNum, depositAuto, detail.costs.registrationFee, tradeType]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={sheetStyles.sheetStage}>
      <SheetToolbar
        title="견적서"
        onPrint={() => sheetRef.current && printSheetFitToPage(sheetRef.current)}
        onJpeg={handleJpegDownload}
        jpegLoading={jpegDownloading}
      />
      <EstimateSheet
        ref={sheetRef}
        detail={detail}
        selectedMembershipIndex={selectedMembershipIndex}
        recipient={recipient || undefined}
        price={priceNum}
        commission={commissionNum}
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
        onStampDutyChange={(v) => onFieldOverrideChange("stampDuty", v)}
        onOtherCostsChange={(v) => onFieldOverrideChange("otherCosts", v)}
        onDepositChange={handleDepositChange}
        depositAuto={depositAuto}
        onDepositAutoReset={() => setDepositAuto(true)}
        fieldOverrides={fieldOverrides}
        onFieldOverrideChange={onFieldOverrideChange}
      />
    </div>
  );
}
