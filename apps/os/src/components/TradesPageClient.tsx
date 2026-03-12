"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Header from "@/components/Header";
import { MembershipTrade, MembershipTradeForm, Club } from "@/types";
import { useClubRepository, useConsultationRepository } from "@heritage-dx/api";
import { ClubSearchSelect, Button, Loading } from "@heritage-dx/ui";
import { mapTradMemoDtoToEntity } from "@heritage-dx/store";
import { trackEvent } from "@/lib/gtag";

type TradeFilter = "전체" | "매수" | "매도";

const emptyForm: MembershipTradeForm = {
  clubId: "",
  clubName: "",
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

export default function TradesPageClient() {
  const clubsRepo = useClubRepository();
  const consultationsRepo = useConsultationRepository();
  const [rawTrades, setRawTrades] = useState<MembershipTrade[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubCode, setSelectedClubCode] = useState<string>("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<string>("");
  const [filterDone, setFilterDone] = useState<"전체" | "완료" | "진행중">("진행중");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const clubsRef = useRef<Club[]>([]);
  const [formClubCode, setFormClubCode] = useState<string>("");
  const [formMemberships, setFormMemberships] = useState<string[]>([]);
  const [manualClubInput, setManualClubInput] = useState(false);
  const [manualMembershipInput, setManualMembershipInput] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  // 골프장 목록 fetch (전체 페이지 순회)
  useEffect(() => {
    (async () => {
      try {
        const allClubs: Club[] = [];
        let p = 1;
        while (true) {
          const response = await clubsRepo.getAll({ page: p, limit: 100 });
          if (response.data) {
            allClubs.push(...(response.data.clubs as unknown as Club[]));
            if (!response.data.pagination.hasNext) break;
          } else {
            break;
          }
          p++;
        }
        clubsRef.current = allClubs;
        setClubs(allClubs);
      } catch (err) {
        console.error("골프장 목록 로딩 실패:", err);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터용 회원권 목록 fetch (골프장 필터 선택 시)
  useEffect(() => {
    if (!selectedClubCode) {
      setMemberships([]);
      return;
    }
    clubsRepo.getOne(selectedClubCode)
      .then((response) => {
        if (response.data?.memberships) {
          const names = response.data.memberships.map(
            (m) => m.membershipName || m.membershipType
          );
          setMemberships(names);
        }
      })
      .catch(console.error);
  }, [selectedClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 폼용 회원권 목록 fetch (폼에서 골프장 선택 시)
  useEffect(() => {
    if (!formClubCode || formClubCode === "__manual__") {
      setFormMemberships([]);
      return;
    }
    clubsRepo.getOne(formClubCode)
      .then((response) => {
        if (response.data) {
          setForm((f) => ({ ...f, clubId: response.data!.id || "", clubName: response.data!.name }));
          const names = response.data.memberships?.map(
            (m) => m.membershipName || m.membershipType
          ) || [];
          setFormMemberships(names);
          // 수정 모드에서 기존 회원권이 목록에 없으면 직접입력 모드 유지
          const currentType = formRef.current.membershipType;
          if (currentType && !names.includes(currentType)) {
            setManualMembershipInput(true);
          } else {
            setManualMembershipInput(false);
          }
        }
      })
      .catch(console.error);
  }, [formClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await consultationsRepo.getAll({
        page,
        limit: 20,
        sort: sortField,
        order: sortOrder,
        tradeType: filter !== "전체" ? filter : undefined,
        search: searchQuery.trim() || undefined,
        isDone: filterDone === "완료" ? true : filterDone === "진행중" ? false : undefined,
      });
      if (response.data) {
        setRawTrades((response.data.trades || []).map(mapTradMemoDtoToEntity));
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("메모 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchQuery, sortField, sortOrder, filterDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // 클라이언트 필터링: 골프장/회원권/기간 선택 시 네트워크 요청 없이 즉시 필터
  const trades = useMemo(() => {
    let filtered = rawTrades;
    const selectedClubName = clubsRef.current.find((c) => c.code === selectedClubCode)?.name;
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
  }, [rawTrades, selectedClubCode, selectedMembership, dateFrom, dateTo]);

  // 거래 데이터에 있는 골프장만 필터 드롭다운에 표시
  const availableClubs = useMemo(() => {
    const tradeClubNames = new Set(rawTrades.map((t) => t.clubName).filter(Boolean));
    if (tradeClubNames.size === 0) return clubs;
    return clubs.filter((c) => tradeClubNames.has(c.name));
  }, [rawTrades, clubs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const input = {
        club: form.clubName,
        membership: form.membershipType,
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        offerPrice: form.offerPrice || null,
        offerPriceNote: form.offerPriceNote || null,
        desiredPrice: form.desiredPrice || null,
        desiredPriceNote: form.desiredPriceNote || null,
        notes: form.notes || null,
        registrationDate: form.registrationDate || null,
        tradeDate: form.tradeDate || null,
        remarks: form.remarks || null,
        isDone: form.isDone,
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

      // 신규 등록일 때만 Back Office에 푸시 알림 전송 (fire-and-forget)
      if (!editingTrade && result.data) {
        fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradeId: result.data.id,
            clubName: form.clubName,
            tradeType: form.tradeType,
            customerName: form.customerName,
            membershipType: form.membershipType,
            offerPrice: form.offerPrice || null,
            desiredPrice: form.desiredPrice || null,
          }),
        }).catch(() => {});
      }

      setEditingTrade(null);
      setForm(emptyForm);
      setShowForm(false);
      setFormClubCode("");
      setFormMemberships([]);
      setManualClubInput(false);
      setManualMembershipInput(false);
      await fetchTrades();
      if (!editingTrade) {
        trackEvent("trade_memo_create", { club_name: form.clubName, trade_type: form.tradeType });
      }
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
      membershipType: trade.membershipType || "",
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
      const result = await consultationsRepo.delete(id);
      if (!result.success) {
        setErrorMessage(result.error || "삭제 실패");
        return;
      }
      setDeleteConfirmId(null);
      await fetchTrades();
    } catch (err) {
      console.error("메모 삭제 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
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

                  {/* 골프장명 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">골프장명 <span className="text-red-500">*</span></label>
                    {manualClubInput ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={form.clubName}
                          onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value, clubId: "" }))}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                          placeholder="골프장명 직접 입력"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setManualClubInput(false);
                            setFormClubCode("");
                            setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "" }));
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
                              setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "" }));
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
                            setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "" }));
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
                            setForm((f) => ({ ...f, membershipType: "" }));
                          } else {
                            setForm((f) => ({ ...f, membershipType: e.target.value }));
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
                          onChange={(e) => setForm((f) => ({ ...f, membershipType: e.target.value }))}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                          placeholder="개인정회원"
                          required
                        />
                        {formMemberships.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualMembershipInput(false);
                              setForm((f) => ({ ...f, membershipType: "" }));
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 고객명 */}
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

                  {/* 연락처 */}
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

                {/* 완료 여부 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDone}
                    onChange={(e) => setForm((f) => ({ ...f, isDone: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">거래 완료</span>
                </label>

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
                            {deleteConfirmId === trade.id ? (
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
                            )}
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
    </div>
  );
}
