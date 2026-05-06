"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer, Download, RotateCcw, Send } from "lucide-react";
import type { MembershipTrade } from "@/types";
import {
  collectMissingConsultationApprovalFields,
  type ConsultationApprovalStructuralField,
} from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { useApprovalSheetStorage } from "@/hooks/useApprovalSheetStorage";
import { captureSheetAsJpeg, printSheetFitToPage } from "@/utils/sheet-print";
import ApprovalRequestSheet from "../ApprovalRequestSheet";

export interface ApprovalRequestPatch {
  customerName?: string;
  contact?: string;
  offerPrice?: number;
  depositAmount?: number;
}

export interface ApprovalRequestSubmitResult {
  success: boolean;
  errorMessage?: string;
}

interface ApprovalRequestSheetModalProps {
  trade: MembershipTrade | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (trade: MembershipTrade, patch: ApprovalRequestPatch) => Promise<ApprovalRequestSubmitResult>;
}

const STRUCTURAL_LABELS: Record<ConsultationApprovalStructuralField, string> = {
  tradeType: "거래 유형",
  clubId: "골프장",
  membershipId: "회원권",
};

const numFromOverride = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined;
  const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const strFromOverride = (raw: string | undefined): string | undefined => {
  const trimmed = (raw ?? "").trim();
  return trimmed || undefined;
};

export default function ApprovalRequestSheetModal({
  trade,
  isOpen,
  onClose,
  onSubmit,
}: ApprovalRequestSheetModalProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { overrides, setOverride, reset } = useApprovalSheetStorage(
    isOpen ? trade : null,
    user?.name,
    organization,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trade) return null;

  const handlePrint = () => {
    if (!sheetRef.current) return;
    printSheetFitToPage(sheetRef.current);
  };

  const handleJpegDownload = async () => {
    if (!sheetRef.current) return;
    setJpegDownloading(true);
    try {
      const blob = await captureSheetAsJpeg(sheetRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${trade.clubName ?? "회원권"}_승인요청서.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("JPEG 다운로드 에러:", error);
      alert("JPEG 다운로드에 실패했습니다.");
    } finally {
      setJpegDownloading(false);
    }
  };

  const handleReset = () => {
    if (!confirm("입력한 값을 모두 지우고 상담일지 기준 디폴트로 되돌립니다. 계속할까요?")) return;
    reset();
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!trade || !onSubmit) return;
    const { structural } = collectMissingConsultationApprovalFields(trade);
    if (structural.length > 0) {
      setSubmitError(
        `상담일지를 먼저 편집해서 ${structural.map((f) => STRUCTURAL_LABELS[f]).join(", ")}를 선택해 주세요.`,
      );
      return;
    }

    // 양식의 자기쪽(매도/매수) 입력값을 ConsultationEntity 의 핵심 필드로 매핑하여 patch 로 보낸다.
    // 백엔드가 누락된 fillable 필드를 검증하므로 이 patch 가 누락 채움 역할까지 겸한다.
    const isSell = trade.tradeType === "매도";
    const patch: ApprovalRequestPatch = {
      customerName: strFromOverride(isSell ? overrides.sellCompany : overrides.buyCompany),
      contact: strFromOverride(isSell ? overrides.sellContact : overrides.buyContact),
      offerPrice: numFromOverride(isSell ? overrides.outAmount : overrides.inAmount),
      depositAmount: numFromOverride(isSell ? overrides.outDeposit : overrides.inDeposit),
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onSubmit(trade, patch);
      if (!result.success) {
        setSubmitError(result.errorMessage || "승인 요청에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 print:static print:z-auto">
      {/* dim */}
      <div
        className="absolute inset-0 bg-black/40 print:hidden"
        onClick={onClose}
      />

      {/* container */}
      <div className="relative h-full w-full overflow-y-auto print:overflow-visible">
        <div className="mx-auto my-6 max-w-[1100px] px-4 print:my-0 print:max-w-none print:px-0">
          {/* toolbar */}
          <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-md print:hidden">
            <div>
              <h2 className="text-base font-semibold text-gray-900">회원권 거래 승인요청서</h2>
              <p className="text-xs text-gray-500">
                {trade.clubName ?? ""} {trade.membershipType ?? ""} · {trade.customerName} · {trade.tradeType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                초기화
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-3.5 w-3.5" />
                인쇄
              </button>
              <button
                type="button"
                onClick={handleJpegDownload}
                disabled={jpegDownloading}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" />
                {jpegDownloading ? "다운로드 중…" : "JPEG"}
              </button>
              {onSubmit && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "전송 중…" : "승인 요청 보내기"}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {submitError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700 print:hidden">
              {submitError}
            </div>
          )}

          {/* sheet */}
          <div className="rounded-lg bg-white shadow-md print:rounded-none print:shadow-none">
            <ApprovalRequestSheet
              ref={sheetRef}
              overrides={overrides}
              onChange={setOverride}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
