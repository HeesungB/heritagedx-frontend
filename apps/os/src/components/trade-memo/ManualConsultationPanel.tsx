"use client";

import { useRef, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Loading } from "@heritage-dx/ui";
import type { ClubDetail, MembershipTradeForm } from "@/types";
import ConsultationFormSections from "@/components/trade-memo/ConsultationFormSections";

interface ManualConsultationPanelProps {
  clubDetail: ClubDetail;
  form: MembershipTradeForm;
  setForm: (updater: (prev: MembershipTradeForm) => MembershipTradeForm) => void;
  manualMembershipInput: boolean;
  setManualMembershipInput: (v: boolean) => void;
  manualClubInput: boolean;
  setManualClubInput: (v: boolean) => void;
  submitting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onSubmit: (e: FormEvent) => void;
}

export default function ManualConsultationPanel({
  clubDetail,
  form,
  setForm,
  manualMembershipInput,
  setManualMembershipInput,
  manualClubInput,
  setManualClubInput,
  submitting,
  errorMessage,
  onClearError,
  onSubmit,
}: ManualConsultationPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex h-full flex-col bg-white"
    >
      {/* Body — 좁은 사이드바이므로 compact 레이아웃 사용 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {errorMessage && (
          <div className="mb-3 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] text-red-700">
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={onClearError}
              className="shrink-0 text-red-400 hover:text-red-600"
              aria-label="에러 닫기"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <ConsultationFormSections
          clubDetail={clubDetail}
          form={form}
          setForm={setForm}
          manualMembershipInput={manualMembershipInput}
          setManualMembershipInput={setManualMembershipInput}
          manualClubInput={manualClubInput}
          setManualClubInput={setManualClubInput}
          compact
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
        <span className="text-[11px] text-gray-500">
          <span className="text-red-600">*</span> 필수 입력
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {submitting ? (
            <Loading size="sm" />
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              저장
            </>
          )}
        </button>
      </div>
    </form>
  );
}
