"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { ConfirmModal, Loading } from "@heritage-dx/ui";
import {
  appendMemoEntry,
  useClubDetail,
  useClubs,
  useConsultations,
  type ConsultationAiResponse,
} from "@heritage-dx/store";
import { useAppStores } from "@/stores";
import { useAuth } from "@/contexts/AuthContext";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import { trackEvent } from "@/lib/gtag";
import AiConsultationDraftPanel from "@/components/trade-memo/AiConsultationDraftPanel";
import CustomerAutocomplete from "@/components/CustomerAutocomplete";
import { ClubSearchSelect } from "@heritage-dx/ui";
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

const inputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-[13px] text-gray-800 outline-none transition-colors focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500";
const numericInputCls = `${inputCls} text-right tabular-nums`;

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
  const { user } = useAuth();
  const { clubs } = useClubs(clubStore);
  const { create, update } = useConsultations(tradeMemoStore);
  const { send: sendNotification } = useSendTradeNotification();
  const ensureFlow = useCustomerEnsureFlow();

  const [tab, setTab] = useState<SidebarTab>("manual");
  const [form, setForm] = useState<MembershipTradeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formClubCode, setFormClubCode] = useState<string>("");
  const [manualClubInput, setManualClubInput] = useState(false);
  const [manualMembershipInput, setManualMembershipInput] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { detail: formClubDetail } = useClubDetail(
    clubStore,
    formClubCode && formClubCode !== "__manual__" ? formClubCode : null,
  );

  const membershipOptions = useMemo(() => {
    const list = formClubDetail?.memberships ?? [];
    const seen = new Map<string, { id: string | null; name: string }>();
    for (const m of list) {
      const name = (m.membershipName || m.membershipType || "").trim();
      if (!name) continue;
      if (!seen.has(name)) seen.set(name, { id: m.id, name });
    }
    return Array.from(seen.values());
  }, [formClubDetail]);

  // Sync clubId/Name when club detail loads
  useEffect(() => {
    if (!formClubDetail) return;
    setForm((f) => ({
      ...f,
      clubId: formClubDetail.id || "",
      clubName: formClubDetail.name,
    }));
  }, [formClubDetail]);

  // Hydrate when editingTrade changes
  useEffect(() => {
    if (!editingTrade) return;
    setForm({
      clubId: editingTrade.clubId || "",
      clubName: editingTrade.clubName || "",
      membershipId: null,
      membershipType: editingTrade.membershipType || "",
      tradeType: editingTrade.tradeType || "매수",
      customerId: editingTrade.customerId ?? null,
      customerName: editingTrade.customerName || "",
      contact: editingTrade.contact || "",
      offerPrice: editingTrade.offerPrice ? Number(editingTrade.offerPrice) : 0,
      offerPriceNote: editingTrade.offerPriceNote || "",
      desiredPrice: editingTrade.desiredPrice ? Number(editingTrade.desiredPrice) : 0,
      desiredPriceNote: editingTrade.desiredPriceNote || "",
      depositAmount: editingTrade.depositAmount ?? 0,
      accountNumber: editingTrade.accountNumber || "",
      notes: editingTrade.notes || "",
      registrationDate: editingTrade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: editingTrade.tradeDate || "",
      remarks: editingTrade.remarks || "",
    });
    const matchedClub = clubs.find((c) => c.name === editingTrade.clubName);
    if (matchedClub) {
      setFormClubCode(matchedClub.code);
      setManualClubInput(false);
    } else {
      setFormClubCode("__manual__");
      setManualClubInput(true);
    }
    setManualMembershipInput(false);
    setTab("manual");
  }, [editingTrade, clubs]);

  // Esc / Cmd+Enter
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const reset = () => {
    setForm(emptyForm);
    setFormClubCode("");
    setManualClubInput(false);
    setManualMembershipInput(false);
    setErrorMessage(null);
    setTab("manual");
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
      const matchedClub = clubs.find((c) => c.name === clubMatched.name);
      if (matchedClub) setFormClubCode(matchedClub.code);
    }
    setManualClubInput(!clubMatched.matched && !clubMatched.id);
    setManualMembershipInput(!membershipMatched.matched && !membershipMatched.id);
    setTab("manual");
    trackEvent("trade_memo_ai_applied", {
      matched_club: clubMatched.matched,
      matched_membership: membershipMatched.matched,
      missing_count: result.missingRequiredFields.length,
    });
  };

  const persistConsultation = async () => {
    const authorName = user?.name?.trim() || user?.email || "—";
    const authorId = user?.id ? String(user.id) : null;
    let notesPayload: string | null = editingTrade?.notes ?? null;
    if (!editingTrade && form.notes.trim().length > 0) {
      const { encoded } = appendMemoEntry(
        null,
        { author: authorName, authorId, content: form.notes.trim() },
        { author: authorName, createdAt: new Date().toISOString() },
      );
      notesPayload = encoded;
    }
    const preservedRemarks = editingTrade ? editingTrade.remarks ?? null : null;
    const input = {
      club: form.clubId || form.clubName,
      membership: form.membershipId || form.membershipType,
      tradeType: form.tradeType,
      customerName: form.customerName.trim(),
      contact: form.contact.trim(),
      offerPrice: form.offerPrice || null,
      offerPriceNote: form.offerPriceNote || null,
      desiredPrice: form.desiredPrice || null,
      desiredPriceNote: form.desiredPriceNote || null,
      depositAmount: form.depositAmount || null,
      accountNumber: form.accountNumber || null,
      notes: notesPayload,
      registrationDate: form.registrationDate || null,
      tradeDate: form.tradeDate || null,
      remarks: editingTrade
        ? preservedRemarks
        : form.remarks.trim()
        ? form.remarks
        : null,
    };
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
      });
    }
    setSuccessMessage(editingTrade ? "수정 완료" : "등록 완료");
    setTimeout(() => setSuccessMessage(null), 2500);
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

  if (!open) return null;

  return (
    <>
      <aside
        className="flex w-[560px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-2px_0_8px_rgba(15,23,42,0.04)]"
        style={{ animation: "trades-panel-in 220ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        <style>{`
          @keyframes trades-panel-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[15px] font-bold tracking-[-0.2px] text-gray-900">
              {editingTrade ? "상담일지 수정" : "새 상담일지 작성"}
            </h3>
            <span className="text-[11.5px] text-gray-500">
              {editingTrade ? "내용을 수정한 뒤 저장하세요" : "왼쪽 표를 보면서 입력하세요"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="닫기 (Esc)"
            aria-label="닫기"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          >
            <X className="h-3.5 w-3.5 text-gray-700" />
          </button>
        </div>

        {/* Tabs (hidden in edit mode) */}
        {!editingTrade && (
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                tab === "ai"
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
              onClick={() => setTab("manual")}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                tab === "manual"
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
          <div className="mx-5 mt-3 rounded bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
            {successMessage}
          </div>
        )}

        {/* Body */}
        {tab === "ai" && !editingTrade ? (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <AiConsultationDraftPanel onApplied={handleAiApplied} />
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
              {errorMessage && (
                <div className="mb-3 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] text-red-700">
                  <span className="flex-1">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="shrink-0 text-red-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* SECTION 1 — 거래 정보 */}
              <Section step="1" title="거래 정보">
                <Field>
                  <Label required>거래유형</Label>
                  <div className="flex h-9 gap-0 rounded-md border border-gray-300 bg-gray-50 p-[3px]">
                    {(["매수", "매도"] as const).map((t) => {
                      const active = form.tradeType === t;
                      const activeStyle =
                        t === "매수"
                          ? "bg-[#1E429F] text-white font-bold"
                          : "bg-[#B23232] text-white font-bold";
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, tradeType: t }))}
                          className={`flex-1 rounded text-[13px] transition-colors ${
                            active ? activeStyle : "bg-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field>
                  <Label required>골프장명</Label>
                  {!manualClubInput ? (
                    <div className="flex gap-1.5">
                      <div className="flex-1">
                        <ClubSearchSelect
                          clubs={clubs}
                          selectedClubCode={formClubCode}
                          onChange={(code) => {
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
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setManualClubInput(true);
                          setFormClubCode("__manual__");
                          setForm((f) => ({
                            ...f,
                            clubId: "",
                            clubName: "",
                            membershipId: null,
                            membershipType: "",
                          }));
                          setManualMembershipInput(true);
                        }}
                        className="h-9 shrink-0 rounded-md border border-gray-300 bg-white px-3 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        직접입력
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={form.clubName}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, clubId: "", clubName: e.target.value }))
                        }
                        placeholder="골프장명 직접 입력"
                        className={`${inputCls} flex-1`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setManualClubInput(false);
                          setFormClubCode("");
                          setForm((f) => ({
                            ...f,
                            clubId: "",
                            clubName: "",
                            membershipId: null,
                            membershipType: "",
                          }));
                          setManualMembershipInput(false);
                        }}
                        className="h-9 shrink-0 rounded-md border border-gray-300 bg-white px-3 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        목록선택
                      </button>
                    </div>
                  )}
                </Field>

                <Field>
                  <Label required>회원권 종류</Label>
                  {membershipOptions.length > 0 && !manualMembershipInput ? (
                    <select
                      value={form.membershipType}
                      onChange={(e) => {
                        if (e.target.value === "__manual__") {
                          setManualMembershipInput(true);
                          setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                        } else {
                          const picked = membershipOptions.find((m) => m.name === e.target.value);
                          setForm((f) => ({
                            ...f,
                            membershipId: picked?.id ?? null,
                            membershipType: e.target.value,
                          }));
                        }
                      }}
                      className={inputCls}
                      required
                    >
                      <option value="">선택</option>
                      {membershipOptions.map((m) => (
                        <option key={m.id ?? m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      <option value="__manual__">직접 입력</option>
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={form.membershipType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            membershipId: null,
                            membershipType: e.target.value,
                          }))
                        }
                        placeholder="예: 개인정회원"
                        className={`${inputCls} flex-1`}
                        required
                      />
                      {membershipOptions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setManualMembershipInput(false);
                            setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                          }}
                          className="h-9 shrink-0 rounded-md border border-gray-300 bg-white px-2 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50"
                        >
                          목록선택
                        </button>
                      )}
                    </div>
                  )}
                </Field>
              </Section>

              {/* SECTION 2 — 고객 정보 */}
              <Section step="2" title="고객 정보">
                <CustomerAutocomplete
                  value={{
                    customerId: form.customerId,
                    name: form.customerName,
                    contact: form.contact,
                  }}
                  onChange={(next) =>
                    setForm((f) => ({
                      ...f,
                      customerId: next.customerId,
                      customerName: next.name,
                      contact: next.contact,
                    }))
                  }
                />
              </Section>

              {/* SECTION 3 — 금액 정보 */}
              <Section step="3" title="금액 정보">
                <Row cols="1fr 1.4fr">
                  <Field>
                    <Label hint="만원">제시가</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.offerPrice ? form.offerPrice.toString() : ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, offerPrice: parseNumeric(e.target.value) }))
                      }
                      placeholder="0"
                      className={numericInputCls}
                    />
                  </Field>
                  <Field>
                    <Label>제시가 비고</Label>
                    <input
                      type="text"
                      value={form.offerPriceNote}
                      onChange={(e) => setForm((f) => ({ ...f, offerPriceNote: e.target.value }))}
                      placeholder="비고 (예: 매도 의향가)"
                      className={inputCls}
                    />
                  </Field>
                </Row>
                <Row cols="1fr 1.4fr">
                  <Field>
                    <Label hint="만원">희망가</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.desiredPrice ? form.desiredPrice.toString() : ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, desiredPrice: parseNumeric(e.target.value) }))
                      }
                      placeholder="0"
                      className={numericInputCls}
                    />
                  </Field>
                  <Field>
                    <Label>희망가 비고</Label>
                    <input
                      type="text"
                      value={form.desiredPriceNote}
                      onChange={(e) => setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))}
                      placeholder="비고"
                      className={inputCls}
                    />
                  </Field>
                </Row>
                <Row cols="1fr 1.4fr">
                  <Field>
                    <Label hint="만원">계약금</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.depositAmount ? form.depositAmount.toString() : ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, depositAmount: parseNumeric(e.target.value) }))
                      }
                      placeholder="0"
                      className={numericInputCls}
                    />
                  </Field>
                  <Field>
                    <Label>계좌번호</Label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                      placeholder="110-123-456789"
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                </Row>
              </Section>

              {/* SECTION 4 — 일정 */}
              <Section step="4" title="일정">
                <Row cols="1fr 1fr">
                  <Field>
                    <Label>등록일</Label>
                    <input
                      type="date"
                      value={form.registrationDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, registrationDate: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field>
                    <Label>거래일</Label>
                    <input
                      type="date"
                      value={form.tradeDate}
                      onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                </Row>
              </Section>

              {/* SECTION 5 — 메모 / 특이사항 */}
              <Section step="5" title="메모 / 특이사항" last>
                {!editingTrade ? (
                  <>
                    <Field>
                      <Label>메모</Label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="타회원권 교환 희망 / 매수 의향 등"
                        className="block h-20 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-gray-800 outline-none focus:border-gray-900"
                      />
                    </Field>
                    <Field>
                      <Label>특이사항</Label>
                      <textarea
                        value={form.remarks}
                        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                        placeholder="계약금 입금 완료 / 특별 요청사항 등"
                        className="block h-20 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.5] text-gray-800 outline-none focus:border-gray-900"
                      />
                    </Field>
                  </>
                ) : (
                  <p className="text-[11.5px] leading-relaxed text-gray-500">
                    메모와 특이사항은 행을 펼쳐 메모 히스토리에서 추가/관리하세요.
                  </p>
                )}
              </Section>
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
        )}
      </aside>

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

// ─── helpers ────────────────────────────────────────────────────────

function parseNumeric(raw: string): number {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function Section({
  step,
  title,
  last,
  children,
}: {
  step: string;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={last ? "" : "mb-5 border-b border-gray-100 pb-5"}>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded bg-gray-900 font-mono text-[11px] font-bold text-white">
          {step}
        </span>
        <h4 className="text-[13px] font-bold tracking-[-0.2px] text-gray-900">{title}</h4>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

function Row({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

function Label({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-gray-700">
      {children}
      {required && <span className="text-red-600">*</span>}
      {hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}
    </label>
  );
}
