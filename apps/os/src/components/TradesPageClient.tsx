"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, ChevronRight, Clock, Edit3, History, Plus, Search, X } from "lucide-react";
import { Loading } from "@heritage-dx/ui";
import type { MembershipTrade } from "@/types";
import { useAppStores } from "@/stores";
import {
  useConsultations,
  useFavoriteConsultations,
  useRecentSearches,
  canDeleteConsultation,
  type ConsultationNoteEntry,
  type ApprovalStatus,
  type RecentSearchItem,
} from "@heritage-dx/store";
import ApprovalRequestSheetModal from "@/components/approval/ApprovalRequestSheetModal";
import Pill from "@/components/trades/Pill";
import TypeBadge from "@/components/trades/TypeBadge";
import FavoriteStar from "@/components/trades/FavoriteStar";
import ApprovalPillButton from "@/components/trades/ApprovalPillButton";
import TradesCreatePanel from "@/components/trades/TradesCreatePanel";
import { useAuth } from "@/contexts/AuthContext";

type TradeFilter = "전체" | "매수" | "매도" | "미정";
type ApprovalFilter = "" | ApprovalStatus;

// "미정" = 제시가/희망가/거래일 모두 비어있어 아직 가격 정보가 정해지지 않은 상담
const isUndecided = (t: MembershipTrade) => !t.offerPrice && !t.desiredPrice && !t.tradeDate;

function formatPrice(price: number | string | null) {
  if (price === null) return "—";
  const num = typeof price === "string" ? Number(price) : price;
  if (!num) return "—";
  // 만원 단위로 표시 (시안 기준). num 은 원 단위로 들어옴.
  if (num >= 10000) return `${(num / 10000).toLocaleString()}`;
  return num.toLocaleString();
}

function formatEntryTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

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

export default function TradesPageClient() {
  const { tradeMemo: tradeMemoStore } = useAppStores();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const expandFromUrl = searchParams.get("expand");
  const {
    items: pageTrades,
    pagination,
    fetch: fetchFromStore,
    remove,
    addNote,
    requestApproval,
    isLoading: loading,
  } = useConsultations(tradeMemoStore);
  const { isFavorite, toggleFavorite } = useFavoriteConsultations();
  const { recents, push: pushRecent, remove: removeRecent, clear: clearRecents } =
    useRecentSearches("trades");

  const [rawTrades, setRawTrades] = useState<MembershipTrade[]>([]);
  const [filter, setFilter] = useState<TradeFilter>("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [customerFilter, setCustomerFilter] = useState<{ id: string; label: string } | null>(null);
  const [page, setPage] = useState(1);
  const [editingTrade, setEditingTrade] = useState<MembershipTrade | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"registrationDate" | "tradeDate">("registrationDate");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [filterApproval, setFilterApproval] = useState<ApprovalFilter>("");
  const [approvalPendingId, setApprovalPendingId] = useState<string | null>(null);
  const [approvalSheetTrade, setApprovalSheetTrade] = useState<MembershipTrade | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState<Record<string, string>>({});
  const [memoSubmittingId, setMemoSubmittingId] = useState<string | null>(null);

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
      tradeType: filter === "매수" || filter === "매도" ? filter : undefined,
      search: customerFilter ? undefined : searchQuery.trim() || undefined,
      customerId: customerFilter?.id,
      approvalStatus: filterApproval || undefined,
    });
  }, [page, filter, searchQuery, sortField, sortOrder, filterApproval, customerFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setRawTrades(pageTrades as MembershipTrade[]);
  }, [pageTrades]);

  // 사이드바 즐겨찾기에서 ?expand=<id> 진입 시 해당 행을 자동 펼친다.
  useEffect(() => {
    if (expandFromUrl) setExpandedId(expandFromUrl);
  }, [expandFromUrl]);

  // 키보드 단축키: n (새 상담일지) / / (검색 포커스)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        setEditingTrade(null);
        setCreateOpen(true);
      }
      if (e.key === "/") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[data-trades-search]');
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const trades = useMemo(() => {
    let filtered = rawTrades as MembershipTrade[];
    if (filter === "미정") filtered = filtered.filter(isUndecided);
    if (dateFrom) filtered = filtered.filter((t) => (t.registrationDate || "") >= dateFrom);
    if (dateTo) filtered = filtered.filter((t) => (t.registrationDate || "") <= dateTo);
    return filtered;
  }, [rawTrades, dateFrom, dateTo, filter]);

  // 새 notes JSONB 응답은 mapper 단계에서 entries 배열로 평탄화되므로, 뷰는 trade.notes 를
  // 그대로 사용한다. legacy `__MEMO_V1__` 인코딩/디코딩 경로는 더 이상 필요하지 않다.
  const buildMemoEntries = useCallback((trade: MembershipTrade): ConsultationNoteEntry[] => {
    return Array.isArray(trade.notes) ? trade.notes : [];
  }, []);

  const handleSubmitMemo = useCallback(
    async (trade: MembershipTrade) => {
      const draft = (memoDraft[trade.id] ?? "").trim();
      if (!draft) return;
      setMemoSubmittingId(trade.id);
      try {
        const entity = await addNote(trade.id, draft);
        if (!entity) {
          setErrorMessage("메모 저장에 실패했습니다.");
          return;
        }
        setRawTrades((prev) =>
          prev.map((t) =>
            t.id === trade.id
              ? ({ ...t, notes: entity.notes, remarks: entity.remarks, updatedAt: entity.updatedAt } as MembershipTrade)
              : t,
          ),
        );
        setMemoDraft((prev) => ({ ...prev, [trade.id]: "" }));
      } catch (err) {
        console.error("메모 추가 실패:", err);
        setErrorMessage("네트워크 오류가 발생했습니다.");
      } finally {
        setMemoSubmittingId(null);
      }
    },
    [addNote, memoDraft],
  );

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

  // 승인 요청 pill 클릭 → 승인요청서 양식 모달 진입. 실제 API 호출은 모달 안에서 처리.
  const handleOpenApprovalSheet = (trade: MembershipTrade) => {
    setApprovalSheetTrade(trade);
  };

  const filters: TradeFilter[] = ["전체", "매수", "매도", "미정"];

  const handleSearchSubmit = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setCustomerFilter(null);
    pushRecent({ label: trimmed, value: trimmed, kind: "text" });
    setPage(1);
  };

  const handleCustomerClick = (trade: MembershipTrade) => {
    if (!trade.customerId) return;
    const id = String(trade.customerId);
    const label = trade.customerName?.trim() || trade.contact?.trim() || id;
    setCustomerFilter({ id, label });
    setSearchInput("");
    setSearchQuery("");
    pushRecent({ label, value: id, kind: "customer" });
    setPage(1);
  };

  const handleChipClick = (item: RecentSearchItem) => {
    if (item.kind === "customer") {
      setCustomerFilter({ id: item.value, label: item.label });
      setSearchInput("");
      setSearchQuery("");
    } else {
      setCustomerFilter(null);
      setSearchInput(item.value);
    }
    setPage(1);
  };

  const handleChipRemove = (item: RecentSearchItem) => {
    removeRecent(item.value);
    if (item.kind === "customer" && customerFilter?.id === item.value) {
      setCustomerFilter(null);
      setPage(1);
    }
  };

  const isChipActive = (item: RecentSearchItem) => {
    if (item.kind === "customer") return customerFilter?.id === item.value;
    return !customerFilter && searchQuery.trim() === item.value;
  };

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-gray-100">
      {/* Main scrollable area */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 py-5">
            {errorMessage && (
              <div className="mb-3 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
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

            {/* Filter card */}
            <div className="mb-4 overflow-hidden rounded-[10px] border border-gray-200 bg-white">
              <div className="flex flex-col gap-2.5 border-b border-gray-100 px-4 py-3.5">
                {/* Search bar — full width */}
                <div
                  className={`flex h-11 items-center gap-2.5 rounded-[10px] px-3.5 transition-all ${
                    searchFocused
                      ? "border-[1.5px] border-gray-900 bg-white shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
                      : "border-[1.5px] border-gray-200 bg-gray-50"
                  }`}
                >
                  <Search className={`h-4 w-4 ${searchFocused ? "text-gray-900" : "text-gray-500"}`} />
                  <input
                    data-trades-search
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSearchInput(next);
                      if (customerFilter && next.trim()) setCustomerFilter(null);
                    }}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchSubmit();
                    }}
                    placeholder="이 페이지에서 검색 — 고객명, 연락처, 골프장, 회원권, 메모 내용..."
                    className="flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      title="지우기"
                      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                    >
                      <X className="h-3 w-3" strokeWidth={2.4} />
                    </button>
                  )}
                  {!searchInput && !searchFocused && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-medium leading-none text-gray-500">
                      /
                    </span>
                  )}
                </div>

                {/* Recent searches */}
                {recents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                      <Clock className="h-3 w-3" />
                      최근 검색어
                    </span>
                    {recents.map((item) => {
                      const active = isChipActive(item);
                      return (
                        <span
                          key={item.value}
                          className={`inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1 text-[12px] transition-colors ${
                            active
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {item.kind === "customer" && (
                            <span
                              className={`text-[10px] font-bold uppercase ${
                                active ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              고객
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleChipClick(item)}
                            className={`font-medium ${active ? "" : "hover:text-blue-600"}`}
                          >
                            {item.label}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChipRemove(item)}
                            title={`'${item.label}' 삭제`}
                            className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                              active ? "text-white/80 hover:bg-white/15" : "text-gray-500 hover:text-red-600"
                            }`}
                          >
                            <X className="h-3 w-3" strokeWidth={2.6} />
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        clearRecents();
                        setCustomerFilter(null);
                      }}
                      className="ml-1 px-1 text-[11px] text-gray-400 hover:text-gray-600"
                    >
                      전체 삭제
                    </button>
                  </div>
                )}

                {/* Type pills + selects */}
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  {filters.map((f) => {
                    const count =
                      f === "전체"
                        ? rawTrades.length
                        : f === "미정"
                        ? rawTrades.filter(isUndecided).length
                        : rawTrades.filter((t) => t.tradeType === f).length;
                    return (
                      <Pill
                        key={f}
                        active={filter === f}
                        count={count}
                        onClick={() => {
                          setFilter(f);
                          setPage(1);
                        }}
                      >
                        {f}
                      </Pill>
                    );
                  })}

                  <div className="mx-1 h-5 w-px bg-gray-200" />

                  <select
                    value={filterApproval}
                    onChange={(e) => {
                      setFilterApproval(e.target.value as ApprovalFilter);
                      setPage(1);
                    }}
                    className="h-8 rounded-md border border-gray-200 bg-white px-2.5 text-[13px] text-gray-700 outline-none focus:border-gray-400"
                  >
                    <option value="">승인 상태 전체</option>
                    <option value="IN_CONSULTATION">상담중</option>
                    <option value="PENDING_DEPOSIT">계약금 대기</option>
                    <option value="DEPOSIT_APPROVED">계약금 승인</option>
                  </select>

                  <div className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[12.5px] text-gray-700">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-[110px] bg-transparent outline-none"
                    />
                    <span className="text-gray-300">→</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-[110px] bg-transparent outline-none"
                    />
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[12px] text-gray-500">
                      총 <b className="text-gray-900">{rawTrades.length}</b>건
                    </span>
                    <span className="h-4 w-px bg-gray-200" />
                    <select
                      value={`${sortField}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-") as [
                          typeof sortField,
                          typeof sortOrder,
                        ];
                        setSortField(field);
                        setSortOrder(order);
                      }}
                      className="h-8 rounded-md border border-gray-200 bg-white px-2.5 text-[13px] text-gray-700 outline-none focus:border-gray-400"
                    >
                      <option value="registrationDate-DESC">최신순</option>
                      <option value="registrationDate-ASC">오래된순</option>
                      <option value="tradeDate-DESC">거래일 최신순</option>
                      <option value="tradeDate-ASC">거래일 오래된순</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Table card */}
            <div className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">상담 목록</span>
                  <span className="text-[12px] text-gray-500">
                    총 <strong className="font-bold text-gray-900">{trades.length.toLocaleString("ko-KR")}</strong>건
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTrade(null);
                    setCreateOpen(true);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1F1F23] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(10,10,10,0.10)] transition-all hover:bg-black hover:shadow-[0_4px_10px_rgba(10,10,10,0.18)]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/[0.14]">
                    <Plus className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  새 상담일지 작성
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loading text="로딩 중..." />
                </div>
              ) : trades.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="mb-3 text-gray-400">등록된 상담일지가 없습니다</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrade(null);
                      setCreateOpen(true);
                    }}
                    className="text-sm text-gray-600 underline hover:text-gray-900"
                  >
                    새 상담일지 작성하기
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="w-11 px-2 py-2.5 text-center text-[11.5px] font-semibold text-gray-500">즐겨찾기</th>
                        <th className="w-[70px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">유형</th>
                        <th className="w-[90px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">상태</th>
                        <th className="w-[170px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">골프장</th>
                        <th className="w-[130px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">회원권</th>
                        <th className="w-[90px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">고객명</th>
                        <th className="w-[130px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">연락처</th>
                        <th className="px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">메모</th>
                        <th className="w-[110px] px-2.5 py-2.5 text-right text-[11.5px] font-semibold text-gray-500">제시가</th>
                        <th className="w-[110px] px-2.5 py-2.5 text-right text-[11.5px] font-semibold text-gray-500">희망가</th>
                        <th className="w-[110px] px-2.5 py-2.5 text-left text-[11.5px] font-semibold text-gray-500">등록일</th>
                        <th className="w-[110px] px-2.5 py-2.5 text-center text-[11.5px] font-semibold text-gray-500">승인 요청</th>
                        <th className="w-[110px] px-2.5 py-2.5 text-center text-[11.5px] font-semibold text-gray-500">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trades.map((trade) => {
                        const memoEntries = buildMemoEntries(trade);
                        const latestEntry = memoEntries.length > 0 ? memoEntries[memoEntries.length - 1] : null;
                        const isExpanded = expandedId === trade.id;
                        const draft = memoDraft[trade.id] ?? "";
                        const submittingMemo = memoSubmittingId === trade.id;
                        const undecided = isUndecided(trade);
                        return (
                          <Fragment key={trade.id}>
                            <tr
                              className={`transition-colors ${
                                trade.isDone
                                  ? "bg-green-50/40 opacity-70"
                                  : isExpanded
                                  ? "bg-gray-50"
                                  : "hover:bg-gray-50/60"
                              }`}
                            >
                              <td className="w-11 px-2 py-2 text-center align-middle">
                                <FavoriteStar
                                  active={isFavorite(trade.id)}
                                  onToggle={() =>
                                    toggleFavorite(trade.id, {
                                      label: `${trade.customerName?.trim() || "이름 미상"} 고객님 상담`,
                                      subLabel: [trade.clubName?.trim(), trade.tradeType, trade.tradeDate || trade.registrationDate]
                                        .filter(Boolean)
                                        .join(" · ") || undefined,
                                      href: `/trades?expand=${encodeURIComponent(trade.id)}`,
                                    })
                                  }
                                />
                              </td>
                              <td className="px-2.5 py-2 align-middle whitespace-nowrap">
                                <TypeBadge tradeType={trade.tradeType} isUndecided={undecided} isDone={trade.isDone} />
                              </td>
                              <td className="px-2.5 py-2 align-middle whitespace-nowrap">
                                <StatusBadge status={trade.approvalStatus} isDone={trade.isDone} />
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle text-[13px] font-semibold whitespace-nowrap ${
                                  trade.isDone ? "text-gray-400 line-through" : "text-gray-900"
                                }`}
                              >
                                {trade.clubName}
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle text-[12.5px] whitespace-nowrap ${
                                  trade.isDone ? "text-gray-400" : "text-gray-700"
                                }`}
                              >
                                {trade.membershipType}
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle text-[13px] font-semibold whitespace-nowrap ${
                                  trade.isDone ? "text-gray-400 line-through" : "text-gray-900"
                                }`}
                              >
                                {trade.customerId ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCustomerClick(trade)}
                                    title="이 고객으로 검색"
                                    className="rounded px-1 -mx-1 py-0.5 hover:bg-gray-100 hover:text-blue-700"
                                  >
                                    {trade.customerName || "—"}
                                  </button>
                                ) : (
                                  trade.customerName
                                )}
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle font-mono text-[12.5px] whitespace-nowrap ${
                                  trade.isDone ? "text-gray-400" : "text-gray-700"
                                }`}
                              >
                                {trade.customerId ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCustomerClick(trade)}
                                    title="이 고객으로 검색"
                                    className="rounded px-1 -mx-1 py-0.5 font-mono hover:bg-gray-100 hover:text-blue-700"
                                  >
                                    {trade.contact || "—"}
                                  </button>
                                ) : (
                                  trade.contact
                                )}
                              </td>
                              <td className="px-3 py-2 align-middle">
                                <MemoCell
                                  latestEntry={latestEntry}
                                  totalCount={memoEntries.length}
                                  expanded={isExpanded}
                                  onToggle={() => setExpandedId(isExpanded ? null : trade.id)}
                                />
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle text-right tabular-nums whitespace-nowrap text-[13px] font-semibold ${
                                  trade.isDone ? "text-gray-400 line-through" : "text-gray-900"
                                }`}
                              >
                                {formatPrice(trade.offerPrice)}
                                <span className="ml-0.5 text-[11px] font-normal text-gray-400">만</span>
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle text-right tabular-nums whitespace-nowrap text-[13px] font-semibold ${
                                  trade.isDone ? "text-gray-400 line-through" : "text-gray-900"
                                }`}
                              >
                                {formatPrice(trade.desiredPrice)}
                                <span className="ml-0.5 text-[11px] font-normal text-gray-400">만</span>
                              </td>
                              <td
                                className={`px-2.5 py-2 align-middle font-mono text-[12px] whitespace-nowrap ${
                                  trade.isDone ? "text-gray-400" : "text-gray-700"
                                }`}
                              >
                                {trade.registrationDate}
                              </td>
                              <td className="px-2.5 py-2 align-middle text-center">
                                <ApprovalPillButton
                                  status={trade.approvalStatus}
                                  pending={approvalPendingId === trade.id}
                                  onRequest={() => handleOpenApprovalSheet(trade)}
                                />
                              </td>
                              <td className="px-2 py-2 align-middle">
                                <div className="flex items-center justify-center gap-3.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTrade(trade);
                                      setCreateOpen(true);
                                    }}
                                    className="bg-transparent text-[12.5px] font-medium text-gray-700 hover:text-gray-900"
                                  >
                                    수정
                                  </button>
                                  {canDeleteConsultation(user, trade) && (
                                    <>
                                      <span className="h-3 w-px bg-gray-200" aria-hidden />
                                      {deleteConfirmId === trade.id ? (
                                        <span className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleDelete(trade.id)}
                                            className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-red-700"
                                          >
                                            삭제
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="rounded border border-gray-300 px-2 py-0.5 text-[11px] hover:bg-gray-50"
                                          >
                                            취소
                                          </button>
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmId(trade.id)}
                                          className="bg-transparent text-[12.5px] font-medium text-red-700 hover:text-red-900"
                                        >
                                          삭제
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-[#FAFAFA]">
                                <td colSpan={13} className="border-t border-dashed border-gray-200 px-5 py-4 pl-14">
                                  <MemoHistoryRow
                                    trade={trade}
                                    entries={memoEntries}
                                    draft={draft}
                                    onDraftChange={(v) =>
                                      setMemoDraft((prev) => ({ ...prev, [trade.id]: v }))
                                    }
                                    onSubmit={() => handleSubmitMemo(trade)}
                                    submitting={submittingMemo}
                                  />
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

              {/* Footer / pagination */}
              {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-[#FDFDFD] px-4 py-2.5 text-[12px] text-gray-500">
                  <span>
                    총 <b className="text-gray-900">{pagination.total}</b>건 중{" "}
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} 표시
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
      </div>

      {/* Push panel */}
      <TradesCreatePanel
        open={createOpen}
        editingTrade={editingTrade}
        onClose={() => {
          setCreateOpen(false);
          setEditingTrade(null);
        }}
        onSaved={() => {
          fetchFromStore({
            page,
            limit: 20,
            sort: sortField,
            order: sortOrder,
            tradeType: filter === "매수" || filter === "매도" ? filter : undefined,
            search: searchQuery.trim() || undefined,
            approvalStatus: filterApproval || undefined,
          });
        }}
      />

      <ApprovalRequestSheetModal
        trade={approvalSheetTrade}
        isOpen={!!approvalSheetTrade}
        onClose={() => setApprovalSheetTrade(null)}
        onSubmit={async (trade, patch) => {
          setApprovalPendingId(trade.id);
          try {
            const result = await requestApproval(trade.id, patch);
            if (result.entity) {
              setApprovalSheetTrade(null);
              return { success: true };
            }
            if (result.missingFillable && result.missingFillable.length > 0) {
              return {
                success: false,
                errorMessage: `다음 필드를 양식에 채워주세요: ${result.missingFillable.join(", ")}`,
              };
            }
            return { success: false, errorMessage: result.errorMessage || "승인 요청 실패" };
          } finally {
            setApprovalPendingId(null);
          }
        }}
      />
    </div>
  );
}

// ─── Memo cell (collapsed) ─────────────────────────────────────────

interface MemoCellProps {
  latestEntry: ConsultationNoteEntry | null;
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
}

function MemoCell({ latestEntry, totalCount, expanded, onToggle }: MemoCellProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex w-full min-w-0 items-center gap-2 text-left"
    >
      <ChevronRight
        className={`h-3 w-3 shrink-0 transition-transform ${
          latestEntry ? "text-gray-500" : "text-gray-300"
        }`}
        style={{ transform: expanded ? "rotate(90deg)" : "none" }}
        strokeWidth={2}
      />
      {latestEntry ? (
        <>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-800">
            {latestEntry.content}
          </span>
          {totalCount > 1 && (
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
              +{totalCount - 1}
            </span>
          )}
          <span className="shrink-0 text-[11px] text-gray-400">
            {latestEntry.createdAt.slice(5, 16).replace("T", " · ")}
          </span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-gray-400">
          메모가 없습니다 — 클릭해서 추가
        </span>
      )}
    </button>
  );
}

// ─── Memo history (expanded row) ────────────────────────────────────

interface MemoHistoryRowProps {
  trade: MembershipTrade;
  entries: ConsultationNoteEntry[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

function MemoHistoryRow({ trade, entries, draft, onDraftChange, onSubmit, submitting }: MemoHistoryRowProps) {
  const ordered = [...entries].reverse(); // latest first
  return (
    <div className="flex flex-col gap-3">
      {/* Quick add */}
      <div className="flex items-stretch gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Edit3 className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={`${trade.customerName || "고객"} 고객 메모를 빠르게 추가… (Enter)`}
          className="flex-1 bg-transparent py-1 text-[13px] text-gray-800 outline-none placeholder:text-gray-400"
          disabled={submitting}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || draft.trim().length === 0}
          className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-md bg-emerald-500 px-3.5 text-[12px] font-semibold text-white hover:bg-emerald-600 disabled:bg-gray-300"
        >
          추가
        </button>
      </div>

      {/* Timeline */}
      {ordered.length > 0 ? (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <History className="h-3 w-3" />
            메모 히스토리 · {ordered.length}건
          </div>
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-3.5 bottom-3.5 w-px bg-gray-200" />
            {ordered.map((entry, idx) => (
              <div
                key={entry.id}
                className="relative py-2"
                style={{ borderBottom: idx < ordered.length - 1 ? "1px dashed #EDEDED" : "none" }}
              >
                <span
                  className="absolute -left-[14.5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-[1.5px] border-gray-900 box-border"
                  style={{ background: idx === 0 ? "#0A0A0A" : "#fff" }}
                />
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[11px] text-gray-400">{formatEntryTimestamp(entry.createdAt)}</span>
                  {idx === 0 && (
                    <span className="rounded bg-gray-900 px-1.5 py-px text-[10px] font-bold text-white">최신</span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-800">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-1 text-[12px] text-gray-400">
          <History className="h-3 w-3" />
          아직 작성된 메모가 없어요. 위에서 첫 메모를 남겨보세요.
        </div>
      )}
    </div>
  );
}

// ─── Status badge (legacy color-dot) ───────────────────────────────

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

function StatusBadge({ status, isDone }: { status: string; isDone: boolean }) {
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1.5 rounded px-2 text-[11.5px] font-semibold ${
        isDone ? "text-gray-400" : "text-gray-700"
      } bg-gray-50 border border-gray-100`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${APPROVAL_DOT[status] ?? "bg-gray-300"}`} />
      {APPROVAL_LABEL[status] ?? status}
    </span>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────

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
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
        aria-label="이전 페이지"
      >
        ←
      </button>
      {items.map((it, idx) =>
        it === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-gray-400">
            ⋯
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-[12px] ${
              it === page
                ? "border border-gray-900 bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
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
        className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
        aria-label="다음 페이지"
      >
        →
      </button>
    </div>
  );
}
