"use client";

import { useRef, useState, type FormEvent } from "react";
import { Sparkles, Pencil } from "lucide-react";
import type { ClubDetail, MembershipTradeForm } from "@/types";
import { ConfirmModal } from "@heritage-dx/ui";
import { useAppStores } from "@/stores";
import {
  useConsultations,
  appendMemoEntry,
  type ConsultationAiResponse,
} from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import { trackEvent } from "@/lib/gtag";
import AiConsultationDraftPanel from "@/components/trade-memo/AiConsultationDraftPanel";
import ManualConsultationPanel from "@/components/trade-memo/ManualConsultationPanel";
import CreateConsultationDialog from "@/components/trade-memo/CreateConsultationDialog";
import type { AiDraftMeta } from "@/components/trade-memo/AiResultBanner";

interface TradeMemoSidebarProps {
  clubDetail: ClubDetail;
  onClose: () => void;
}

type SidebarTab = "ai" | "manual";

const buildInitialForm = (clubDetail: ClubDetail): MembershipTradeForm => ({
  clubId: clubDetail.id,
  clubName: clubDetail.name,
  membershipId: null,
  membershipType: "",
  tradeType: "매수",
  customerId: null,
  customerName: "",
  contact: "",
  offerPrice: 0,
  offerPriceNote: "",
  desiredPrice: 0,
  desiredPriceNote: "",
  depositAmount: 0,
  accountNumber: "",
  notes: "",
  registrationDate: new Date().toISOString().split("T")[0],
  tradeDate: "",
  remarks: "",
});

export default function TradeMemoSidebar({
  clubDetail,
  onClose,
}: TradeMemoSidebarProps) {
  const { tradeMemo: tradeMemoStore } = useAppStores();
  const { user } = useAuth();
  const { create } = useConsultations(tradeMemoStore);
  const { send: sendNotification } = useSendTradeNotification();
  const ensureFlow = useCustomerEnsureFlow();

  const [activeTab, setActiveTab] = useState<SidebarTab>("ai");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MembershipTradeForm>(() =>
    buildInitialForm(clubDetail),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [manualMembershipInput, setManualMembershipInput] = useState(false);
  const [manualClubInput, setManualClubInput] = useState(false);
  const [aiDraftMeta, setAiDraftMeta] = useState<AiDraftMeta | null>(null);
  const dialogFormRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setForm(buildInitialForm(clubDetail));
    setManualMembershipInput(false);
    setManualClubInput(false);
    setAiDraftMeta(null);
    setErrorMessage(null);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const persistConsultation = async () => {
    const authorName = user?.name?.trim() || user?.email || "—";
    const authorId = user?.id ? String(user.id) : null;

    let notesPayload: string | null = null;
    if (form.notes.trim().length > 0) {
      const { encoded } = appendMemoEntry(
        null,
        {
          author: authorName,
          authorId,
          content: form.notes.trim(),
        },
        { author: authorName, createdAt: new Date().toISOString() },
      );
      notesPayload = encoded;
    }

    const input = {
      club: form.clubId || form.clubName || clubDetail.id,
      membership: form.membershipId || form.membershipType,
      tradeType: form.tradeType,
      customerName: form.customerName,
      contact: form.contact,
      offerPrice: form.offerPrice || null,
      offerPriceNote: form.offerPriceNote || null,
      desiredPrice: form.desiredPrice || null,
      desiredPriceNote: form.desiredPriceNote || null,
      depositAmount: form.depositAmount || null,
      accountNumber: form.accountNumber || null,
      notes: notesPayload,
      registrationDate: form.registrationDate || null,
      tradeDate: form.tradeDate || null,
      remarks: form.remarks.trim() ? form.remarks : null,
    };

    const entity = await create(input);
    if (!entity) {
      setErrorMessage("오류가 발생했습니다.");
      return;
    }

    sendNotification({
      tradeId: entity.id,
      clubName: form.clubName || clubDetail.name,
      tradeType: form.tradeType,
      customerName: form.customerName,
      membershipType: form.membershipType,
      offerPrice: form.offerPrice || null,
      desiredPrice: form.desiredPrice || null,
    });

    trackEvent("trade_memo_create", {
      club_name: form.clubName || clubDetail.name,
      trade_type: form.tradeType,
      via_ai: aiDraftMeta !== null,
    });

    setDialogOpen(false);
    resetForm();
    setSuccessMessage("등록 완료");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !form.customerId &&
      form.customerName.trim() &&
      form.contact.trim()
    ) {
      ensureFlow.requestEnsure({
        name: form.customerName.trim(),
        contact: form.contact.trim(),
      });
      return;
    }

    setSubmitting(true);
    try {
      await persistConsultation();
    } catch (err) {
      console.error("메모 저장 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEnsure = async () => {
    const result = await ensureFlow.confirm();
    if (!result.ok) {
      setErrorMessage(result.errorMessage ?? "고객 등록에 실패했습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await persistConsultation();
    } catch (err) {
      console.error("메모 저장 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiApplied = (result: ConsultationAiResponse) => {
    const base = buildInitialForm(clubDetail);
    const clubMatched = result.matches.club;
    const membershipMatched = result.matches.membership;

    setForm({
      ...base,
      clubId: clubMatched.id ?? "",
      clubName: clubMatched.name ?? base.clubName,
      membershipId: membershipMatched.id ?? null,
      membershipType: membershipMatched.name ?? "",
      tradeType: result.draft.tradeType,
      customerName: result.draft.customerName ?? "",
      contact: result.draft.contact ?? "",
      desiredPrice: result.draft.desiredPrice ?? 0,
    });

    setManualMembershipInput(!membershipMatched.matched);
    setManualClubInput(!clubMatched.matched);
    setAiDraftMeta({
      warnings: result.warnings,
      missingRequiredFields: result.missingRequiredFields,
      clubMatch: clubMatched,
      membershipMatch: membershipMatched,
    });
    setErrorMessage(null);
    setDialogOpen(true);

    trackEvent("trade_memo_ai_applied", {
      matched_club: clubMatched.matched,
      matched_membership: membershipMatched.matched,
      missing_count: result.missingRequiredFields.length,
    });
  };

  const handleSwitchTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  return (
    <>
      <aside className="fixed inset-0 z-40 flex h-full min-h-0 w-full flex-col border-l border-gray-200 bg-white print:hidden lg:static lg:inset-auto lg:z-auto lg:w-96">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2.5">
          <h3 className="text-sm font-bold text-gray-900">상담일지</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 transition-colors hover:bg-gray-200"
            title="닫기"
          >
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleSwitchTab("ai")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "ai"
                ? "border-violet-600 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            AI 입력
            <span className="rounded-full bg-violet-50 px-1.5 py-px text-[9px] font-bold uppercase text-violet-700">
              beta
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab("manual")}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === "manual"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Pencil className="h-3 w-3" />
            일반 입력
          </button>
        </div>

        {/* 알림 (성공만) */}
        {successMessage && (
          <div className="mx-3 mt-2 rounded bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
            {successMessage}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === "ai" && (
            <div className="flex flex-1 flex-col overflow-y-auto">
              <AiConsultationDraftPanel
                onApplied={handleAiApplied}
                contextClubName={clubDetail.name}
              />
            </div>
          )}
          {activeTab === "manual" && (
            <ManualConsultationPanel
              clubDetail={clubDetail}
              form={form}
              setForm={(updater) => setForm((prev) => updater(prev))}
              manualMembershipInput={manualMembershipInput}
              setManualMembershipInput={setManualMembershipInput}
              manualClubInput={manualClubInput}
              setManualClubInput={setManualClubInput}
              submitting={submitting}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage(null)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </aside>

      <CreateConsultationDialog
        isOpen={dialogOpen}
        clubDetail={clubDetail}
        form={form}
        setForm={(updater) => setForm((prev) => updater(prev))}
        manualMembershipInput={manualMembershipInput}
        setManualMembershipInput={setManualMembershipInput}
        manualClubInput={manualClubInput}
        setManualClubInput={setManualClubInput}
        aiDraftMeta={aiDraftMeta}
        onDismissAiBanner={() => setAiDraftMeta(null)}
        editingTrade={null}
        submitting={submitting}
        errorMessage={errorMessage}
        onClearError={() => setErrorMessage(null)}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        formRef={dialogFormRef}
      />

      <ConfirmModal
        isOpen={!!ensureFlow.pending}
        onClose={ensureFlow.cancel}
        onConfirm={handleConfirmEnsure}
        title="신규 고객 등록 안내"
        message={
          ensureFlow.pending
            ? `${ensureFlow.pending.name}(${ensureFlow.pending.contact}) 님은 고객 리스트에 없습니다. 먼저 고객으로 등록한 뒤 상담일지를 저장할까요?`
            : ""
        }
        confirmText="고객 등록 후 저장"
        cancelText="취소"
        isLoading={ensureFlow.processing || submitting}
      />
    </>
  );
}
