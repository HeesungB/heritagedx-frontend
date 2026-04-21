"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Header from "@/components/Header";
import { MembershipTrade, MembershipTradeForm, Club } from "@/types";
import { ClubSearchSelect, Button, Loading, ConfirmModal } from "@heritage-dx/ui";
import { useAppStores } from "@/stores";
import { useClubs, useClubDetail, useConsultations, canDeleteConsultation } from "@heritage-dx/store";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import CustomerAutocomplete from "@/components/CustomerAutocomplete";
import ApprovalRequirementsModal from "@/components/ApprovalRequirementsModal";
import { trackEvent } from "@/lib/gtag";
import { StatusBadge } from "@/components/approval/StatusBadge";
import {
  collectMissingConsultationApprovalFields,
  type ApprovalStatus,
  type ConsultationApprovalFillableField,
  type ConsultationApprovalStructuralField,
} from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";

type TradeFilter = "전체" | "매수" | "매도";
type ApprovalFilter = "" | ApprovalStatus;

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
  notes: "",
  registrationDate: new Date().toISOString().split("T")[0],
  tradeDate: "",
  remarks: "",
  isDone: false,
};

export default function TradesPageClient() {
  const { club: clubStore, tradeMemo: tradeMemoStore } = useAppStores();
  const { user } = useAuth();
  const { clubs, isLoading: clubsLoading } = useClubs(clubStore);
  const { items: rawTrades, fetch: fetchFromStore, create, update, remove, toggleDone, requestApproval, reopen, isLoading: loading } = useConsultations(tradeMemoStore);
  const { send: sendNotification } = useSendTradeNotification();
  const [filter, setFilter] = useState<TradeFilter>("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MembershipTradeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingTrade, setEditingTrade] = useState<MembershipTrade | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"registrationDate" | "tradeDate">("registrationDate");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [selectedClubCode, setSelectedClubCode] = useState<string>("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<string>("");
  const [filterDone, setFilterDone] = useState<"전체" | "완료" | "진행중">("진행중");
  const [filterApproval, setFilterApproval] = useState<ApprovalFilter>("");
  const [showConverted, setShowConverted] = useState(false);
  const [approvalPendingId, setApprovalPendingId] = useState<string | null>(null);
  const [requirementsPrompt, setRequirementsPrompt] = useState<{
    trade: MembershipTrade;
    fillable: ConsultationApprovalFillableField[];
  } | null>(null);
  const [requirementsSubmitting, setRequirementsSubmitting] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [formClubCode, setFormClubCode] = useState<string>("");
  const [formMemberships, setFormMemberships] = useState<string[]>([]);
  const [manualClubInput, setManualClubInput] = useState(false);
  const [manualMembershipInput, setManualMembershipInput] = useState(false);
  const ensureFlow = useCustomerEnsureFlow();
  const formRef = useRef(form);
  formRef.current = form;

  // 골프장 상세 (필터 및 폼용 회원권 목록)
  const { detail: selectedClubDetail } = useClubDetail(clubStore, selectedClubCode || null);
  const { detail: formClubDetail } = useClubDetail(
    clubStore,
    formClubCode && formClubCode !== "__manual__" ? formClubCode : null
  );

  // 필터용 회원권 목록 (골프장 필터 선택 시)
  useEffect(() => {
    if (!selectedClubCode || !selectedClubDetail) { setMemberships([]); return; }
    const names = selectedClubDetail.memberships.map((m) => m.membershipName || m.membershipType);
    setMemberships(names);
  }, [selectedClubCode, selectedClubDetail]);

  // 폼용 회원권 목록 (폼에서 골프장 선택 시)
  useEffect(() => {
    if (!formClubCode || formClubCode === "__manual__" || !formClubDetail) {
      setFormMemberships([]);
      return;
    }
    const names = formClubDetail.memberships?.map((m) => m.membershipName || m.membershipType) || [];
    setFormMemberships(names);
    const currentType = formRef.current.membershipType;
    const matched = formClubDetail.memberships?.find(
      (m) => (m.membershipName || m.membershipType) === currentType,
    );
    setForm((f) => ({
      ...f,
      clubId: formClubDetail.id || "",
      clubName: formClubDetail.name,
      membershipId: matched?.id ?? null,
    }));
    if (currentType && !names.includes(currentType)) {
      setManualMembershipInput(true);
    } else {
      setManualMembershipInput(false);
    }
  }, [formClubCode, formClubDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchFromStore({
      page,
      limit: 20,
      sort: sortField,
      order: sortOrder,
      tradeType: filter !== "전체" ? filter : undefined,
      search: searchQuery.trim() || undefined,
      isDone: filterDone === "완료" ? true : filterDone === "진행중" ? false : undefined,
      approvalStatus: filterApproval || undefined,
      isConverted: showConverted ? undefined : false,
    });
  }, [page, filter, searchQuery, sortField, sortOrder, filterDone, filterApproval, showConverted]); // eslint-disable-line react-hooks/exhaustive-deps

  // 클라이언트 필터링: 골프장/회원권/기간 선택 시 네트워크 요청 없이 즉시 필터
  const trades = useMemo(() => {
    let filtered = rawTrades as MembershipTrade[];
    const selectedClubName = clubs.find((c) => c.code === selectedClubCode)?.name;
    if (selectedClubName) {
      filtered = filtered.filter((t) => t.clubName === selectedClubName);
    }
    if (selectedMembership) {
      filtered = filtered.filter((t) => t.membershipType === selectedMembership);
    }
    if (dateFrom) {
      filtered = filtered.filter((t) => (t.registrationDate || "") >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => (t.registrationDate || "") <= dateTo);
    }
    return filtered;
  }, [rawTrades, clubs, selectedClubCode, selectedMembership, dateFrom, dateTo]);

  // 거래 데이터에 있는 골프장만 필터 드롭다운에 표시
  const availableClubs = useMemo(() => {
    const tradeClubNames = new Set(rawTrades.map((t) => (t as MembershipTrade).clubName).filter(Boolean));
    if (tradeClubNames.size === 0) return clubs as unknown as Club[];
    return clubs.filter((c) => tradeClubNames.has(c.name));
  }, [rawTrades, clubs]);

  const persistConsultation = async () => {
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
      notes: form.notes || null,
      registrationDate: form.registrationDate || null,
      tradeDate: form.tradeDate || null,
      remarks: form.remarks || null,
      isDone: form.isDone,
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
        clubName: form.clubName,
        tradeType: form.tradeType,
        customerName: form.customerName,
        membershipType: form.membershipType,
        offerPrice: form.offerPrice || null,
        desiredPrice: form.desiredPrice || null,
      });
    }

    setEditingTrade(null);
    setForm(emptyForm);
    setShowForm(false);
    setFormClubCode("");
    setFormMemberships([]);
    setManualClubInput(false);
    setManualMembershipInput(false);
    if (!wasEditing) {
      trackEvent("trade_memo_create", { club_name: form.clubName, trade_type: form.tradeType });
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

  const handleEdit = (trade: MembershipTrade) => {
    setEditingTrade(trade);
    setErrorMessage(null);
    setForm({
      clubId: trade.clubId || "",
      clubName: trade.clubName || "",
      membershipId: null,
      membershipType: trade.membershipType || "",
      tradeType: trade.tradeType || "매수",
      customerId: trade.customerId ?? null,
      customerName: trade.customerName || "",
      contact: trade.contact || "",
      offerPrice: trade.offerPrice ? Number(trade.offerPrice) : 0,
      offerPriceNote: trade.offerPriceNote || "",
      desiredPrice: trade.desiredPrice ? Number(trade.desiredPrice) : 0,
      desiredPriceNote: trade.desiredPriceNote || "",
      depositAmount: trade.depositAmount ?? 0,
      notes: trade.notes || "",
      registrationDate: trade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: trade.tradeDate || "",
      remarks: trade.remarks || "",
      isDone: trade.isDone ?? false,
    });
    const matchedClub = clubs.find((c) => c.name === trade.clubName);
    if (matchedClub) {
      setFormClubCode(matchedClub.code);
      setManualClubInput(false);
    } else {
      setFormClubCode("__manual__");
      setManualClubInput(true);
    }
    setManualMembershipInput(false);
    setShowForm(true);
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
    } catch (err) {
      console.error("메모 삭제 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
  };

  const handleToggleDone = async (trade: MembershipTrade) => {
    try {
      await toggleDone(trade.id, !trade.isDone);
    } catch (err) {
      console.error("상태 변경 실패:", err);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTrade(null);
    setForm(emptyForm);
    setFormClubCode("");
    setFormMemberships([]);
    setManualClubInput(false);
    setManualMembershipInput(false);
  };

  const formatPrice = (price: number | string | null) => {
    if (price === null) return "-";
    const num = typeof price === "string" ? Number(price) : price;
    if (!num) return "-";
    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toLocaleString()}만원`;
    }
    return `${num.toLocaleString()}원`;
  };

  const filters: TradeFilter[] = ["전체", "매수", "매도"];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header clubName={null} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-6">
          {/* 페이지 헤더 */}
          <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-amber-500 p-5 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">상담일지</h2>
                  <p className="text-sm text-gray-500 mt-0.5">전체 골프장의 회원권 상담일지를 관리합니다</p>
                </div>
              </div>
              <Button
                className="flex-shrink-0"
                onClick={() => { setShowForm(true); setEditingTrade(null); setForm(emptyForm); setFormClubCode(""); setFormMemberships([]); setManualClubInput(false); setManualMembershipInput(false); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 메모
              </Button>
            </div>
          </div>

          {/* 필터 바 */}
          <div className="bg-white rounded-lg border border-gray-200 border-t-2 border-t-amber-300 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 거래유형 필터 */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPage(1); }}
                    className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                      filter === f
                        ? f === "매도" ? "bg-red-100 text-red-700 border border-red-300"
                          : f === "매수" ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* 상태 필터 */}
              <select
                value={filterDone}
                onChange={(e) => setFilterDone(e.target.value as "전체" | "완료" | "진행중")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="전체">전체</option>
                <option value="완료">완료</option>
                <option value="진행중">진행중</option>
              </select>

              {/* 승인 상태 필터 */}
              <select
                value={filterApproval}
                onChange={(e) => { setFilterApproval(e.target.value as ApprovalFilter); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">승인 상태 전체</option>
                <option value="DRAFT">작성중</option>
                <option value="PENDING_APPROVAL">승인대기</option>
                <option value="ON_HOLD">보류</option>
                <option value="REJECTED">반려</option>
                {showConverted && <option value="FIRST_APPROVED">승인</option>}
              </select>

              {/* 승인내역 포함 토글 */}
              <label className="flex items-center gap-1.5 text-xs text-gray-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConverted}
                  onChange={(e) => {
                    setShowConverted(e.target.checked);
                    if (!e.target.checked && filterApproval === "FIRST_APPROVED") {
                      setFilterApproval("");
                    }
                    setPage(1);
                  }}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
                승인내역 포함
              </label>

              {/* 골프장 필터 */}
              <ClubSearchSelect
                clubs={availableClubs}
                selectedClubCode={selectedClubCode}
                onChange={(code) => { setSelectedClubCode(code); setSelectedMembership(""); setPage(1); }}
              />

              {/* 회원권 필터 */}
              <select
                value={selectedMembership}
                onChange={(e) => { setSelectedMembership(e.target.value); }}
                disabled={!selectedClubCode}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">전체 회원권</option>
                {memberships.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* 기간 검색 */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gray-500 w-full sm:w-[130px]"
                />
                <span className="text-gray-400 text-xs">~</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gray-500 w-full sm:w-[130px]"
                />
              </div>

              {/* 검색 */}
              <div className="relative w-full sm:w-52">
                <input
                  type="text"
                  placeholder="골프장명, 고객명 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                />
                <svg className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* 정렬 */}
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [typeof sortField, typeof sortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="registrationDate-DESC">등록일 최신순</option>
                <option value="registrationDate-ASC">등록일 오래된순</option>
                <option value="tradeDate-DESC">거래일 최신순</option>
                <option value="tradeDate-ASC">거래일 오래된순</option>
              </select>
            </div>
          </div>

          {/* 메모 작성 폼 */}
          {showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  {editingTrade ? "메모 수정" : "새 메모 작성"}
                </h3>
                <button onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                    <span className="text-red-700 flex-1">{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 거래유형 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">거래유형 <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      {(["매수", "매도"] as const).map((type) => (
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

                  {/* 골프장명 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">골프장명 <span className="text-red-500">*</span></label>
                    {manualClubInput ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={form.clubName}
                          onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value, clubId: "", membershipId: null }))}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                          placeholder="골프장명 직접 입력"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setManualClubInput(false);
                            setFormClubCode("");
                            setForm((f) => ({ ...f, clubName: "", clubId: "", membershipId: null, membershipType: "" }));
                            setFormMemberships([]);
                            setManualMembershipInput(false);
                          }}
                          className="px-2.5 py-2 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                        >
                          목록선택
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <ClubSearchSelect
                          clubs={clubs}
                          selectedClubCode={formClubCode}
                          onChange={(code) => {
                            setFormClubCode(code);
                            if (!code) {
                              setForm((f) => ({ ...f, clubName: "", clubId: "", membershipId: null, membershipType: "" }));
                              setFormMemberships([]);
                              setManualMembershipInput(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setManualClubInput(true);
                            setFormClubCode("__manual__");
                            setForm((f) => ({ ...f, clubName: "", clubId: "", membershipId: null, membershipType: "" }));
                            setFormMemberships([]);
                            setManualMembershipInput(true);
                          }}
                          className="px-2.5 py-2 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                        >
                          직접입력
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 회원권 종류 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">회원권 종류 <span className="text-red-500">*</span></label>
                    {formMemberships.length > 0 && !manualMembershipInput ? (
                      <select
                        value={form.membershipType}
                        onChange={(e) => {
                          if (e.target.value === "__manual__") {
                            setManualMembershipInput(true);
                            setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                          } else {
                            const picked = formClubDetail?.memberships.find(
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
                        {formMemberships.map((type) => (
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
                          placeholder="개인정회원"
                          required
                        />
                        {formMemberships.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualMembershipInput(false);
                              setForm((f) => ({ ...f, membershipId: null, membershipType: "" }));
                            }}
                            className="px-2.5 py-2 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                          >
                            목록선택
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 고객 (자동완성) */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 제시가 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">제시가 (원)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={form.offerPrice}
                        onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value === "" ? 0 : Number(e.target.value) }))}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="150000000"
                      />
                      <input
                        type="text"
                        value={form.offerPriceNote}
                        onChange={(e) => setForm((f) => ({ ...f, offerPriceNote: e.target.value }))}
                        className="w-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
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
                        value={form.desiredPrice}
                        onChange={(e) => setForm((f) => ({ ...f, desiredPrice: e.target.value === "" ? 0 : Number(e.target.value) }))}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="180000000"
                      />
                      <input
                        type="text"
                        value={form.desiredPriceNote}
                        onChange={(e) => setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))}
                        className="w-28 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="비고"
                      />
                    </div>
                  </div>
                </div>

                {/* 계약금 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">계약금 (원)</label>
                  <input
                    type="number"
                    value={form.depositAmount}
                    onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    placeholder="10000000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 메모 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="타회원권 교환 희망"
                    />
                  </div>

                  {/* 등록일 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">등록일</label>
                    <input
                      type="date"
                      value={form.registrationDate}
                      onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* 거래일 */}
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

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCancelForm}>취소</Button>
                  <Button type="submit" disabled={submitting} isLoading={submitting}>{editingTrade ? "수정" : "저장"}</Button>
                </div>
              </form>
            </div>
          )}

          {/* 메모 테이블 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><Loading text="로딩 중..." /></div>
            ) : trades.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 mb-3">등록된 상담일지가 없습니다</p>
                <button
                  onClick={() => { setShowForm(true); setEditingTrade(null); setForm(emptyForm); setFormClubCode(""); setFormMemberships([]); setManualClubInput(false); setManualMembershipInput(false); }}
                  className="text-sm text-gray-600 underline hover:text-gray-900"
                >
                  새 메모 작성하기
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[360px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">상태</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">승인</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">유형</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">골프장</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">회원권</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">고객명</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">연락처</th>
                      <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">제시가</th>
                      <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">희망가</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">등록일</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">작성자</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">메모</th>
                      <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trades.map((trade) => (
                      <tr key={trade.id} className={`transition-colors ${trade.isDone ? "bg-green-50/40 opacity-60" : "hover:bg-gray-50"}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={trade.isDone ?? false}
                            onChange={() => handleToggleDone(trade)}
                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            title={trade.isDone ? "완료 → 진행중" : "진행중 → 완료"}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={trade.approvalStatus} />
                            {(trade.approvalStatus === "DRAFT" || trade.approvalStatus === "ON_HOLD") && (
                              <button
                                type="button"
                                disabled={approvalPendingId === trade.id}
                                onClick={async () => {
                                  const { structural, fillable } = collectMissingConsultationApprovalFields(trade);
                                  if (structural.length > 0) {
                                    const labels: Record<ConsultationApprovalStructuralField, string> = {
                                      tradeType: "거래 유형",
                                      clubId: "골프장",
                                      membershipId: "회원권",
                                    };
                                    setErrorMessage(
                                      `상담을 먼저 편집해서 ${structural.map((f) => labels[f]).join(", ")}를 선택해 주세요.`,
                                    );
                                    return;
                                  }
                                  if (fillable.length > 0) {
                                    setRequirementsPrompt({ trade, fillable });
                                    return;
                                  }
                                  setApprovalPendingId(trade.id);
                                  try {
                                    const result = await requestApproval(trade.id);
                                    if (result.entity) return;
                                    if (result.missingFillable && result.missingFillable.length > 0) {
                                      const refreshed = rawTrades.find((t) => t.id === trade.id) ?? trade;
                                      setRequirementsPrompt({ trade: refreshed as MembershipTrade, fillable: result.missingFillable });
                                      return;
                                    }
                                    setErrorMessage(result.errorMessage || "승인 요청 실패");
                                  } finally {
                                    setApprovalPendingId(null);
                                  }
                                }}
                                className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                              >
                                승인 요청
                              </button>
                            )}
                            {trade.approvalStatus === "REJECTED" && (
                              <button
                                type="button"
                                disabled={approvalPendingId === trade.id}
                                onClick={async () => {
                                  setApprovalPendingId(trade.id);
                                  try {
                                    const updated = await reopen(trade.id);
                                    if (!updated) setErrorMessage("다시 열기 요청 실패");
                                  } finally {
                                    setApprovalPendingId(null);
                                  }
                                }}
                                className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                다시 열기
                              </button>
                            )}
                            {trade.approvalStatus === "FIRST_APPROVED" && trade.linkedTradeId && (
                              <a
                                href={`/membership-trades?highlight=${trade.linkedTradeId}`}
                                className="text-xs px-2 py-0.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              >
                                거래 보기
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              trade.isDone
                                ? "bg-gray-100 text-gray-400"
                                : trade.tradeType === "매수"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {trade.tradeType}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.clubName}</td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.membershipType}</td>
                        <td className={`px-4 py-3 text-sm whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.customerName}</td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.contact}</td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm text-right whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {formatPrice(trade.offerPrice)}
                          {trade.offerPriceNote && (
                            <span className="text-xs text-gray-400 ml-1">({trade.offerPriceNote})</span>
                          )}
                        </td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm text-right whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {formatPrice(trade.desiredPrice)}
                          {trade.desiredPriceNote && (
                            <span className="text-xs text-gray-400 ml-1">({trade.desiredPriceNote})</span>
                          )}
                        </td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.registrationDate}</td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.createdByName || "-"}</td>
                        <td className={`hidden md:table-cell px-4 py-3 text-sm max-w-[200px] truncate ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>
                          {trade.notes || trade.remarks || "-"}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(trade)}
                              className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {canDeleteConsultation(user, trade) && (deleteConfirmId === trade.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(trade.id)}
                                  className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  삭제
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-0.5 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(trade.id)}
                                className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                                title="삭제"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음</Button>
              </div>
            )}
          </div>
        </div>
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

      <ApprovalRequirementsModal
        isOpen={!!requirementsPrompt}
        onClose={() => {
          if (requirementsSubmitting) return;
          setRequirementsPrompt(null);
        }}
        isSubmitting={requirementsSubmitting}
        missingFillable={requirementsPrompt?.fillable ?? []}
        initial={{
          customerName: requirementsPrompt?.trade.customerName,
          contact: requirementsPrompt?.trade.contact,
          offerPrice: requirementsPrompt?.trade.offerPrice ?? null,
          depositAmount: requirementsPrompt?.trade.depositAmount ?? null,
        }}
        onSubmit={async (patch) => {
          if (!requirementsPrompt) return;
          setRequirementsSubmitting(true);
          setApprovalPendingId(requirementsPrompt.trade.id);
          try {
            const result = await requestApproval(requirementsPrompt.trade.id, patch);
            if (result.entity) {
              setRequirementsPrompt(null);
              return;
            }
            if (result.missingFillable && result.missingFillable.length > 0) {
              const refreshed = rawTrades.find((t) => t.id === requirementsPrompt.trade.id) ?? requirementsPrompt.trade;
              setRequirementsPrompt({ trade: refreshed as MembershipTrade, fillable: result.missingFillable });
              return;
            }
            setErrorMessage(result.errorMessage || "승인 요청 실패");
          } finally {
            setRequirementsSubmitting(false);
            setApprovalPendingId(null);
          }
        }}
      />
    </div>
  );
}
