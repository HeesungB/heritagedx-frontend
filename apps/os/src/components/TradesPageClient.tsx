"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import { MembershipTrade, MembershipTradeForm, Club } from "@/types";
import { ClubSearchSelect, Button, Loading, ConfirmModal } from "@heritage-dx/ui";
import { useAppStores } from "@/stores";
import {
  useClubs,
  useClubDetail,
  useConsultations,
  canDeleteConsultation,
  decodeMemoHistory,
  type MemoHistoryEntry,
} from "@heritage-dx/store";
import { useSendTradeNotification } from "@/hooks/useSendTradeNotification";
import { useCustomerEnsureFlow } from "@/hooks/useCustomerEnsureFlow";
import CustomerAutocomplete from "@/components/CustomerAutocomplete";
import ApprovalRequirementsModal from "@/components/ApprovalRequirementsModal";
import { trackEvent } from "@/lib/gtag";
import {
  collectMissingConsultationApprovalFields,
  type ApprovalStatus,
  type ConsultationApprovalFillableField,
  type ConsultationApprovalStructuralField,
} from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";

type TradeFilter = "전체" | "매수" | "매도" | "미정";

function buildPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = buildPageItems(page, totalPages);
  const baseBtn =
    "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-[12px] font-medium transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={`${baseBtn} bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40`}
        aria-label="이전 페이지"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {items.map((it, idx) =>
        it === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-gray-400 text-[12px]">
            ⋯
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            className={`${baseBtn} ${
              it === page
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {it}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${baseBtn} bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40`}
        aria-label="다음 페이지"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

type ApprovalFilter = "" | ApprovalStatus;

const APPROVAL_DOT: Record<string, string> = {
  IN_CONSULTATION: "bg-gray-400",
  DRAFT: "bg-gray-400",
  PENDING_DEPOSIT: "bg-amber-500",
  PENDING_APPROVAL: "bg-amber-500",
  DEPOSIT_APPROVED: "bg-emerald-500",
  FIRST_APPROVED: "bg-emerald-500",
  TAX_FILING: "bg-sky-500",
  COMPLETED: "bg-emerald-600",
  ON_HOLD: "bg-orange-500",
  REJECTED: "bg-red-500",
};
const APPROVAL_LABEL: Record<string, string> = {
  IN_CONSULTATION: "상담중",
  DRAFT: "상담중",
  PENDING_DEPOSIT: "검토중",
  PENDING_APPROVAL: "검토중",
  DEPOSIT_APPROVED: "승인",
  FIRST_APPROVED: "승인",
  TAX_FILING: "세무신고",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  REJECTED: "반려",
};

const TRADE_TYPE_BADGE: Record<"매수" | "매도" | "미정", string> = {
  매수: "bg-emerald-100 text-emerald-700",
  매도: "bg-rose-100 text-rose-700",
  미정: "bg-amber-100 text-amber-700",
};

function tradeTypeBadgeClass(tradeType: string | null | undefined, isDone: boolean): string {
  if (isDone) return "bg-gray-100 text-gray-400";
  const key = (tradeType === "매수" || tradeType === "매도") ? tradeType : "미정";
  return TRADE_TYPE_BADGE[key];
}

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

export default function TradesPageClient() {
  const { club: clubStore, tradeMemo: tradeMemoStore } = useAppStores();
  const { user } = useAuth();
  const { clubs, isLoading: clubsLoading } = useClubs(clubStore);
  const { items: pageTrades, pagination, fetch: fetchFromStore, create, update, remove, toggleDone, appendMemo, requestApproval, isLoading: loading } = useConsultations(tradeMemoStore);
  // 인피니트 스크롤: 페이지마다 store가 items를 대체하므로 컴포넌트에서 누적
  const [rawTrades, setRawTrades] = useState<MembershipTrade[]>([]);
  const { send: sendNotification } = useSendTradeNotification();
  const [filter, setFilter] = useState<TradeFilter>("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState<Record<string, string>>({});
  const [memoSubmittingId, setMemoSubmittingId] = useState<string | null>(null);
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
    // 백엔드가 isDone/isConverted 쿼리 파라미터를 거부하므로 서버 필터에서 제외.
    // 완료/진행중·거래전환 필터는 클라이언트 사이드에서 적용한다.
    fetchFromStore({
      page,
      limit: 20,
      sort: sortField,
      order: sortOrder,
      // "미정" 은 백엔드에 없는 클라이언트 분류이므로 서버 쿼리에서 제외
      tradeType: filter === "매수" || filter === "매도" ? filter : undefined,
      search: searchQuery.trim() || undefined,
      approvalStatus: filterApproval || undefined,
    });
  }, [page, filter, searchQuery, sortField, sortOrder, filterApproval]); // eslint-disable-line react-hooks/exhaustive-deps

  // 페이지네이션: page 가 바뀔 때마다 현재 페이지 결과로 교체
  useEffect(() => {
    setRawTrades(pageTrades as MembershipTrade[]);
  }, [pageTrades]);

  // 클라이언트 필터링: 골프장/회원권/기간/완료여부/거래전환 선택 시 네트워크 요청 없이 즉시 필터
  // (isDone/isConverted 는 서버 쿼리 파라미터에서 제거되어 여기서 처리한다)
  const trades = useMemo(() => {
    let filtered = rawTrades as MembershipTrade[];
    if (filter === "미정") {
      filtered = filtered.filter((t) => !t.offerPrice && !t.desiredPrice && !t.tradeDate);
    }
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
    if (filterDone === "완료") {
      filtered = filtered.filter((t) => t.isDone === true);
    } else if (filterDone === "진행중") {
      filtered = filtered.filter((t) => !t.isDone);
    }
    if (!showConverted) {
      filtered = filtered.filter(
        (t) =>
          !t.linkedTradeId &&
          t.approvalStatus !== "DEPOSIT_APPROVED" &&
          t.approvalStatus !== "FIRST_APPROVED",
      );
    }
    return filtered;
  }, [rawTrades, clubs, selectedClubCode, selectedMembership, dateFrom, dateTo, filterDone, showConverted, filter]);

  // 거래 데이터에 있는 골프장만 필터 드롭다운에 표시
  const availableClubs = useMemo(() => {
    const tradeClubNames = new Set(rawTrades.map((t) => (t as MembershipTrade).clubName).filter(Boolean));
    if (tradeClubNames.size === 0) return clubs as unknown as Club[];
    return clubs.filter((c) => tradeClubNames.has(c.name));
  }, [rawTrades, clubs]);

  const persistConsultation = async () => {
    // 메모/특이사항은 폼이 아닌 행 확장 패널에서 누적되므로,
    // 수정 시에는 기존 값을 유지하고 신규 등록 시에는 비워둔다.
    const preservedNotes = editingTrade ? editingTrade.notes ?? null : null;
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
      notes: preservedNotes,
      registrationDate: form.registrationDate || null,
      tradeDate: form.tradeDate || null,
      remarks: preservedRemarks,
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
      accountNumber: trade.accountNumber || "",
      notes: trade.notes || "",
      registrationDate: trade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: trade.tradeDate || "",
      remarks: trade.remarks || "",
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

  const buildMemoEntries = useCallback((trade: MembershipTrade): MemoHistoryEntry[] => {
    return decodeMemoHistory(trade.notes, {
      author: trade.createdByName ?? "—",
      createdAt: trade.createdAt,
      remarks: trade.remarks,
    });
  }, []);

  const handleSubmitMemo = useCallback(
    async (trade: MembershipTrade) => {
      const draft = (memoDraft[trade.id] ?? "").trim();
      if (!draft) return;
      const authorName = user?.name?.trim() || user?.email || "—";
      const authorId = user?.id ? String(user.id) : null;
      setMemoSubmittingId(trade.id);
      try {
        const entity = await appendMemo(trade.id, draft, { name: authorName, id: authorId });
        if (!entity) {
          setErrorMessage("메모 저장에 실패했습니다.");
          return;
        }
        setRawTrades((prev) =>
          prev.map((t) => (t.id === trade.id ? ({ ...t, notes: entity.notes, remarks: entity.remarks, updatedAt: entity.updatedAt } as MembershipTrade) : t)),
        );
        setMemoDraft((prev) => ({ ...prev, [trade.id]: "" }));
      } catch (err) {
        console.error("메모 추가 실패:", err);
        setErrorMessage("네트워크 오류가 발생했습니다.");
      } finally {
        setMemoSubmittingId(null);
      }
    },
    [appendMemo, memoDraft, user?.email, user?.id, user?.name],
  );

  const formatEntryTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return iso;
    }
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

  const filters: TradeFilter[] = ["전체", "매수", "매도", "미정"];

  // "미정" = 제시가/희망가/거래일 모두 비어있어 아직 가격 정보가 정해지지 않은 상담
  const isUndecided = (t: MembershipTrade) => !t.offerPrice && !t.desiredPrice && !t.tradeDate;

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col bg-gray-100 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-baseline gap-2 min-w-0">
              <h2 className="text-[20px] font-bold text-gray-900 leading-none">상담일지</h2>
              <p className="text-xs text-gray-500 leading-none">회원권 상담 내용을 기록·관리합니다</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(true); setEditingTrade(null); setForm(emptyForm); setFormClubCode(""); setFormMemberships([]); setManualClubInput(false); setManualMembershipInput(false); }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-black"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 상담일지
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-white/20 text-[10px] font-semibold leading-none">N</span>
            </button>
          </div>

          {/* 검색 */}
          <div className="relative bg-gray-50 rounded-md border border-gray-200 mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="이 페이지에서 검색 — 고객명, 연락처, 골프장, 회원권, 메모 내용..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-12 py-2.5 bg-transparent text-sm focus:outline-none rounded-md placeholder:text-gray-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-500 leading-none">/</span>
          </div>

          {/* 필터 바 */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* 거래유형 pill 카운트 */}
            <div className="flex items-center gap-1">
              {filters.map((f) => {
                const count =
                  f === "전체"
                    ? rawTrades.length
                    : f === "미정"
                      ? rawTrades.filter(isUndecided).length
                      : rawTrades.filter((t) => t.tradeType === f).length;
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFilter(f); setPage(1); }}
                    className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{f}</span>
                    <span className={`inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full text-[10px] font-semibold leading-none ${
                      active ? "bg-white text-gray-900" : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 진행상태 */}
            <select
              value={filterDone}
              onChange={(e) => setFilterDone(e.target.value as "전체" | "완료" | "진행중")}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400"
            >
              <option value="전체">진행 전체</option>
              <option value="완료">완료</option>
              <option value="진행중">진행중</option>
            </select>

            {/* 승인 상태 */}
            <select
              value={filterApproval}
              onChange={(e) => { setFilterApproval(e.target.value as ApprovalFilter); setPage(1); }}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400"
            >
              <option value="">승인 상태 전체</option>
              <option value="IN_CONSULTATION">상담중</option>
              <option value="PENDING_DEPOSIT">계약금 대기</option>
              {showConverted && <option value="DEPOSIT_APPROVED">계약금 승인</option>}
            </select>

            {/* 기간 */}
            <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-xs text-gray-700 focus:outline-none w-[110px]"
              />
              <span className="text-gray-300 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-xs text-gray-700 focus:outline-none w-[110px]"
              />
            </div>

            {/* 골프장 필터 */}
            <ClubSearchSelect
              clubs={availableClubs}
              selectedClubCode={selectedClubCode}
              onChange={(code) => { setSelectedClubCode(code); setSelectedMembership(""); setPage(1); }}
            />

            {/* 회원권 */}
            <select
              value={selectedMembership}
              onChange={(e) => { setSelectedMembership(e.target.value); }}
              disabled={!selectedClubCode}
              className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">전체 회원권</option>
              {memberships.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* 승인내역 포함 토글 */}
            <label className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 select-none cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={showConverted}
                onChange={(e) => {
                  setShowConverted(e.target.checked);
                  if (!e.target.checked && filterApproval === "DEPOSIT_APPROVED") {
                    setFilterApproval("");
                  }
                  setPage(1);
                }}
                className="w-3 h-3 rounded border-gray-300"
              />
              승인내역 포함
            </label>

            {/* 우측: 카운트 + 정렬 */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-gray-500">총 {rawTrades.length}건</span>
              <span className="text-[11px] text-gray-300">·</span>
              <span className="text-[11px] text-gray-500">정렬</span>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [typeof sortField, typeof sortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="bg-white border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400"
              >
                <option value="registrationDate-DESC">최신순</option>
                <option value="registrationDate-ASC">오래된순</option>
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
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-rose-600 text-white border-rose-600"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  메모와 특이사항은 행을 펼쳐 메모 히스토리에 누적 기록할 수 있습니다.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCancelForm}>취소</Button>
                  <Button type="submit" disabled={submitting} isLoading={submitting}>{editingTrade ? "수정" : "저장"}</Button>
                </div>
              </form>
            </div>
          )}

          {/* 메모 테이블 */}
          <div>
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
                    <tr className="bg-gray-50/70 border-b border-gray-200">
                      <th className="w-10 px-3 py-2.5 text-center text-[11px] font-medium text-gray-500 whitespace-nowrap" data-stop-row-toggle>
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" disabled />
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">유형</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">승인 상태</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">골프장</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">회원권</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">고객명</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">연락처</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">메모</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-right text-[11px] font-medium text-gray-500 whitespace-nowrap">제시가</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-right text-[11px] font-medium text-gray-500 whitespace-nowrap">희망가</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 whitespace-nowrap">등록일</th>
                      <th className="hidden md:table-cell px-3 py-2.5 text-center text-[11px] font-medium text-gray-500 whitespace-nowrap w-10">⋯</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trades.map((trade) => {
                      const memoEntries = buildMemoEntries(trade);
                      const latestEntry = memoEntries.length > 0 ? memoEntries[memoEntries.length - 1] : null;
                      const isExpanded = expandedId === trade.id;
                      const draft = memoDraft[trade.id] ?? "";
                      const submittingMemo = memoSubmittingId === trade.id;
                      return (
                      <Fragment key={trade.id}>
                      <tr
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-stop-row-toggle]")) return;
                          setExpandedId((prev) => (prev === trade.id ? null : trade.id));
                        }}
                        className={`transition-colors cursor-pointer ${trade.isDone ? "bg-green-50/40 opacity-60" : isExpanded ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      >
                        <td className="w-10 px-3 py-2.5 text-center" data-stop-row-toggle>
                          <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300" />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-11 h-5 rounded text-[11px] font-semibold ${tradeTypeBadgeClass(trade.tradeType, trade.isDone)}`}
                          >
                            {trade.tradeType || "미정"}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] ${trade.isDone ? "text-gray-400" : "text-gray-700"}`}>
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${APPROVAL_DOT[trade.approvalStatus] ?? "bg-gray-300"}`} />
                            {APPROVAL_LABEL[trade.approvalStatus] ?? trade.approvalStatus}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-[13px] font-medium whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.clubName}</td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[12px] whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.membershipType}</td>
                        <td className={`px-3 py-2.5 text-[13px] whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>{trade.customerName}</td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[12px] whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.contact}</td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[12px] max-w-[260px] ${trade.isDone ? "text-gray-400" : "text-gray-500"}`}>
                          {latestEntry ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{latestEntry.content}</span>
                              {memoEntries.length > 1 && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                  +{memoEntries.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">메모 없음</span>
                          )}
                        </td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[13px] text-right whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {formatPrice(trade.offerPrice)}
                          {trade.offerPriceNote && (
                            <span className="text-[11px] text-gray-400 ml-1">({trade.offerPriceNote})</span>
                          )}
                        </td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[13px] text-right whitespace-nowrap ${trade.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                          {formatPrice(trade.desiredPrice)}
                          {trade.desiredPriceNote && (
                            <span className="text-[11px] text-gray-400 ml-1">({trade.desiredPriceNote})</span>
                          )}
                        </td>
                        <td className={`hidden md:table-cell px-3 py-2.5 text-[12px] whitespace-nowrap ${trade.isDone ? "text-gray-400" : "text-gray-600"}`}>{trade.registrationDate}</td>
                        <td className="hidden md:table-cell px-3 py-2.5 text-center" data-stop-row-toggle>
                          <div className="flex items-center justify-center gap-1">
                            {(trade.approvalStatus === "IN_CONSULTATION" || trade.approvalStatus === "DRAFT" || trade.approvalStatus === "ON_HOLD") && (
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
                              <span className="text-[11px] text-gray-400" title="관리자에게 다시 열기를 요청해 주세요">
                                관리자 대기
                              </span>
                            )}
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
                      {isExpanded && (
                        <tr className="bg-white border-b border-gray-100">
                          <td colSpan={12} className="px-3 pb-5 pt-1" data-stop-row-toggle>
                            <div className="pl-10">
                              {/* 빠른 메모 추가 입력 */}
                              <div className="flex items-center gap-2 bg-gray-50 rounded-md border border-gray-200 px-3 py-2">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <input
                                  type="text"
                                  value={draft}
                                  onChange={(e) => setMemoDraft((prev) => ({ ...prev, [trade.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                      e.preventDefault();
                                      handleSubmitMemo(trade);
                                    }
                                  }}
                                  placeholder={`${trade.customerName || "고객"} 고객 메모를 빠르게 추가… (Enter)`}
                                  className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:text-gray-400"
                                  disabled={submittingMemo}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSubmitMemo(trade)}
                                  disabled={submittingMemo || draft.trim().length === 0}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium disabled:bg-gray-300 hover:bg-black"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l5 5L20 7" />
                                  </svg>
                                  추가
                                </button>
                              </div>

                              {/* 메모 히스토리 */}
                              <div className="mt-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>메모 히스토리 · {memoEntries.length}건</span>
                                </div>
                                {memoEntries.length === 0 ? (
                                  <p className="text-[12px] text-gray-400 py-1">아직 기록된 메모가 없습니다.</p>
                                ) : (
                                  <ul className="space-y-3">
                                    {[...memoEntries].reverse().map((entry, idx) => (
                                      <li key={entry.id} className="flex gap-2.5">
                                        <span className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${idx === 0 ? "bg-gray-900" : "bg-white border border-gray-300"}`} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                            <span>{formatEntryTimestamp(entry.createdAt)}</span>
                                            {idx === 0 && (
                                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium leading-none">최신</span>
                                            )}
                                          </div>
                                          <p className="text-[13px] text-gray-800 whitespace-pre-wrap break-words mt-0.5">
                                            {entry.content}
                                          </p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {pagination && pagination.total > 0 && (
              <div className="mt-4 flex items-center justify-between text-[12px]">
                <span className="text-gray-500">
                  총 <span className="font-semibold text-gray-700">{pagination.total}</span>건 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} 표시
                </span>
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onChange={(p) => setPage(p)}
                />
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
