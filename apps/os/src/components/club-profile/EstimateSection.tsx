"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { ClubDetail } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import EstimateSheet from "../EstimateSheet";

interface EstimateSectionProps {
  detail: ClubDetail;
  selectedMembershipIndex: number;
  recipient: string;
  onRecipientChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  commission: string;
  onCommissionChange: (value: string) => void;
  acqTax: string;
  onAcqTaxChange: (value: string) => void;
  stampDuty: string;
  onStampDutyChange: (value: string) => void;
  deposit: string;
  onDepositChange: (value: string) => void;
  managerTitle: string;
  onManagerTitleChange: (value: string) => void;
}

export default function EstimateSection({
  detail,
  selectedMembershipIndex,
  recipient,
  onRecipientChange,
  price,
  onPriceChange,
  commission,
  onCommissionChange,
  acqTax,
  onAcqTaxChange,
  stampDuty,
  onStampDutyChange,
  deposit,
  onDepositChange,
  managerTitle,
  onManagerTitleChange,
}: EstimateSectionProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [isInputSectionOpen, setIsInputSectionOpen] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);

  // 취득세 자동계산 여부 추적
  const [acqTaxAuto, setAcqTaxAuto] = useState(true);
  // 계약금 자동계산 여부 추적
  const [depositAuto, setDepositAuto] = useState(true);

  const priceNum = parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
  const commissionNum = parseInt(commission.replace(/[^0-9]/g, ""), 10) || 0;
  const acqTaxNum = parseInt(acqTax.replace(/[^0-9]/g, ""), 10) || 0;
  const stampDutyNum = parseInt(stampDuty.replace(/[^0-9]/g, ""), 10) || 0;
  const depositNum = parseInt(deposit.replace(/[^0-9]/g, ""), 10) || 0;

  // 취득세 자동계산: 매수금액 변경 시
  useEffect(() => {
    if (acqTaxAuto && priceNum > 0) {
      const autoAcqTax = Math.round(priceNum * 0.022);
      onAcqTaxChange(autoAcqTax.toString());
    }
  }, [priceNum, acqTaxAuto]); // eslint-disable-line react-hooks/exhaustive-deps

  // 계약금 자동계산: 합계 변경 시
  useEffect(() => {
    if (depositAuto) {
      const tfWon = parseTransferFeeToWon(detail.costs.registrationFee);
      const grandTotal = priceNum + tfWon + commissionNum + acqTaxNum + stampDutyNum;
      const autoDeposit = Math.round(grandTotal * 0.1);
      if (autoDeposit > 0) {
        onDepositChange(autoDeposit.toString());
      }
    }
  }, [priceNum, commissionNum, acqTaxNum, stampDutyNum, depositAuto, detail.costs.registrationFee]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAcqTaxChange = (value: string) => {
    setAcqTaxAuto(false);
    onAcqTaxChange(value);
  };

  const handleDepositChange = (value: string) => {
    setDepositAuto(false);
    onDepositChange(value);
  };

  const formatInputValue = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString();
  };

  const handleNumberInput = (
    value: string,
    onChange: (v: string) => void,
  ) => {
    const raw = value.replace(/[^0-9]/g, "");
    onChange(raw);
  };

  const handleJpegDownload = async () => {
    if (!sheetRef.current || !detail) return;
    setJpegDownloading(true);

    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const PAGE_WIDTH = 1050;
      const PAGE_HEIGHT = 1480;
      const fullWidth = canvas.width;
      const fullHeight = canvas.height;

      const scale = PAGE_WIDTH / fullWidth;
      const scaledHeight = Math.round(fullHeight * scale);
      const pageCount = Math.ceil(scaledHeight / PAGE_HEIGHT);

      const pages: Blob[] = [];

      for (let i = 0; i < pageCount; i++) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = PAGE_WIDTH;
        pageCanvas.height = PAGE_HEIGHT;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

        const srcY = Math.round((i * PAGE_HEIGHT) / scale);
        const srcH = Math.round(PAGE_HEIGHT / scale);

        ctx.drawImage(
          canvas,
          0,
          srcY,
          fullWidth,
          Math.min(srcH, fullHeight - srcY),
          0,
          0,
          PAGE_WIDTH,
          Math.min(
            PAGE_HEIGHT,
            Math.round(Math.min(srcH, fullHeight - srcY) * scale),
          ),
        );

        const blob = await new Promise<Blob>((resolve) => {
          pageCanvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
        });
        pages.push(blob);
      }

      if (pages.length === 1) {
        const url = URL.createObjectURL(pages[0]);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${detail.name}_견적서.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        pages.forEach((blob, idx) => {
          zip.file(`${detail.name}_견적서_${idx + 1}.jpg`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${detail.name}_견적서.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("JPEG 다운로드 에러:", error);
      alert("JPEG 다운로드에 실패했습니다.");
    } finally {
      setJpegDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 입력 필드 섹션 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 print:hidden">
        <button
          type="button"
          onClick={() => setIsInputSectionOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
        >
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            견적 정보 입력
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isInputSectionOpen ? "rotate-180" : ""
            }`}
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
        </button>
        {isInputSectionOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수신자
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => onRecipientChange(e.target.value)}
                placeholder="예: 홍길동 님"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 직책
              </label>
              <input
                type="text"
                value={managerTitle}
                onChange={(e) => onManagerTitleChange(e.target.value)}
                placeholder="예: 과장"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매수금액
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatInputValue(price)}
                  onChange={(e) => handleNumberInput(e.target.value, onPriceChange)}
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                중개수수료
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatInputValue(commission)}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, onCommissionChange)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                취득세
                {acqTaxAuto && (
                  <span className="text-xs text-gray-400 ml-1">
                    (매수금액 x 2.2% 자동)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatInputValue(acqTax)}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, handleAcqTaxChange)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
              {!acqTaxAuto && (
                <button
                  type="button"
                  onClick={() => setAcqTaxAuto(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1 underline"
                >
                  자동계산으로 되돌리기
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                인지세
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatInputValue(stampDuty)}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, onStampDutyChange)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계약금
                {depositAuto && (
                  <span className="text-xs text-gray-400 ml-1">
                    (합계 x 10% 자동)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatInputValue(deposit)}
                  onChange={(e) =>
                    handleNumberInput(e.target.value, handleDepositChange)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
              </div>
              {!depositAuto && (
                <button
                  type="button"
                  onClick={() => setDepositAuto(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1 underline"
                >
                  자동계산으로 되돌리기
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 미리보기 구분선 */}
      <div className="flex items-center gap-4 print:hidden">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500 font-medium">미리보기</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* 견적서 시트 */}
      <div ref={sheetRef}>
        <EstimateSheet
          detail={detail}
          selectedMembershipIndex={selectedMembershipIndex}
          recipient={recipient || undefined}
          price={priceNum}
          commission={commissionNum}
          acqTax={acqTaxNum}
          stampDuty={stampDutyNum}
          deposit={depositNum}
          organization={organization}
          userName={user?.name}
          managerTitle={managerTitle || undefined}
        />
      </div>

      {/* 인쇄 / JPEG 다운로드 버튼 */}
      <div className="flex justify-center gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
      // 원 단위가 충분히 크면 그대로, 아니면 만원 단위로 간주
      return won >= 10000 ? won : won * 10000;
    }
  }

  return 990000;
}
