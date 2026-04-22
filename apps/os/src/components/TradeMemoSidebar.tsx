"use client";

import { useState, useEffect } from "react";
import { MembershipTrade, MembershipTradeForm, ClubDetail } from "@/types";
import { Button, Loading, Textarea, ConfirmModal } from "@heritage-dx/ui";
import { useAppStores } from "@/stores";
import { useConsultations } from "@heritage-dx/store";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import CustomerAutocomplete from "@/components/CustomerAutocomplete";
import { trackEvent } from "@/lib/gtag";

interface TradeMemoSidebarProps {
  clubDetail: ClubDetail;
  onClose: () => void;
}

type SidebarTab = "list" | "create";

const initialForm: Omit<MembershipTradeForm, "clubId" | "clubName"> = {
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
  isDone: false,
};

export default function TradeMemoSidebar({ clubDetail, onClose }: TradeMemoSidebarProps) {
  const { tradeMemo: tradeMemoStore } = useAppStores();
  const { items: trades, fetch: fetchFromStore, create, update, remove, toggleDone, isLoading: loading } = useConsultations(tradeMemoStore);
  const { send: sendNotification } = useSendTradeNotification();
  const [activeTab, setActiveTab] = useState<SidebarTab>("create");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingTrade, setEditingTrade] = useState<MembershipTrade | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"" | "매수" | "매도">("");
  const [filterDone, setFilterDone] = useState<"" | "done" | "progress">("progress");
  const [manualMembershipInput, setManualMembershipInput] = useState(false);
  const ensureFlow = useCustomerEnsureFlow();

  useEffect(() => {
    fetchFromStore({
      page: 1,
      limit: 50,
      sort: "registrationDate",
      order: "DESC",
      search: searchQuery.trim() || undefined,
      tradeType: filterType || undefined,
      isDone: filterDone === "done" ? true : filterDone === "progress" ? false : undefined,
    });
  }, [searchQuery, filterType, filterDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistConsultation = async () => {
    const cleaned = {
      ...form,
      tradeDate: form.tradeDate || null,
      registrationDate: form.registrationDate || null,
      offerPriceNote: form.offerPriceNote || null,
      desiredPriceNote: form.desiredPriceNote || null,
      notes: form.notes || null,
      remarks: form.remarks || null,
    };

    const input = {
      club: clubDetail.id || clubDetail.name,
      membership: cleaned.membershipId || cleaned.membershipType,
      tradeType: cleaned.tradeType,
      customerName: cleaned.customerName,
      contact: cleaned.contact,
      offerPrice: cleaned.offerPrice || null,
      offerPriceNote: cleaned.offerPriceNote,
      desiredPrice: cleaned.desiredPrice || null,
      desiredPriceNote: cleaned.desiredPriceNote,
      depositAmount: cleaned.depositAmount || null,
      accountNumber: cleaned.accountNumber || null,
      notes: cleaned.notes,
      registrationDate: cleaned.registrationDate,
      tradeDate: cleaned.tradeDate,
      remarks: cleaned.remarks,
      isDone: cleaned.isDone,
    };

    const wasEditing = !!editingTrade;
    const entity = editingTrade
      ? await update(editingTrade.id, input)
      : await create(input);

    if (!entity) {
      setErrorMessage("오류가 발생했습니다.");
      return;
    }

    if (!wasEditing) {
      sendNotification({
        tradeId: entity.id,
        clubName: clubDetail.name,
        tradeType: form.tradeType,
        customerName: form.customerName,
        membershipType: form.membershipType,
        offerPrice: form.offerPrice || null,
        desiredPrice: form.desiredPrice || null,
      });
    }

    setEditingTrade(null);
    setForm(initialForm);
    setActiveTab("list");
    setSuccessMessage(wasEditing ? "수정 완료" : "등록 완료");
    setTimeout(() => setSuccessMessage(null), 2500);
    if (!wasEditing) {
      trackEvent("trade_memo_create", { club_name: clubDetail.name, trade_type: form.tradeType });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      const ok = await remove(id);
      if (!ok) {
        setErrorMessage("삭제 실패");
        return;
      }
      setDeleteConfirmId(null);
      setSuccessMessage("삭제 완료");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err) {
      console.error("메모 삭제 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
  };

  const handleEdit = (trade: MembershipTrade) => {
    setEditingTrade(trade);
    setErrorMessage(null);
    const tradeType = trade.membershipType || "";
    const isInList = membershipTypes.includes(tradeType);
    setManualMembershipInput(membershipTypes.length > 0 && !isInList && tradeType !== "");
    const matched = clubDetail.memberships?.find(
      (m) => (m.membershipName || m.membershipType) === tradeType,
    );
    setForm({
      membershipId: matched?.id ?? null,
      membershipType: tradeType,
      tradeType: trade.tradeType || "매수",
      customerId: trade.customerId ?? null,
      customerName: trade.customerName || "",
      contact: trade.contact || "",
      offerPrice: trade.offerPrice ? Number(trade.offerPrice) : 0,
      offerPriceNote: trade.offerPriceNote || "",
      desiredPrice: trade.desiredPrice ? Number(trade.desiredPrice) : 0,
      desiredPriceNote: trade.desiredPriceNote || "",
      depositAmount: trade.depositAmount ?? 0,
      accountNumber: trade.accountNumber || "",
      notes: trade.notes || "",
      registrationDate: trade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: trade.tradeDate || "",
      remarks: trade.remarks || "",
      isDone: trade.isDone ?? false,
    });
    setActiveTab("create");
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
    setForm(initialForm);
    setManualMembershipInput(false);
  };

  const formatPrice = (price: number | string | null) => {
    if (price === null) return "-";
    const num = typeof price === "string" ? Number(price) : price;
    if (!num) return "-";
    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toLocaleString()}만`;
    }
    return `${num.toLocaleString()}`;
  };

  const handleToggleDone = async (trade: MembershipTrade) => {
    try {
      await toggleDone(trade.id, !trade.isDone);
    } catch (err) {
      console.error("상태 변경 실패:", err);
    }
  };

  const membershipTypes = clubDetail.memberships?.map(
    (m) => m.membershipName || m.membershipType
  ) || [];

  return (
    <aside className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto w-full lg:w-96 h-full min-h-0 border-l border-gray-200 bg-white flex flex-col print:hidden">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h3 className="font-bold text-sm text-gray-900">상담일지</h3>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          title="닫기"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("list"); handleCancelEdit(); }}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "list"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          리스트 ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "create"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          {editingTrade ? "수정" : "작성"}
        </button>
      </div>

      {/* 알림 */}
      {(successMessage || errorMessage) && (
        <div className={`mx-3 mt-2 px-2.5 py-1.5 rounded text-xs ${
          successMessage ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {successMessage || errorMessage}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "list" && (
          <div className="p-2.5 space-y-2">
            {/* 검색 + 필터 */}
            <div className="space-y-1.5 mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="골프장명, 고객명, 회원권 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 pr-7 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-400"
                />
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 bg-gray-100 rounded p-0.5 shrink-0">
                  {(["", "매수", "매도"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                        filterType === type
                          ? type === "매수" ? "bg-blue-600 text-white shadow-sm"
                            : type === "매도" ? "bg-red-500 text-white shadow-sm"
                            : "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {type || "전체"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded p-0.5 shrink-0">
                  {([{ value: "", label: "전체" }, { value: "progress", label: "진행중" }, { value: "done", label: "완료" }] as const).map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFilterDone(status.value as "" | "done" | "progress")}
                      className={`px-1.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                        filterDone === status.value
                          ? "bg-white text-gray-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center"><Loading size="sm" text="로딩 중..." /></div>
            ) : trades.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-300 text-xs mb-2">메모 없음</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                  새 메모 작성
                </button>
              </div>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className={`border rounded-lg transition-colors border-l-[3px] ${
                    trade.isDone
                      ? "border-gray-300 border-l-gray-300 bg-gray-50 opacity-60"
                      : trade.tradeType === "매수"
                        ? "border-gray-200 border-l-blue-600 bg-white shadow-sm hover:shadow"
                        : "border-gray-200 border-l-red-500 bg-white shadow-sm hover:shadow"
                  }`}
                >
                  {/* 헤더: 뱃지 + 골프장명 + 회원권종류 (1줄) */}
                  <div className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-px rounded text-[10px] font-bold shrink-0 ${
                        trade.isDone
                          ? "bg-gray-200 text-gray-500"
                          : trade.tradeType === "매수"
                            ? "bg-blue-600 text-white"
                            : "bg-red-500 text-white"
                      }`}>
                        {trade.tradeType}
                      </span>
                      <span className={`text-xs font-semibold truncate ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {trade.clubName}
                      </span>
                      {trade.membershipType && (
                        <span className={`text-[11px] font-medium shrink-0 ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>
                          · {trade.membershipType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className="px-2.5 py-1.5">
                    {/* 고객정보 */}
                    <div className="flex items-baseline justify-between pb-1.5">
                      <span className={`text-xs font-bold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.customerName}</span>
                      <span className={`text-xs font-medium ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.contact}</span>
                    </div>

                    {/* 가격 그리드 */}
                    <div className="grid grid-cols-2 gap-x-3 py-1.5">
                      <div>
                        <div className="text-[11px] font-medium text-gray-500">제시</div>
                        <div className={`text-xs font-bold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{formatPrice(trade.offerPrice)}</div>
                        {trade.offerPriceNote && <div className={`text-[11px] font-medium ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.offerPriceNote}</div>}
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-500">희망</div>
                        <div className={`text-xs font-bold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{formatPrice(trade.desiredPrice)}</div>
                        {trade.desiredPriceNote && <div className={`text-[11px] font-medium ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.desiredPriceNote}</div>}
                      </div>
                    </div>

                    {/* 메모 / 특이사항 */}
                    {(trade.notes || trade.remarks) && (
                      <div className={`border-l-2 pl-2 py-1 text-[11px] leading-snug ${trade.isDone ? "border-l-gray-300 text-gray-400" : "border-l-gray-400 text-gray-700"}`}>
                        {trade.notes && <p>{trade.notes}</p>}
                        {trade.remarks && <p className="italic">{trade.remarks}</p>}
                      </div>
                    )}

                    {/* 푸터: 날짜 + 액션 */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <span>{trade.registrationDate}</span>
                        {trade.createdByName && <><span>·</span><span>{trade.createdByName}</span></>}
                        {trade.tradeDate && <span className="ml-1">거래 {trade.tradeDate}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(trade)}
                          className="p-0.5 rounded text-gray-400 hover:text-gray-700"
                          title="수정"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {deleteConfirmId === trade.id ? (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleDelete(trade.id)}
                              className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded font-medium"
                            >
                              삭제
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-gray-500 rounded hover:text-gray-700"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(trade.id)}
                            className="p-0.5 rounded text-gray-400 hover:text-red-500"
                            title="삭제"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        <input
                          type="checkbox"
                          checked={trade.isDone ?? false}
                          onChange={() => handleToggleDone(trade)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer ml-1"
                          title={trade.isDone ? "완료 → 진행중" : "진행중 → 완료"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "create" && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {errorMessage && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-xs">
                <span className="text-red-700 flex-1">{errorMessage}</span>
                <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {editingTrade && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs">
                <span className="text-yellow-700">메모 수정 중</span>
                <button type="button" onClick={handleCancelEdit} className="text-yellow-600 underline">
                  취소
                </button>
              </div>
            )}

            {/* 골프장명 (자동) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">골프장명</label>
              <input
                type="text"
                value={clubDetail.name}
                disabled
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700"
              />
            </div>

            {/* 거래유형 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">거래유형 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {(["매수", "매도"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tradeType: type }))}
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                      form.tradeType === type
                        ? type === "매수"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-red-600 text-white border-red-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 회원권 종류 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">회원권 종류 <span className="text-red-500">*</span></label>
              {membershipTypes.length > 0 && !manualMembershipInput ? (
                <select
                  value={form.membershipType}
                  onChange={(e) => {
                    if (e.target.value === "__manual__") {
                      setManualMembershipInput(true);
                      setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                    } else {
                      const picked = clubDetail.memberships?.find(
                        (m) => (m.membershipName || m.membershipType) === e.target.value,
                      );
                      setForm((f) => ({
                        ...f,
                        membershipId: picked?.id ?? null,
                        membershipType: e.target.value,
                      }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  required
                >
                  <option value="">선택</option>
                  {membershipTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  <option value="__manual__">직접 입력</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={form.membershipType}
                    onChange={(e) => setForm((f) => ({ ...f, membershipId: null, membershipType: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    placeholder="예: 개인정회원"
                    required
                  />
                  {membershipTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualMembershipInput(false);
                        setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                    >
                      목록선택
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 고객명 + 연락처 (자동완성) */}
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

            {/* 제시가 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">제시가 (원)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.offerPrice || ""}
                  onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value === "" ? 0 : Number(e.target.value) }))}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="150000000"
                />
                <input
                  type="text"
                  value={form.offerPriceNote}
                  onChange={(e) => setForm((f) => ({ ...f, offerPriceNote: e.target.value }))}
                  className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="비고"
                />
              </div>
            </div>

            {/* 희망가 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">희망가 (원)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.desiredPrice || ""}
                  onChange={(e) => setForm((f) => ({ ...f, desiredPrice: e.target.value === "" ? 0 : Number(e.target.value) }))}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="180000000"
                />
                <input
                  type="text"
                  value={form.desiredPriceNote}
                  onChange={(e) => setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))}
                  className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="비고"
                />
              </div>
            </div>

            {/* 계약금 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                계약금 (원)
                <span className="ml-1 text-[11px] text-gray-400">— 입금 확인 시 승인 가능</span>
              </label>
              <input
                type="number"
                value={form.depositAmount || ""}
                onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value === "" ? 0 : Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                placeholder="10000000"
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">계좌번호</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                placeholder="110-123-456789"
              />
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                minRows={3}
                placeholder="타회원권 교환 희망 등"
              />
            </div>

            {/* 등록일 + 거래일 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">등록일</label>
                <input
                  type="date"
                  value={form.registrationDate}
                  onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">거래일</label>
                <input
                  type="date"
                  value={form.tradeDate}
                  onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            {/* 특이사항 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">특이사항</label>
              <Textarea
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                minRows={2}
                placeholder="계약금 입금 완료 등"
              />
            </div>

            <Button type="submit" disabled={submitting} isLoading={submitting} className="w-full">
              {editingTrade ? "메모 수정" : "메모 저장"}
            </Button>
          </form>
        )}
      </div>

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
    </aside>
  );
}
