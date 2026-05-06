"use client";

import { useEffect, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Loading, type ClubSearchItem } from "@heritage-dx/ui";
import type { ClubDetail, MembershipTrade, MembershipTradeForm } from "@/types";
import AiResultBanner, {
  type AiDraftMeta,
} from "@/components/trade-memo/AiResultBanner";
import ConsultationFormSections from "@/components/trade-memo/ConsultationFormSections";
import type { ConsultationAiCandidate } from "@heritage-dx/store";

interface CreateConsultationDialogProps {
  isOpen: boolean;
  clubDetail: ClubDetail | null;
  form: MembershipTradeForm;
  setForm: (updater: (prev: MembershipTradeForm) => MembershipTradeForm) => void;
  manualMembershipInput: boolean;
  setManualMembershipInput: (v: boolean) => void;
  manualClubInput: boolean;
  setManualClubInput: (v: boolean) => void;
  aiDraftMeta: AiDraftMeta | null;
  onDismissAiBanner: () => void;
  editingTrade: MembershipTrade | null;
  submitting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  /** 골프장 input 의 lock 여부. ClubProfile 컨텍스트(=true) vs 리스트(=false). */
  clubLocked?: boolean;
  clubs?: ClubSearchItem[];
  selectedClubCode?: string;
  onClubChange?: (code: string) => void;
}

export default function CreateConsultationDialog({
  isOpen,
  clubDetail,
  form,
  setForm,
  manualMembershipInput,
  setManualMembershipInput,
  manualClubInput,
  setManualClubInput,
  aiDraftMeta,
  onDismissAiBanner,
  editingTrade,
  submitting,
  errorMessage,
  onClearError,
  onSubmit,
  onClose,
  formRef,
  clubLocked = true,
  clubs,
  selectedClubCode,
  onClubChange,
}: CreateConsultationDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef?.current?.requestSubmit();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, formRef]);

  if (!isOpen) return null;

  const pickClubFromCandidate = (c: ConsultationAiCandidate) => {
    setManualClubInput(false);
    setForm((f) => ({ ...f, clubId: c.id, clubName: c.name }));
  };

  const pickMembershipFromCandidate = (c: ConsultationAiCandidate) => {
    setManualMembershipInput(false);
    setForm((f) => ({
      ...f,
      membershipId: c.id,
      membershipType: c.name,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-consultation-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <div className="flex flex-col gap-0.5">
            <h3
              id="create-consultation-dialog-title"
              className="text-[15px] font-bold tracking-[-0.2px] text-gray-900"
            >
              {editingTrade ? "상담일지 수정" : "AI 결과 확인 후 등록"}
            </h3>
            {!editingTrade && (
              <span className="text-[11.5px] text-gray-500">
                AI 가 채운 값을 확인하고 필요한 부분을 수정하세요.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="닫기"
            aria-label="닫기"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5 text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-6">
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

          {aiDraftMeta && (
            <AiResultBanner
              meta={aiDraftMeta}
              currentClubId={clubDetail?.id ?? ""}
              currentClubName={clubDetail?.name ?? ""}
              onDismiss={onDismissAiBanner}
              onPickClub={pickClubFromCandidate}
              onPickMembership={pickMembershipFromCandidate}
            />
          )}

          <ConsultationFormSections
            clubDetail={clubDetail}
            form={form}
            setForm={setForm}
            manualMembershipInput={manualMembershipInput}
            setManualMembershipInput={setManualMembershipInput}
            manualClubInput={manualClubInput}
            setManualClubInput={setManualClubInput}
            editingTrade={!!editingTrade}
            clubLocked={clubLocked}
            clubs={clubs}
            selectedClubCode={selectedClubCode}
            onClubChange={onClubChange}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
          <span className="text-[11.5px] text-gray-500">
            <span className="text-red-600">*</span> 필수 입력
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-gray-300 bg-white px-4 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-5 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
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
      </form>
    </div>
  );
}
