"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { ConfirmModal } from "@heritage-dx/ui";
import {
  buildClubMembershipPair,
  useClubDetail,
  useClubs,
  useConsultations,
  type ConsultationAiResponse,
} from "@heritage-dx/store";
import { useAppStores } from "@/stores";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import { trackEvent } from "@/lib/gtag";
import AiConsultationDraftPanel from "@/components/trade-memo/AiConsultationDraftPanel";
import ManualConsultationPanel from "@/components/trade-memo/ManualConsultationPanel";
import CreateConsultationDialog from "@/components/trade-memo/CreateConsultationDialog";
import type { AiDraftMeta } from "@/components/trade-memo/AiResultBanner";
import type { MembershipTrade, MembershipTradeForm } from "@/types";

type SidebarTab = "ai" | "manual";

const emptyForm: MembershipTradeForm = {
  clubId: "",
  clubName: "",
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
};

interface TradesCreatePanelProps {
  open: boolean;
  /** When set, the panel opens in edit mode and submits update() instead of create(). */
  editingTrade?: MembershipTrade | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TradesCreatePanel({
  open,
  editingTrade,
  onClose,
  onSaved,
}: TradesCreatePanelProps) {
  const { club: clubStore, tradeMemo: tradeMemoStore } = useAppStores();
  const { clubs } = useClubs(clubStore);
  const { create, update } = useConsultations(tradeMemoStore);
  const { send: sendNotification } = useSendTradeNotification();
  const ensureFlow = useCustomerEnsureFlow();

  const [activeTab, setActiveTab] = useState<SidebarTab>("manual");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MembershipTradeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formClubCode, setFormClubCode] = useState<string>("");
  const [manualClubInput, setManualClubInput] = useState(false);
  const [manualMembershipInput, setManualMembershipInput] = useState(true);
  const [aiDraftMeta, setAiDraftMeta] = useState<AiDraftMeta | null>(null);
  const dialogFormRef = useRef<HTMLFormElement>(null);

  const { detail: formClubDetail } = useClubDetail(
    clubStore,
    formClubCode && formClubCode !== "__manual__" ? formClubCode : null,
  );

  // 클럽 detail 이 도착하면 form 의 clubId/clubName 을 동기화하고
  // 회원권 dropdown 옵션이 채워지면 manualMembershipInput 을 자동 해제.
  useEffect(() => {
    if (!formClubDetail) return;
    setForm((f) => ({
      ...f,
      clubId: formClubDetail.id || "",
      clubName: formClubDetail.name,
    }));
    if ((formClubDetail.memberships ?? []).length > 0) {
      setManualMembershipInput(false);
    }
  }, [formClubDetail]);

  // 패널이 열릴 때(또는 editingTrade 가 바뀔 때) form 을 알맞게 초기화.
  // 신규 모드에서는 emptyForm 으로 리셋하여 직전 수정 세션의 값이 남지 않도록 함.
  // clubs 의존성을 두지 않아 clubs[] 비동기 도착에 의해 form 이 덮이지 않게 한다.
  useEffect(() => {
    if (!open) return;
    if (editingTrade) {
      setForm({
        clubId: editingTrade.clubId || "",
        clubName: editingTrade.clubName || "",
        membershipId: null,
        membershipType: editingTrade.membershipType || "",
        tradeType: editingTrade.tradeType || "매수",
        customerId: editingTrade.customerId ?? null,
        customerName: editingTrade.customerName || "",
        contact: editingTrade.contact || "",
        offerPrice: editingTrade.offerPrice
          ? Number(editingTrade.offerPrice)
          : 0,
        offerPriceNote: editingTrade.offerPriceNote || "",
        desiredPrice: editingTrade.desiredPrice
          ? Number(editingTrade.desiredPrice)
          : 0,
        desiredPriceNote: editingTrade.desiredPriceNote || "",
        depositAmount: editingTrade.depositAmount ?? 0,
        accountNumber: editingTrade.accountNumber || "",
        // notes 는 PUT 으로 수정 불가 — 폼의 notes 입력은 신규 생성 전용.
        // 편집 모드에서는 폼을 비워두고, 메모는 메모 히스토리에서 관리.
        notes: "",
        registrationDate:
          editingTrade.registrationDate ||
          new Date().toISOString().split("T")[0],
        tradeDate: editingTrade.tradeDate || "",
        remarks: editingTrade.remarks || "",
      });
      setManualClubInput(false);
      setManualMembershipInput(false);
      setActiveTab("manual");
      setAiDraftMeta(null);
      setErrorMessage(null);
    } else {
      // 새 상담일지 작성 — 모든 폼 state 초기화
      setForm(emptyForm);
      setFormClubCode("");
      setManualClubInput(false);
      setManualMembershipInput(true);
      setActiveTab("manual");
      setAiDraftMeta(null);
      setErrorMessage(null);
    }
  }, [open, editingTrade]);

  // 편집 모드에서 clubs[] 가 도착하면 editingTrade.clubName 을 코드와 매칭.
  // form 자체에는 영향을 주지 않고 picker 의 selectedClubCode 만 결정.
  useEffect(() => {
    if (!open || !editingTrade) return;
    if (clubs.length === 0) return;
    const matched = clubs.find((c) => c.name === editingTrade.clubName);
    if (matched) {
      setFormClubCode(matched.code);
      setManualClubInput(false);
    } else if (editingTrade.clubName) {
      setFormClubCode("__manual__");
      setManualClubInput(true);
    }
  }, [open, editingTrade, clubs]);

  // 패널이 열리는 동안 Esc / Cmd+Enter 단축키.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const reset = () => {
    setForm(emptyForm);
    setFormClubCode("");
    setManualClubInput(false);
    setManualMembershipInput(true);
    setErrorMessage(null);
    setAiDraftMeta(null);
    setActiveTab("manual");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setAiDraftMeta(null);
  };

  const handleClubChange = (code: string) => {
    setFormClubCode(code);
    if (!code) {
      setForm((f) => ({
        ...f,
        clubId: "",
        clubName: "",
        membershipId: null,
        membershipType: "",
      }));
      setManualMembershipInput(false);
    }
  };

  const handleAiApplied = (result: ConsultationAiResponse) => {
    const clubMatched = result.matches.club;
    const membershipMatched = result.matches.membership;
    setForm({
      ...emptyForm,
      clubId: clubMatched.id ?? "",
      clubName: clubMatched.name ?? "",
      membershipId: membershipMatched.id ?? null,
      membershipType: membershipMatched.name ?? "",
      tradeType: result.draft.tradeType,
      customerName: result.draft.customerName ?? "",
      contact: result.draft.contact ?? "",
      desiredPrice: result.draft.desiredPrice ?? 0,
    });
    if (clubMatched.name) {
      const matched = clubs.find((c) => c.name === clubMatched.name);
      if (matched) {
        setFormClubCode(matched.code);
        setManualClubInput(false);
      } else {
        setFormClubCode("__manual__");
        setManualClubInput(true);
      }
    } else {
      setFormClubCode("");
      setManualClubInput(false);
    }
    setManualMembershipInput(!membershipMatched.matched && !membershipMatched.id);
    setAiDraftMeta({
      warnings: result.warnings,
      missingRequiredFields: result.missingRequiredFields,
      clubMatch: clubMatched,
      membershipMatch: membershipMatched,
    });
    setErrorMessage(null);
    setActiveTab("manual");
    setDialogOpen(true);

    trackEvent("trade_memo_ai_applied", {
      matched_club: clubMatched.matched,
      matched_membership: membershipMatched.matched,
      missing_count: result.missingRequiredFields.length,
    });
  };

  const persistConsultation = async () => {
    const preservedRemarks = editingTrade ? editingTrade.remarks ?? null : null;
    const { club, membership } = buildClubMembershipPair({
      clubId: form.clubId,
      clubName: form.clubName,
      membershipId: form.membershipId,
      membershipType: form.membershipType,
    });
    const trimmedNote = form.notes.trim();
    const baseInput = {
      club,
      membership,
      tradeType: form.tradeType,
      customerName: form.customerName.trim(),
      contact: form.contact.trim(),
      offerPrice: form.offerPrice || null,
      offerPriceNote: form.offerPriceNote || null,
      desiredPrice: form.desiredPrice || null,
      desiredPriceNote: form.desiredPriceNote || null,
      depositAmount: form.depositAmount || null,
      accountNumber: form.accountNumber || null,
      registrationDate: form.registrationDate || null,
      tradeDate: form.tradeDate || null,
      remarks: editingTrade
        ? preservedRemarks
        : form.remarks.trim()
          ? form.remarks
          : null,
    };
    const input = editingTrade
      ? baseInput
      : { ...baseInput, ...(trimmedNote ? { notes: trimmedNote } : {}) };

    const entity = editingTrade
      ? await update(editingTrade.id, input)
      : await create(input);
    if (!entity) {
      setErrorMessage("오류가 발생했습니다.");
      return;
    }

    if (!editingTrade) {
      sendNotification({
        tradeId: entity.id,
        clubName: form.clubName,
        tradeType: form.tradeType,
        customerName: form.customerName,
        membershipType: form.membershipType,
        offerPrice: form.offerPrice || null,
        desiredPrice: form.desiredPrice || null,
      });
      trackEvent("trade_memo_create", {
        club_name: form.clubName,
        trade_type: form.tradeType,
        via_ai: aiDraftMeta !== null,
      });
    }

    setSuccessMessage(editingTrade ? "수정 완료" : "등록 완료");
    setTimeout(() => setSuccessMessage(null), 2500);
    setDialogOpen(false);
    reset();
    onSaved?.();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (
      !editingTrade &&
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

  const handleSwitchTab = (tab: SidebarTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
  };

  if (!open) return null;

  return (
    <>
      <aside
        className="flex w-[560px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-2px_0_8px_rgba(15,23,42,0.04)]"
        style={{
          animation:
            "trades-panel-in 220ms cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <style>{`
          @keyframes trades-panel-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

        {/* 헤더 — 골프장 상세와 동일한 톤 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[#0a0a0a]">
              {editingTrade ? "상담일지 수정" : "상담일지 작성"}
            </h3>
            <span className="text-[12px] text-[#71717a]">
              {editingTrade
                ? "내용을 수정한 뒤 저장하세요"
                : "왼쪽 표를 보면서 입력하세요"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-[#52525b] transition-colors hover:bg-gray-50"
            title="닫기 (Esc)"
            aria-label="닫기"
          >
            <svg
              className="h-4 w-4"
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

        {/* 탭 (수정 모드에서는 숨김) */}
        {!editingTrade && (
          <div className="flex border-b border-gray-200 px-6">
            <button
              type="button"
              onClick={() => handleSwitchTab("ai")}
              className={`flex items-center gap-1.5 border-b-2 px-2 py-2.5 text-[12px] font-semibold transition-colors ${
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
              className={`flex items-center gap-1.5 border-b-2 px-2 py-2.5 text-[12px] font-semibold transition-colors ${
                activeTab === "manual"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <Pencil className="h-3 w-3" />
              일반 입력
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-3 mt-2 rounded bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
            {successMessage}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === "ai" && !editingTrade ? (
            <div className="flex flex-1 flex-col overflow-y-auto">
              <AiConsultationDraftPanel onApplied={handleAiApplied} />
            </div>
          ) : (
            <ManualConsultationPanel
              clubDetail={formClubDetail ?? null}
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
              onCancel={onClose}
              editingTrade={!!editingTrade}
              clubLocked={false}
              clubs={clubs}
              selectedClubCode={formClubCode}
              onClubChange={handleClubChange}
            />
          )}
        </div>
      </aside>

      {!editingTrade && (
        <CreateConsultationDialog
          isOpen={dialogOpen}
          clubDetail={formClubDetail ?? null}
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
          clubLocked={false}
          clubs={clubs}
          selectedClubCode={formClubCode}
          onClubChange={handleClubChange}
        />
      )}

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
