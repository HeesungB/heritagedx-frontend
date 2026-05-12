"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  FileText,
  Edit3,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  PageLoading,
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmModal,
  Drawer,
  Badge,
  ClubSearchSelect,
} from "@heritage-dx/ui";
import { useMembershipTradeAdminRepository, useClubRepository } from "@heritage-dx/api";
import type { MembershipTrade, Club, Pagination } from "@heritage-dx/types";
import type { TradeWorkflowStatus } from "@heritage-dx/store";
import { canDeleteTrade, useTopClubs } from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { StatusBadge } from "@/components/approval/StatusBadge";
import { ActionReasonModal } from "@/components/approval/ActionReasonModal";

const formatPrice = (price: string | number | null) => {
  if (!price) return "-";
  const num = typeof price === "string" ? Number(price) : price;
  if (isNaN(num) || num === 0) return "-";
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

export default function MembershipTradesPage() {
  const membershipTradesRepo = useMembershipTradeAdminRepository();
  const clubsRepo = useClubRepository();
  const { user } = useAuth();
  const { preloadedRecords, clearPreloadedRecords, clubs } = useData();
  const usedPreloadRef = useRef(false);

  const [rawRecords, setRawRecords] = useState<MembershipTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"" | "매수" | "매도">("");

  // 골프장/회원권/기간 필터
  const [selectedClubCode, setSelectedClubCode] = useState("");
  const [selectedMembership, setSelectedMembership] = useState("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterWorkflow, setFilterWorkflow] = useState<"" | TradeWorkflowStatus>("");
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  // 거래내역의 사유 입력 모달은 REJECT 액션 전용
  const [reasonModal, setReasonModal] = useState<{ recordId: string } | null>(null);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);
  const clubsRef = useRef<Club[]>(clubs);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // 디바운스: searchInput → searchQuery (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // clubsRef 동기화
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // 골프장별 가용 필터 (rawRecords의 clubName에 해당하는 골프장만)
  const availableClubs = useMemo(() => {
    const clubNames = new Set(rawRecords.map((r) => r.clubName).filter(Boolean));
    return clubs.filter((c) => clubNames.has(c.name));
  }, [clubs, rawRecords]);

  // 골프장 즐겨찾기·최근 본 — 필터 / 폼 양쪽 picker 에 동일하게 노출
  const {
    topClubCodes: topClubCodesFilter,
    isFavorite: isClubFavorite,
    toggleFavorite: toggleClubFavorite,
    trackSelection: trackClubSelection,
  } = useTopClubs(availableClubs, 5);
  const { topClubCodes: topClubCodesForm } = useTopClubs(clubs, 5);

  // 골프장 선택 변경 시 회원권 목록 로드
  useEffect(() => {
    setSelectedMembership("");
    if (!selectedClubCode) {
      setMemberships([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await clubsRepo.getOne(selectedClubCode);
        if (!cancelled && res.success && res.data?.memberships) {
          const names = res.data.memberships
            .map((m) => m.membershipType)
            .filter(Boolean);
          setMemberships([...new Set(names)]);
        }
      } catch {
        if (!cancelled) setMemberships([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClubCode]);

  // 클라이언트 필터링 (골프장 + 회원권 + 기간)
  const displayRecords = useMemo(() => {
    let result = rawRecords;
    if (selectedClubCode) {
      const club = clubsRef.current.find((c) => c.code === selectedClubCode);
      if (club) {
        result = result.filter((r) => r.clubName === club.name);
      }
    }
    if (selectedMembership) {
      result = result.filter((r) => r.membershipName === selectedMembership);
    }
    if (dateFrom) {
      result = result.filter((r) => r.contractDate && r.contractDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((r) => r.contractDate && r.contractDate <= dateTo);
    }
    return result;
  }, [rawRecords, selectedClubCode, selectedMembership, dateFrom, dateTo]);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MembershipTrade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MembershipTrade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 전용 골프장/회원권 state
  const [formClubCode, setFormClubCode] = useState("");
  const [formClubId, setFormClubId] = useState("");
  const [formMemberships, setFormMemberships] = useState<{ id: string; name: string }[]>([]);

  // 폼용 회원권 목록 fetch
  useEffect(() => {
    if (!formClubCode) {
      setFormMemberships([]);
      setFormClubId("");
      return;
    }
    let cancelled = false;
    clubsRepo.getOne(formClubCode)
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setFormClubId(res.data.id);
          setFormMemberships(
            (res.data.memberships ?? []).map((m) => ({
              id: m.id,
              name: m.membershipName || m.membershipType,
            }))
          );
        } else {
          setFormClubId("");
          setFormMemberships([]);
        }
      })
      .catch(() => { if (!cancelled) { setFormClubId(""); setFormMemberships([]); } });
    return () => { cancelled = true; };
  }, [formClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    tradeType: "매수" as "매도" | "매수",
    membershipName: "",
    customerName: "",
    contact: "",
    tradingPartner: "",
    manager: "",
    amount: "",
    tradeAmount: "",
    commission: "",
    marketProfit: "",
    expense: "",
    depositAmount: "",
    contractDate: "",
    balanceDate: "",
    actualTransactionDate: "",
    balanceCompleted: false,
    taxTransfer: false,
    taxAcquisition: false,
    invoiceSales: "",
    invoicePurchase: "",
    description: "",
    remarks: "",
  });

  const resetForm = () => {
    setFormClubCode("");
    setFormClubId("");
    setFormMemberships([]);
    setForm({
      tradeType: "매수",
      membershipName: "",
      customerName: "",
      contact: "",
      tradingPartner: "",
      manager: "",
      amount: "",
      tradeAmount: "",
      commission: "",
      marketProfit: "",
      expense: "",
      depositAmount: "",
      contractDate: "",
      balanceDate: "",
      actualTransactionDate: "",
      balanceCompleted: false,
      taxTransfer: false,
      taxAcquisition: false,
      invoiceSales: "",
      invoicePurchase: "",
      description: "",
      remarks: "",
    });
  };

  const loadRecords = useCallback(async () => {
    // 초기 로드 시 프리로드 데이터 사용 (page 1, 필터 없음)
    if (
      !usedPreloadRef.current &&
      preloadedRecords &&
      page === 1 &&
      !searchQuery &&
      !filterType
    ) {
      usedPreloadRef.current = true;
      setRawRecords(preloadedRecords.trades);
      setPagination(preloadedRecords.pagination);
      setIsLoading(false);
      clearPreloadedRecords();
      return;
    }

    setIsLoading(true);
    try {
      const response = await membershipTradesRepo.getAll({
        page,
        limit: 20,
        search: searchQuery || undefined,
        tradeType: filterType || undefined,
        sort: "contractDate",
        order: "DESC",
        workflowStatus: filterWorkflow || undefined,
      });
      if (response.success && response.data) {
        setRawRecords(response.data.trades || []);
        setPagination(response.data.pagination || null);
      } else {
        setRawRecords([]);
      }
    } catch (error) {
      console.error("Failed to load trade records:", error);
      setRawRecords([]);
    }
    setIsLoading(false);
  }, [page, searchQuery, filterType, filterWorkflow, preloadedRecords, clearPreloadedRecords]);

  const runWorkflowAction = async (
    record: MembershipTrade,
    action: "ADVANCE_TO_TAX_FILING" | "ADVANCE_TO_COMPLETED" | "REJECT",
    reason?: string,
  ) => {
    setApprovalBusyId(record.id);
    try {
      const response = await membershipTradesRepo.workflowAction(record.id, { action, reason });
      if (response.success) {
        // REJECT 는 서버에서 거래 레코드를 물리 삭제하므로 목록에서도 제거
        if (action === "REJECT") {
          setRawRecords((prev) => prev.filter((r) => r.id !== record.id));
          return true;
        }
        if (response.data) {
          const updated = response.data;
          setRawRecords((prev) => prev.map((r) => (r.id === record.id ? updated : r)));
        }
        return true;
      }
      alert(response.error || "처리에 실패했습니다.");
      return false;
    } catch {
      alert("처리 중 오류가 발생했습니다.");
      return false;
    } finally {
      setApprovalBusyId(null);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleAdd = async () => {
    if (!formClubId) {
      alert("골프장을 선택해주세요.");
      return;
    }
    const membershipObj = formMemberships.find((m) => m.name === form.membershipName);
    if (!membershipObj) {
      alert("회원권을 선택해주세요.");
      return;
    }
    if (!form.customerName.trim()) {
      alert("고객명은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await membershipTradesRepo.create({
        clubId: formClubId,
        membershipId: membershipObj.id,
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        tradingPartner: form.tradingPartner || null,
        manager: form.manager || null,
        amount: form.amount ? Number(form.amount) : null,
        tradeAmount: form.tradeAmount ? Number(form.tradeAmount) : null,
        commission: form.commission ? Number(form.commission) : null,
        marketProfit: form.marketProfit ? Number(form.marketProfit) : null,
        expense: form.expense ? Number(form.expense) : null,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        contractDate: form.contractDate || null,
        balanceDate: form.balanceDate || null,
        actualTransactionDate: form.actualTransactionDate || null,
        balanceCompleted: form.balanceCompleted,
        taxTransfer: form.taxTransfer,
        taxAcquisition: form.taxAcquisition,
        invoiceSales: form.invoiceSales ? Number(form.invoiceSales) : null,
        invoicePurchase: form.invoicePurchase ? Number(form.invoicePurchase) : null,
        description: form.description || null,
        remarks: form.remarks || null,
      });
      if (response.success) {
        alert("거래 내역이 등록되었습니다.");
        setShowAddDrawer(false);
        resetForm();
        loadRecords();
      } else {
        alert(response.error || "등록에 실패했습니다.");
      }
    } catch {
      alert("등록 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingRecord?.id) return;
    if (!formClubId) {
      alert("골프장을 선택해주세요.");
      return;
    }
    const membershipObj = formMemberships.find((m) => m.name === form.membershipName);
    if (!membershipObj) {
      alert("회원권을 선택해주세요.");
      return;
    }
    if (!form.customerName.trim()) {
      alert("고객명은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await membershipTradesRepo.update(editingRecord.id, {
        clubId: formClubId,
        membershipId: membershipObj.id,
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        tradingPartner: form.tradingPartner || null,
        manager: form.manager || null,
        amount: form.amount ? Number(form.amount) : null,
        tradeAmount: form.tradeAmount ? Number(form.tradeAmount) : null,
        commission: form.commission ? Number(form.commission) : null,
        marketProfit: form.marketProfit ? Number(form.marketProfit) : null,
        expense: form.expense ? Number(form.expense) : null,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        contractDate: form.contractDate || null,
        balanceDate: form.balanceDate || null,
        actualTransactionDate: form.actualTransactionDate || null,
        balanceCompleted: form.balanceCompleted,
        taxTransfer: form.taxTransfer,
        taxAcquisition: form.taxAcquisition,
        invoiceSales: form.invoiceSales ? Number(form.invoiceSales) : null,
        invoicePurchase: form.invoicePurchase ? Number(form.invoicePurchase) : null,
        description: form.description || null,
        remarks: form.remarks || null,
      });
      if (response.success) {
        alert("거래 내역이 수정되었습니다.");
        setEditingRecord(null);
        resetForm();
        loadRecords();
      } else {
        alert(response.error || "수정에 실패했습니다.");
      }
    } catch {
      alert("수정 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const response = await membershipTradesRepo.delete(deleteTarget.id);
      if (response.success) {
        setRawRecords(rawRecords.filter((t) => t.id !== deleteTarget.id));
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleEdit = (record: MembershipTrade) => {
    setEditingRecord(record);
    const matchedClub = clubsRef.current.find((c) => c.name === record.clubName);
    setFormClubCode(matchedClub?.code || "");
    setForm({
      tradeType: (record.tradeType as "매도" | "매수") || "매수",
      membershipName: record.membershipName || "",
      customerName: record.customerName || "",
      contact: record.contact || "",
      tradingPartner: record.tradingPartner || "",
      manager: record.manager || "",
      amount: record.amount != null ? String(record.amount) : "",
      tradeAmount: record.tradeAmount != null ? String(record.tradeAmount) : "",
      commission: record.commission != null ? String(record.commission) : "",
      marketProfit: record.marketProfit != null ? String(record.marketProfit) : "",
      expense: record.expense != null ? String(record.expense) : "",
      depositAmount: record.depositAmount != null ? String(record.depositAmount) : "",
      contractDate: record.contractDate || "",
      balanceDate: record.balanceDate || "",
      actualTransactionDate: record.actualTransactionDate || "",
      balanceCompleted: record.balanceCompleted || false,
      taxTransfer: record.taxTransfer || false,
      taxAcquisition: record.taxAcquisition || false,
      invoiceSales: record.invoiceSales != null ? String(record.invoiceSales) : "",
      invoicePurchase: record.invoicePurchase != null ? String(record.invoicePurchase) : "",
      description: record.description || "",
      remarks: record.remarks || "",
    });
  };

  if (isLoading && rawRecords.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">거래 내역</h1>
          {pagination && (
            <Badge variant="default">총 {pagination.total}건</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">모든 거래 내역을 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>거래 내역 목록</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setEditingRecord(null);
                setShowAddDrawer(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {(["", "매수", "매도"] as const).map((type) => (
                <button
                  key={type || "all"}
                  onClick={() => { setFilterType(type); setPage(1); }}
                  className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                    filterType === type
                      ? type === "매도"
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : type === "매수"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                  }`}
                >
                  {type || "전체"}
                </button>
              ))}
            </div>
            <select
              value={filterWorkflow}
              onChange={(e) => { setFilterWorkflow(e.target.value as "" | TradeWorkflowStatus); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white w-[140px] h-[34px]"
            >
              <option value="">진행 단계 전체</option>
              <option value="DOCUMENT_AND_BALANCE">잔금/문서 진행</option>
              <option value="TAX_FILING">세무신고</option>
              <option value="COMPLETED">완료</option>
              <option value="REJECTED">반려</option>
            </select>
            <ClubSearchSelect
              clubs={availableClubs}
              selectedClubCode={selectedClubCode}
              onChange={(code) => { setSelectedClubCode(code); setSelectedMembership(""); }}
              topClubCodes={topClubCodesFilter}
              isFavorite={isClubFavorite}
              onToggleFavorite={(code, item) =>
                toggleClubFavorite(code, { name: item.name, region: item.region, holes: item.holes })
              }
              onClubSelect={(item) => trackClubSelection({ code: item.code, name: item.name })}
            />
            <select
              value={selectedMembership}
              onChange={(e) => setSelectedMembership(e.target.value)}
              disabled={!selectedClubCode}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-[160px] h-[34px]"
            >
              <option value="">전체 회원권</option>
              {memberships.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full sm:w-[130px] text-sm"
              />
              <span className="text-gray-400 text-sm">~</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full sm:w-[130px] text-sm"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="고객명, 회원권명으로 검색..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">불러오는 중...</span>
            </div>
          ) : displayRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">
                {searchInput || filterType || selectedClubCode ? "검색 결과가 없습니다" : "등록된 거래 내역이 없습니다"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[500px] w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="py-2 pr-3 font-medium">승인</th>
                      <th className="py-2 pr-3 font-medium">유형</th>
                      <th className="py-2 pr-3 font-medium">회원권</th>
                      <th className="py-2 pr-3 font-medium">고객명</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">연락처</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">매매가</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">거래상대</th>
                      <th className="py-2 pr-3 font-medium">거래금</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">수수료</th>
                      <th className="py-2 pr-3 font-medium">순이익</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">계약일</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">담당자</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">작성자</th>
                      <th className="hidden md:table-cell py-2 pr-3 font-medium">잔금</th>
                      <th className="hidden md:table-cell py-2 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={record.workflowStatus} />
                            {record.workflowStatus !== "COMPLETED" && (
                              <>
                                {record.workflowStatus !== "TAX_FILING" && (
                                  <button
                                    type="button"
                                    disabled={approvalBusyId === record.id}
                                    onClick={() => runWorkflowAction(record, "ADVANCE_TO_TAX_FILING")}
                                    className="p-1 rounded hover:bg-sky-50 text-sky-600 disabled:opacity-50"
                                    title="세무신고로 진행"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                {record.workflowStatus === "TAX_FILING" && (
                                  <button
                                    type="button"
                                    disabled={approvalBusyId === record.id}
                                    onClick={() => runWorkflowAction(record, "ADVANCE_TO_COMPLETED")}
                                    className="p-1 rounded hover:bg-emerald-50 text-emerald-600 disabled:opacity-50"
                                    title="완료로 진행"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={approvalBusyId === record.id}
                                  onClick={() => setReasonModal({ recordId: record.id })}
                                  className="p-1 rounded hover:bg-rose-50 text-rose-600 disabled:opacity-50"
                                  title="반려 (거래 삭제 + 상담 복귀)"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <Badge variant={record.tradeType === "매수" ? "info" : "error"}>{record.tradeType}</Badge>
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-gray-800 whitespace-nowrap">{record.membershipName}</td>
                        <td className="py-2.5 pr-3 font-medium text-gray-900 whitespace-nowrap">{record.customerName}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-500 whitespace-nowrap">{record.contact}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-800 whitespace-nowrap">{formatPrice(record.amount)}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-600 whitespace-nowrap">{record.tradingPartner || "-"}</td>
                        <td className="py-2.5 pr-3 text-gray-800 whitespace-nowrap">{formatPrice(record.tradeAmount)}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-800 whitespace-nowrap">{formatPrice(record.commission)}</td>
                        <td className={`py-2.5 pr-3 font-medium whitespace-nowrap ${
                          record.netProfit != null && record.netProfit > 0
                            ? "text-green-600"
                            : record.netProfit != null && record.netProfit < 0
                              ? "text-red-600"
                              : "text-gray-800"
                        }`}>
                          {formatPrice(record.netProfit)}
                        </td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-400 whitespace-nowrap">{record.contractDate || "-"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-600 whitespace-nowrap">{record.manager || "-"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3 text-gray-500 whitespace-nowrap">{record.createdByName || "-"}</td>
                        <td className="hidden md:table-cell py-2.5 pr-3">
                          {record.balanceCompleted ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell py-2.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(record)} className="p-1 hover:bg-gray-200 rounded" title="수정">
                              <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                            {canDeleteTrade(user) && (
                              <button onClick={() => setDeleteTarget(record)} className="p-1 hover:bg-gray-200 rounded" title="삭제">
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-error" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</Button>
                  <span className="text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={showAddDrawer || !!editingRecord}
        onClose={() => { setShowAddDrawer(false); setEditingRecord(null); resetForm(); }}
        title={editingRecord ? "거래 내역 수정" : "거래 내역 추가"}
        width="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">거래유형 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {(["매수", "매도"] as const).map((type) => (
                <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, tradeType: type }))}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    form.tradeType === type
                      ? type === "매수" ? "bg-blue-600 text-white border-blue-600" : "bg-red-600 text-white border-red-600"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}>{type}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">골프장 <span className="text-red-500">*</span></label>
            <ClubSearchSelect
              clubs={clubs}
              selectedClubCode={formClubCode}
              onChange={(code) => {
                setFormClubCode(code);
                setFormClubId("");
                setFormMemberships([]);
                setForm((f) => ({ ...f, membershipName: "" }));
              }}
              topClubCodes={topClubCodesForm}
              isFavorite={isClubFavorite}
              onToggleFavorite={(code, item) =>
                toggleClubFavorite(code, { name: item.name, region: item.region, holes: item.holes })
              }
              onClubSelect={(item) => trackClubSelection({ code: item.code, name: item.name })}
              placeholder="골프장 선택"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회원권명 <span className="text-red-500">*</span></label>
            {formMemberships.length > 0 ? (
              <select
                value={form.membershipName}
                onChange={(e) => setForm((f) => ({ ...f, membershipName: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">회원권 선택</option>
                {formMemberships.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            ) : (
              <Input value={form.membershipName} onChange={(e) => setForm((f) => ({ ...f, membershipName: e.target.value }))} placeholder={formClubCode ? "회원권 로딩 중..." : "골프장을 먼저 선택해주세요"} disabled={!formClubCode} />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">고객명 <span className="text-red-500">*</span></label><Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="홍길동" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">연락처</label><Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="010-1234-5678" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">거래상대</label><Input value={form.tradingPartner} onChange={(e) => setForm((f) => ({ ...f, tradingPartner: e.target.value }))} placeholder="거래상대 이름" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">담당자</label><Input value={form.manager} onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))} placeholder="담당자 이름" /></div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-800 mb-3">금액 정보</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매매가 (원)</label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
                {form.amount && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.amount)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거래금 (원)</label>
                <Input type="number" value={form.tradeAmount} onChange={(e) => setForm((f) => ({ ...f, tradeAmount: e.target.value }))} placeholder="0" />
                {form.tradeAmount && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.tradeAmount)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수수료 (원)</label>
                <Input type="number" value={form.commission} onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))} placeholder="0" />
                {form.commission && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.commission)}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">시세차익 (원)</label><Input type="number" value={form.marketProfit} onChange={(e) => setForm((f) => ({ ...f, marketProfit: e.target.value }))} placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">비용 (원)</label><Input type="number" value={form.expense} onChange={(e) => setForm((f) => ({ ...f, expense: e.target.value }))} placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">계약금 (원)</label><Input type="number" value={form.depositAmount} onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))} placeholder="0" /></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-800 mb-3">일정</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">계약일</label><Input type="date" value={form.contractDate} onChange={(e) => setForm((f) => ({ ...f, contractDate: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">잔금일</label><Input type="date" value={form.balanceDate} onChange={(e) => setForm((f) => ({ ...f, balanceDate: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">실거래일</label><Input type="date" value={form.actualTransactionDate} onChange={(e) => setForm((f) => ({ ...f, actualTransactionDate: e.target.value }))} /></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-800 mb-3">세금 / 상태</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.balanceCompleted} onChange={(e) => setForm((f) => ({ ...f, balanceCompleted: e.target.checked }))} className="rounded border-gray-300" />잔금 완료
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.taxTransfer} onChange={(e) => setForm((f) => ({ ...f, taxTransfer: e.target.checked }))} className="rounded border-gray-300" />양도세
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.taxAcquisition} onChange={(e) => setForm((f) => ({ ...f, taxAcquisition: e.target.checked }))} className="rounded border-gray-300" />취득세
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">세금계산서 매출</label><Input type="number" value={form.invoiceSales} onChange={(e) => setForm((f) => ({ ...f, invoiceSales: e.target.value }))} placeholder="0" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">세금계산서 매입</label><Input type="number" value={form.invoicePurchase} onChange={(e) => setForm((f) => ({ ...f, invoicePurchase: e.target.value }))} placeholder="0" /></div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div>
              <Textarea
                label="설명"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                minRows={2}
                placeholder="거래 설명"
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
              <Input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="특이사항" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowAddDrawer(false); setEditingRecord(null); resetForm(); }}>취소</Button>
            <Button onClick={editingRecord ? handleUpdate : handleAdd} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : editingRecord ? "수정" : "등록"}
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="거래 내역 삭제"
        message={`"${deleteTarget?.customerName}" 고객의 거래 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />

      <ActionReasonModal
        open={!!reasonModal}
        action={reasonModal ? "REJECT" : null}
        submitting={reasonSubmitting}
        onCancel={() => setReasonModal(null)}
        onConfirm={async (reason) => {
          if (!reasonModal) return;
          setReasonSubmitting(true);
          const target = rawRecords.find((r) => r.id === reasonModal.recordId);
          if (target) {
            const ok = await runWorkflowAction(target, "REJECT", reason);
            if (ok) setReasonModal(null);
          }
          setReasonSubmitting(false);
        }}
      />
    </div>
  );
}
