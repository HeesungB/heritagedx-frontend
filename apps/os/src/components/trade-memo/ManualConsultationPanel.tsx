"use client";

import { useRef, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Loading, type ClubSearchItem } from "@heritage-dx/ui";
import type { ClubDetail, MembershipTradeForm } from "@/types";
import ConsultationFormSections from "@/components/trade-memo/ConsultationFormSections";

interface ManualConsultationPanelProps {
  clubDetail: ClubDetail | null;
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
  /** 취소 버튼 핸들러 (사이드바 닫기) */
  onCancel?: () => void;
  /** 수정 모드 여부. true 면 ConsultationFormSections 가 메모 필드를 숨기고 저장 라벨을 변경. */
  editingTrade?: boolean;
  /** 골프장 input 의 lock 여부. ClubProfile 컨텍스트(=true) vs 리스트(=false). */
  clubLocked?: boolean;
  clubs?: ClubSearchItem[];
  selectedClubCode?: string;
  onClubChange?: (code: string) => void;
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
  onCancel,
  editingTrade = false,
  clubLocked = true,
  clubs,
  selectedClubCode,
  onClubChange,
}: ManualConsultationPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex h-full flex-col bg-white"
    >
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
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
          editingTrade={editingTrade}
          clubLocked={clubLocked}
          clubs={clubs}
          selectedClubCode={selectedClubCode}
          onClubChange={onClubChange}
        />

        {/* Footer — 본문 끝 인라인 (* 필수 입력 / 취소 / 저장) */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-[11.5px] text-[#71717a]">
            <span className="text-[#DC2626]">*</span> 필수 입력
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-9 items-center rounded-md border border-[#d4d4d8] bg-white px-4 text-[13px] font-semibold text-[#3f3f46] hover:bg-gray-50"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#0a0a0a] px-4 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {submitting ? (
                <Loading size="sm" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {editingTrade ? "수정 완료" : "저장"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
