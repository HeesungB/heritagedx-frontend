"use client";

import { useState, useEffect, useCallback } from "react";
import { MembershipTrade, MembershipTradeForm, ClubDetail } from "@/types";
import { useConsultationRepository } from "@heritage-dx/api";
import { Button, Loading } from "@heritage-dx/ui";

interface TradeMemoSidebarProps {
  clubDetail: ClubDetail;
  onClose: () => void;
}

type SidebarTab = "list" | "create";

const initialForm: Omit<MembershipTradeForm, "clubId" | "clubName"> = {
  membershipType: "",
  tradeType: "매수",
  customerName: "",
  contact: "",
  offerPrice: 0,
  offerPriceNote: "",
  desiredPrice: 0,
  desiredPriceNote: "",
  notes: "",
  registrationDate: new Date().toISOString().split("T")[0],
  tradeDate: "",
  remarks: "",
  isDone: false,
};

export default function TradeMemoSidebar({ clubDetail, onClose }: TradeMemoSidebarProps) {
  const consultationsRepo = useConsultationRepository();
  const [activeTab, setActiveTab] = useState<SidebarTab>("list");
  const [trades, setTrades] = useState<MembershipTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingTrade, setEditingTrade] = useState<MembershipTrade | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"" | "매수" | "매도">("");
  const [filterDone, setFilterDone] = useState<"" | "done" | "progress">("");
  const [manualMembershipInput, setManualMembershipInput] = useState(false);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await consultationsRepo.getAll({
        page: 1,
        limit: 50,
        sort: "registrationDate",
        order: "DESC",
        search: searchQuery.trim() || undefined,
        tradeType: filterType || undefined,
      });
      if (response.data) {
        setTrades((response.data.trades || []) as unknown as MembershipTrade[]);
      }
    } catch (err) {
      console.error("메모 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
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
        club: clubDetail.name,
        membership: cleaned.membershipType,
        tradeType: cleaned.tradeType,
        customerName: cleaned.customerName,
        contact: cleaned.contact,
        offerPrice: cleaned.offerPrice || null,
        offerPriceNote: cleaned.offerPriceNote,
        desiredPrice: cleaned.desiredPrice || null,
        desiredPriceNote: cleaned.desiredPriceNote,
        notes: cleaned.notes,
        registrationDate: cleaned.registrationDate,
        tradeDate: cleaned.tradeDate,
        remarks: cleaned.remarks,
        isDone: cleaned.isDone,
      };

      let result;
      if (editingTrade) {
        result = await consultationsRepo.update(editingTrade.id, input);
      } else {
        result = await consultationsRepo.create(input);
      }

      if (!result.success) {
        setErrorMessage(result.error || "오류가 발생했습니다.");
        return;
      }

      const wasEditing = !!editingTrade;

      // 신규 등록일 때만 Back Office에 푸시 알림 전송 (fire-and-forget)
      if (!wasEditing && result.data) {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradeId: result.data.id,
            clubName: clubDetail.name,
            tradeType: form.tradeType,
            customerName: form.customerName,
            membershipType: form.membershipType,
            offerPrice: form.offerPrice || null,
            desiredPrice: form.desiredPrice || null,
          }),
        }).catch(() => {});
      }

      setEditingTrade(null);
      setForm(initialForm);
      setActiveTab("list");
      setSuccessMessage(wasEditing ? "수정 완료" : "등록 완료");
      setTimeout(() => setSuccessMessage(null), 2500);
      await fetchTrades();
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
      const result = await consultationsRepo.delete(id);
      if (!result.success) {
        setErrorMessage(result.error || "삭제 실패");
        return;
      }
      setDeleteConfirmId(null);
      setSuccessMessage("삭제 완료");
      setTimeout(() => setSuccessMessage(null), 2500);
      await fetchTrades();
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
    setForm({
      membershipType: tradeType,
      tradeType: trade.tradeType || "매수",
      customerName: trade.customerName || "",
      contact: trade.contact || "",
      offerPrice: trade.offerPrice ? Number(trade.offerPrice) : 0,
      offerPriceNote: trade.offerPriceNote || "",
      desiredPrice: trade.desiredPrice ? Number(trade.desiredPrice) : 0,
      desiredPriceNote: trade.desiredPriceNote || "",
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
      const result = await consultationsRepo.update(trade.id, {
        club: trade.clubName,
        membership: trade.membershipType,
        tradeType: trade.tradeType,
        customerName: trade.customerName,
        contact: trade.contact,
        isDone: !trade.isDone,
      });
      if (result.success) {
        await fetchTrades();
      }
    } catch (err) {
      console.error("상태 변경 실패:", err);
    }
  };

  const filteredTrades = filterDone
    ? trades.filter((t) => filterDone === "done" ? t.isDone : !t.isDone)
    : trades;

  const membershipTypes = clubDetail.memberships?.map(
    (m) => m.membershipName || m.membershipType
  ) || [];

  return (
    <aside className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto w-full lg:w-80 h-full min-h-0 border-l border-gray-200 bg-white flex flex-col print:hidden">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-xs text-gray-700">거래 메모</h3>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          title="닫기"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => { setActiveTab("list"); handleCancelEdit(); }}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "list"
              ? "border-gray-800 text-gray-800"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          리스트 ({trades.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "create"
              ? "border-gray-800 text-gray-800"
              : "border-transparent text-gray-400 hover:text-gray-600"
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
          <div className="p-3 space-y-1.5">
            {/* 검색 + 필터 */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1.5 pr-7 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-400"
                />
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-0.5 bg-gray-100 rounded p-0.5 shrink-0">
                {(["", "매수", "매도"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-1.5 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                      filterType === type
                        ? type === "매수" ? "bg-blue-50 text-blue-700"
                          : type === "매도" ? "bg-red-50 text-red-700"
                          : "bg-white text-gray-700 shadow-sm"
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
              filteredTrades.map((trade) => (
                <div
                  key={trade.id}
                  className={`border rounded-lg transition-colors ${
                    trade.isDone
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* 헤더: 뱃지 + 골프장명 + 회원권종류 */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                        trade.isDone
                          ? "bg-gray-100 text-gray-400"
                          : trade.tradeType === "매수"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                      }`}>
                        {trade.tradeType}
                      </span>
                      <span className={`text-xs font-medium truncate ${trade.isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {trade.clubName}
                      </span>
                    </div>
                    {trade.membershipType && (
                      <div className={`text-[11px] mt-0.5 ml-9 ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>
                        {trade.membershipType}
                      </div>
                    )}
                  </div>

                  {/* 본문 */}
                  <div className="px-3 py-2 space-y-2">
                    {/* 고객정보 */}
                    <div className="flex items-baseline justify-between">
                      <span className={`text-sm font-semibold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.customerName}</span>
                      <span className={`text-xs ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>{trade.contact}</span>
                    </div>

                    {/* 가격 그리드 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded px-2 py-1.5">
                        <div className="text-[11px] text-gray-400">제시가</div>
                        <div className={`text-sm font-semibold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>{formatPrice(trade.offerPrice)}</div>
                        {trade.offerPriceNote && <div className={`text-[11px] ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>{trade.offerPriceNote}</div>}
                      </div>
                      <div className="bg-gray-50 rounded px-2 py-1.5">
                        <div className="text-[11px] text-gray-400">희망가</div>
                        <div className={`text-sm font-semibold ${trade.isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>{formatPrice(trade.desiredPrice)}</div>
                        {trade.desiredPriceNote && <div className={`text-[11px] ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>{trade.desiredPriceNote}</div>}
                      </div>
                    </div>

                    {/* 메모 / 특이사항 */}
                    {(trade.notes || trade.remarks) && (
                      <div className={`border-l-2 pl-2 text-xs leading-relaxed ${trade.isDone ? "border-gray-200 text-gray-400" : "border-gray-300 text-gray-600"}`}>
                        {trade.notes && <p>{trade.notes}</p>}
                        {trade.remarks && <p className="italic">{trade.remarks}</p>}
                      </div>
                    )}

                    {/* 푸터: 날짜 + 액션 */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <span>{trade.registrationDate}</span>
                        {trade.createdByName && <><span>·</span><span>{trade.createdByName}</span></>}
                        {trade.tradeDate && <span className="ml-1">거래 {trade.tradeDate}</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(trade)}
                          className="p-0.5 rounded text-gray-300 hover:text-gray-600"
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
                              className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded"
                            >
                              삭제
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-gray-400 rounded hover:text-gray-600"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(trade.id)}
                            className="p-0.5 rounded text-gray-300 hover:text-red-400"
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
                {["매수", "매도"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tradeType: type }))}
                    className={`flex-1 py-2 text-sm rounded border transition-colors ${
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
                      setForm((f) => ({ ...f, membershipType: "" }));
                    } else {
                      setForm((f) => ({ ...f, membershipType: e.target.value }));
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
                    onChange={(e) => setForm((f) => ({ ...f, membershipType: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    placeholder="예: 개인정회원"
                    required
                  />
                  {membershipTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualMembershipInput(false);
                        setForm((f) => ({ ...f, membershipType: "" }));
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                    >
                      목록선택
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 고객명 + 연락처 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">고객명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                  placeholder="010-1234-5678"
                  required
                />
              </div>
            </div>

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

            {/* 메모 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500 resize-none"
                rows={2}
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
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                placeholder="계약금 입금 완료 등"
              />
            </div>

            {/* 완료 여부 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDone}
                onChange={(e) => setForm((f) => ({ ...f, isDone: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-xs font-medium text-gray-700">거래 완료</span>
            </label>

            <Button type="submit" disabled={submitting} isLoading={submitting} className="w-full">
              {editingTrade ? "메모 수정" : "메모 저장"}
            </Button>
          </form>
        )}
      </div>
    </aside>
  );
}
