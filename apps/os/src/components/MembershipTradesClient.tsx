"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Header from "@/components/Header";
import {
  MembershipTradeRecord,
  MembershipTradeRecordForm,
  Club,
} from "@/types";
import { useClubRepository, useMembershipTradeRepository } from "@heritage-dx/api";
import { mapTradeRecordDtoToEntity } from "@heritage-dx/store";
import { trackEvent } from "@/lib/gtag";
import { ClubSearchSelect, Button, Loading } from "@heritage-dx/ui";

type FormMembershipOption = { id: string; name: string };
type TradeFilter = "전체" | "매수" | "매도";
type SortField = "contractDate" | "createdAt" | "membershipName" | "amount" | "tradeAmount";

const emptyForm: MembershipTradeRecordForm = {
  clubName: "",
  customerName: "",
  contact: "",
  tradeType: "매수",
  membershipName: "",
  contractDate: new Date().toISOString().split("T")[0],
  amount: 0,
  tradingPartner: "",
  tradeAmount: 0,
  commission: 0,
  marketProfit: 0,
  expense: 0,
  description: "",
  contractFee: 0,
  balanceDate: "",
  balanceCompleted: false,
  manager: "",
  taxTransfer: false,
  taxAcquisition: false,
  invoiceSales: 0,
  invoicePurchase: 0,
  remarks: "",
  actualTransactionDate: "",
};

const formatNumberWithComma = (value: number | undefined): string => {
  if (!value) return "";
  return value.toLocaleString();
};

const parseNumberInput = (value: string): number => {
  const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
  return isNaN(num) ? 0 : num;
};

export default function MembershipTradesClient() {
  const clubsRepo = useClubRepository();
  const membershipTradesRepo = useMembershipTradeRepository();
  const [rawTrades, setRawTrades] = useState<MembershipTradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TradeFilter>("전체");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MembershipTradeRecordForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingTrade, setEditingTrade] = useState<MembershipTradeRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubCode, setSelectedClubCode] = useState<string>("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const clubsRef = useRef<Club[]>([]);

  // 폼 전용 state (필터와 분리)
  const [formClubCode, setFormClubCode] = useState<string>("");
  const [formClubId, setFormClubId] = useState<string>("");
  const [formMemberships, setFormMemberships] = useState<FormMembershipOption[]>([]);
  const [formManualMembership, setFormManualMembership] = useState(false);

  // 골프장 목록 fetch
  useEffect(() => {
    clubsRepo.getAll({ limit: 100 })
      .then((response) => {
        if (response.data) {
          const filtered = response.data.clubs.filter((c) => c.name?.trim()) as unknown as Club[];
          clubsRef.current = filtered;
          setClubs(filtered);
        }
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 회원권 목록 fetch (골프장 선택 시)
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
    if (!formClubCode) {
      setFormMemberships([]);
      setFormClubId("");
      return;
    }
    clubsRepo.getOne(formClubCode)
      .then((response) => {
        if (response.data) {
          setFormClubId(response.data.id);
          setFormMemberships(
            (response.data.memberships ?? []).map((m) => ({
              id: m.id,
              name: m.membershipName || m.membershipType,
            }))
          );
        } else {
          setFormClubId("");
          setFormMemberships([]);
        }
      })
      .catch(() => { setFormClubId(""); setFormMemberships([]); });
  }, [formClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 수정 모드에서 직접 입력 판단
  useEffect(() => {
    if (!editingTrade || formMemberships.length === 0) return;
    const currentName = form.membershipName;
    setFormManualMembership(currentName !== "" && !formMemberships.some((m) => m.name === currentName));
  }, [formMemberships, editingTrade]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const response = await membershipTradesRepo.getAll({
        page,
        limit: 20,
        sort: sortField,
        order: sortOrder,
        tradeType: filter !== "전체" ? filter : undefined,
        search: searchQuery.trim() || undefined,
      });
      if (response.data) {
        setRawTrades((response.data.trades || []).map(mapTradeRecordDtoToEntity));
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("거래 내역 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchQuery, sortField, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

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
      filtered = filtered.filter((t) => t.trade.membershipName === selectedMembership);
    }
    if (dateFrom) {
      filtered = filtered.filter((t) => (t.trade.contractDate || "") >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => (t.trade.contractDate || "") <= dateTo);
    }
    return filtered;
  }, [rawTrades, selectedClubCode, selectedMembership, dateFrom, dateTo]);

  // 거래 데이터에 있는 골프장만 필터 드롭다운에 표시
  const availableClubs = useMemo(() => {
    const tradeClubNames = new Set(rawTrades.map((t) => t.clubName).filter(Boolean));
    if (tradeClubNames.size === 0) return clubs;
    return clubs.filter((c) => tradeClubNames.has(c.name));
  }, [rawTrades, clubs]);

  const handleFormClubChange = (code: string) => {
    setFormClubCode(code);
    setFormClubId("");
    const club = clubsRef.current.find((c) => c.code === code);
    setForm((f) => ({ ...f, clubName: club?.name || "", membershipName: "" }));
    setFormManualMembership(false);
    setFormMemberships([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    if (!form.clubName.trim() || !formClubId) {
      setErrorMessage("골프장을 선택해주세요.");
      setSubmitting(false);
      return;
    }
    // 선택된 회원권의 ID 찾기
    const selectedMembershipObj = formMemberships.find(
      (m) => m.name === form.membershipName
    );
    if (!selectedMembershipObj) {
      setErrorMessage("회원권을 선택해주세요.");
      setSubmitting(false);
      return;
    }
    try {
      const cleaned = {
        clubId: formClubId,
        membershipId: selectedMembershipObj.id,
        customerName: form.customerName,
        contact: form.contact,
        tradeType: form.tradeType,
        contractDate: form.contractDate || null,
        amount: form.amount || null,
        tradingPartner: form.tradingPartner || null,
        tradeAmount: form.tradeAmount || null,
        commission: form.commission || null,
        marketProfit: form.marketProfit || null,
        expense: form.expense || null,
        description: form.description || null,
        contractFee: form.contractFee || null,
        balanceDate: form.balanceDate || null,
        balanceCompleted: form.balanceCompleted,
        manager: form.manager || null,
        taxTransfer: form.taxTransfer,
        taxAcquisition: form.taxAcquisition,
        invoiceSales: form.invoiceSales || null,
        invoicePurchase: form.invoicePurchase || null,
        remarks: form.remarks || null,
        actualTransactionDate: form.actualTransactionDate || null,
      };

      let result;
      if (editingTrade) {
        result = await membershipTradesRepo.update(editingTrade.id, cleaned);
      } else {
        result = await membershipTradesRepo.create(cleaned);
      }

      if (!result.success) {
        setErrorMessage(result.error || "오류가 발생했습니다.");
        return;
      }

      setEditingTrade(null);
      setForm(emptyForm);
      setShowForm(false);
      await fetchTrades();
      if (!editingTrade) {
        trackEvent("membership_trade_create", { club_name: form.clubName, trade_type: form.tradeType });
      }
    } catch (err) {
      console.error("거래 저장 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (trade: MembershipTradeRecord) => {
    setEditingTrade(trade);
    setErrorMessage(null);
    const matchedClub = clubsRef.current.find((c) => c.name === trade.clubName);
    setFormClubCode(matchedClub?.code || "");
    setFormManualMembership(false);
    setForm({
      clubName: trade.clubName || "",
      customerName: trade.customer.name || "",
      contact: trade.customer.contact || "",
      tradeType: trade.tradeType || "매수",
      membershipName: trade.trade.membershipName || "",
      contractDate: trade.trade.contractDate || "",
      amount: trade.trade.amount ?? 0,
      tradingPartner: trade.trade.tradingPartner || "",
      tradeAmount: trade.trade.tradeAmount ?? 0,
      commission: trade.trade.commission ?? 0,
      marketProfit: trade.financials.marketProfit ?? 0,
      expense: trade.financials.expense ?? 0,
      description: trade.description || "",
      contractFee: trade.trade.contractFee ?? 0,
      balanceDate: trade.balance.balanceDate || "",
      balanceCompleted: trade.balance.balanceCompleted ?? false,
      manager: trade.manager || "",
      taxTransfer: trade.tax.taxTransfer ?? false,
      taxAcquisition: trade.tax.taxAcquisition ?? false,
      invoiceSales: trade.tax.invoiceSales ?? 0,
      invoicePurchase: trade.tax.invoicePurchase ?? 0,
      remarks: trade.remarks || "",
      actualTransactionDate: trade.trade.actualTransactionDate || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    setErrorMessage(null);
    try {
      const result = await membershipTradesRepo.delete(id);
      if (!result.success) {
        setErrorMessage(result.error || "삭제 실패");
        return;
      }
      setDeleteConfirmId(null);
      await fetchTrades();
    } catch (err) {
      console.error("거래 삭제 실패:", err);
      setErrorMessage("네트워크 오류가 발생했습니다.");
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTrade(null);
    setForm(emptyForm);
    setErrorMessage(null);
    setFormClubCode("");
    setFormClubId("");
    setFormMemberships([]);
    setFormManualMembership(false);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return "-";
    const abs = Math.abs(price);
    const sign = price < 0 ? "-" : "";
    if (abs >= 100000000) {
      const eok = Math.floor(abs / 100000000);
      const man = Math.floor((abs % 100000000) / 10000);
      return man > 0 ? `${sign}${eok}억 ${man.toLocaleString()}만원` : `${sign}${eok}억원`;
    }
    if (abs >= 10000) {
      return `${sign}${(abs / 10000).toLocaleString()}만원`;
    }
    return `${sign}${abs.toLocaleString()}원`;
  };

  const filters: TradeFilter[] = ["전체", "매수", "매도"];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header clubName={null} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-6">
          {/* 페이지 헤더 */}
          <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-gray-400 p-5 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900">거래 내역</h2>
                  <p className="text-sm text-gray-500 mt-0.5">회원권 거래 내역을 관리합니다</p>
                </div>
              </div>
              <Button
                className="flex-shrink-0"
                onClick={() => { setShowForm(true); setEditingTrade(null); setForm(emptyForm); setErrorMessage(null); setFormClubCode(""); setFormClubId(""); setFormMemberships([]); setFormManualMembership(false); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 거래
              </Button>
            </div>
          </div>

          {/* 필터 바 */}
          <div className="bg-white rounded-lg border border-gray-200 border-t-2 border-t-gray-300 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
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

              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="회원권명, 고객명, 거래처 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
                />
                <svg className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as [SortField, "DESC" | "ASC"];
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="createdAt-DESC">등록일 최신순</option>
                <option value="createdAt-ASC">등록일 오래된순</option>
                <option value="contractDate-DESC">계약일 최신순</option>
                <option value="contractDate-ASC">계약일 오래된순</option>
                <option value="membershipName-ASC">회원권명 가나다순</option>
                <option value="amount-DESC">매매대금 높은순</option>
                <option value="amount-ASC">매매대금 낮은순</option>
              </select>
            </div>
          </div>

          {/* 에러 메시지 (폼 밖) */}
          {errorMessage && !showForm && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
              <span className="text-red-700 flex-1">{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 거래 등록/수정 폼 */}
          {showForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  {editingTrade ? "거래 수정" : "새 거래 등록"}
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

                {/* A. 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">골프장명 <span className="text-red-500">*</span></label>
                    <ClubSearchSelect
                      clubs={clubs}
                      selectedClubCode={formClubCode}
                      onChange={handleFormClubChange}
                      placeholder="골프장 선택"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">회원권명 <span className="text-red-500">*</span></label>
                    {formMemberships.length > 0 && !formManualMembership ? (
                      <select
                        value={form.membershipName}
                        onChange={(e) => {
                          if (e.target.value === "__manual__") {
                            setFormManualMembership(true);
                            setForm((f) => ({ ...f, membershipName: "" }));
                          } else {
                            setForm((f) => ({ ...f, membershipName: e.target.value }));
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      >
                        <option value="">회원권 선택</option>
                        {formMemberships.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                        <option value="__manual__">직접 입력</option>
                      </select>
                    ) : (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={form.membershipName}
                          onChange={(e) => setForm((f) => ({ ...f, membershipName: e.target.value }))}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                          placeholder="회원권명 입력"
                        />
                        {formMemberships.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { setFormManualMembership(false); setForm((f) => ({ ...f, membershipName: "" })); }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                          >
                            목록선택
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                </div>

                {/* B. 연락처/거래처 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">거래처</label>
                    <input
                      type="text"
                      value={form.tradingPartner}
                      onChange={(e) => setForm((f) => ({ ...f, tradingPartner: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="거래처명"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">담당자</label>
                    <input
                      type="text"
                      value={form.manager}
                      onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="담당자명"
                    />
                  </div>
                </div>

                {/* C. 금액 정보 */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">금액 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">매매대금 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.amount)}
                        onChange={(e) => setForm((f) => ({ ...f, amount: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="150,000,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">거래금액 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.tradeAmount)}
                        onChange={(e) => setForm((f) => ({ ...f, tradeAmount: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="160,000,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">수수료 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.commission)}
                        onChange={(e) => setForm((f) => ({ ...f, commission: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="2,000,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">시세차익 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.marketProfit)}
                        onChange={(e) => setForm((f) => ({ ...f, marketProfit: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="5,000,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">경비 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.expense)}
                        onChange={(e) => setForm((f) => ({ ...f, expense: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="1,000,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">계약금 (원)</label>
                      <input
                        type="text"
                        value={formatNumberWithComma(form.contractFee)}
                        onChange={(e) => setForm((f) => ({ ...f, contractFee: parseNumberInput(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                        placeholder="300,000"
                      />
                    </div>
                  </div>
                </div>

                {/* D. 일정 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">계약일</label>
                    <input
                      type="date"
                      value={form.contractDate}
                      onChange={(e) => setForm((f) => ({ ...f, contractDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">잔금일</label>
                    <input
                      type="date"
                      value={form.balanceDate}
                      onChange={(e) => setForm((f) => ({ ...f, balanceDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">실거래일</label>
                    <input
                      type="text"
                      value={form.actualTransactionDate}
                      onChange={(e) => setForm((f) => ({ ...f, actualTransactionDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="12월 11일"
                    />
                  </div>
                </div>

                {/* E. 상태/세금 */}
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.balanceCompleted}
                      onChange={(e) => setForm((f) => ({ ...f, balanceCompleted: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    잔금완료
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.taxTransfer}
                      onChange={(e) => setForm((f) => ({ ...f, taxTransfer: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    양도세
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.taxAcquisition}
                      onChange={(e) => setForm((f) => ({ ...f, taxAcquisition: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    취득세
                  </label>
                </div>

                {/* F. 세금계산서 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">매출세금계산서 (원)</label>
                    <input
                      type="text"
                      value={formatNumberWithComma(form.invoiceSales)}
                      onChange={(e) => setForm((f) => ({ ...f, invoiceSales: parseNumberInput(e.target.value) }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="1,000,000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">매입세금계산서 (원)</label>
                    <input
                      type="text"
                      value={formatNumberWithComma(form.invoicePurchase)}
                      onChange={(e) => setForm((f) => ({ ...f, invoicePurchase: parseNumberInput(e.target.value) }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="500,000"
                    />
                  </div>
                </div>

                {/* G. 메모 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="계약 진행 중"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">비고</label>
                    <input
                      type="text"
                      value={form.remarks}
                      onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                      placeholder="특이사항 없음"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleCancelForm}>
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting} isLoading={submitting}>
                    {editingTrade ? "수정" : "저장"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* 거래 내역 테이블 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="py-20 flex justify-center"><Loading text="로딩 중..." /></div>
            ) : trades.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 mb-3">등록된 거래 내역이 없습니다</p>
                <button
                  onClick={() => { setShowForm(true); setEditingTrade(null); setForm(emptyForm); setFormClubCode(""); setFormClubId(""); setFormMemberships([]); setFormManualMembership(false); }}
                  className="text-sm text-gray-600 underline hover:text-gray-900"
                >
                  새 거래 등록하기
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[320px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">유형</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">골프장</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">회원권</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">고객명</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">연락처</th>
                      <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">매매대금</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">거래처</th>
                      <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">거래금액</th>
                      <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">수수료</th>
                      <th className="hidden md:table-cell px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">순이익</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">계약일</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">담당자</th>
                      <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">작성자</th>
                      <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">잔금</th>
                      <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              trade.tradeType === "매수"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {trade.tradeType}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{trade.clubName || "-"}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.trade.membershipName}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{trade.customer.name}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.customer.contact}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-right text-gray-900 whitespace-nowrap">{formatPrice(trade.trade.amount)}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.trade.tradingPartner || "-"}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-right text-gray-900 whitespace-nowrap">{formatPrice(trade.trade.tradeAmount)}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-right text-gray-600 whitespace-nowrap">{formatPrice(trade.trade.commission)}</td>
                        <td className={`hidden md:table-cell px-3 py-3 text-sm text-right whitespace-nowrap font-medium ${
                          trade.financials.netProfit !== null && trade.financials.netProfit > 0
                            ? "text-green-700"
                            : trade.financials.netProfit !== null && trade.financials.netProfit < 0
                            ? "text-red-700"
                            : "text-gray-600"
                        }`}>
                          {formatPrice(trade.financials.netProfit)}
                        </td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.trade.contractDate || "-"}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.manager || "-"}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{trade.createdByName || "-"}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-center">
                          {trade.balance.balanceCompleted ? (
                            <svg className="w-4 h-4 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-3 py-3 text-center">
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
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  이전
                </Button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  다음
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
