"use client";

import { useEffect, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { X, Printer, Download, RotateCcw, Send } from "lucide-react";
import type { MembershipTrade } from "@/types";
import {
  collectMissingConsultationApprovalFields,
  type ConsultationApprovalStructuralField,
} from "@heritage-dx/store";
import { useSettlementSheet } from "@/hooks/useSettlementSheet";
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
  const { form, reset, commit, markGenerated, isReady, documentGeneratedAt } =
    useSettlementSheet(isOpen ? trade : null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [jpegDownloading, setJpegDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

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

  const handleReset = async () => {
    if (!confirm("저장된 입출금표를 삭제하고 상담일지 기준 초안으로 되돌립니다. 계속할까요?")) return;
    setResetting(true);
    setSubmitError(null);
    try {
      await reset();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "초기화에 실패했습니다.",
      );
    } finally {
      setResetting(false);
    }
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

    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1) 명시적 서버 commit — 입력 중에는 localStorage 에만 저장돼 있고, 이 시점에 한 번 POST/PUT.
      const committed = await commit();
      if (!committed.ok) {
        // 필드 매핑된 에러는 form 에 setError 로 주입되어 양식 셀에 빨간 표시.
        // 매핑 안 되는 메시지(예: 양식 외 필드)만 모달 상단에 합쳐 표시.
        if (committed.unmappedErrors.length > 0) {
          setSubmitError(committed.unmappedErrors.join("\n"));
        } else {
          setSubmitError(
            "입력값을 확인해 주세요. 빨간 표시된 셀의 메시지를 참고하세요.",
          );
        }
        return;
      }

      // 2) 문서 생성 완료 마킹 — 백엔드가 이걸 게이트로 승인 요청 단계로 진행 허용
      // SETTLEMENT_REQUIRED_FIELDS 응답 시 missingFields 가 양식 셀에 빨간 표시로 매핑됨.
      const markedResult = await markGenerated();
      if (!markedResult.ok) {
        setSubmitError(
          markedResult.unmappedErrors.length > 0
            ? markedResult.unmappedErrors.join("\n")
            : "문서 생성 완료 표시에 실패했습니다. 빨간 표시된 셀의 값을 채워주세요.",
        );
        return;
      }

      // 3) 양식의 자기쪽(매도/매수) 입력값을 ConsultationEntity 의 핵심 필드로 매핑하여 patch 로 보낸다.
      const values = form.getValues();
      const isSell = trade.tradeType === "매도";
      const patch: ApprovalRequestPatch = {
        customerName: strFromOverride(isSell ? values.sellCompany : values.buyCompany),
        contact: strFromOverride(isSell ? values.sellContact : values.buyContact),
        offerPrice: numFromOverride(isSell ? values.outAmount : values.inAmount),
        depositAmount: numFromOverride(isSell ? values.outDeposit : values.inDeposit),
      };

      // 4) 기존 requestApproval 흐름 — 양식 자기쪽 핵심 필드 patch + REQUEST_APPROVAL 액션
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
                disabled={resetting || !isReady}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetting ? "초기화 중…" : "초기화"}
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
            <div className="mb-3 whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700 print:hidden">
              {submitError}
            </div>
          )}
          {documentGeneratedAt && (
            <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] text-emerald-700 print:hidden">
              입출금표 문서 생성 완료: {new Date(documentGeneratedAt).toLocaleString("ko-KR")}
            </div>
          )}

          {/* sheet */}
          <div className="rounded-lg bg-white shadow-md print:rounded-none print:shadow-none">
            {!isReady ? (
              <div className="flex items-center justify-center px-6 py-24 text-[13px] text-gray-500">
                입출금표를 불러오는 중…
              </div>
            ) : (
              <FormProvider {...form}>
                <ApprovalRequestSheet ref={sheetRef} />
              </FormProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
