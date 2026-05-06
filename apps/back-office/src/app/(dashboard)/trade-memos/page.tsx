"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  MessageSquare,
  Edit3,
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
import {
  useConsultationAdminRepository,
  useClubRepository,
  useCustomerRepository,
} from "@heritage-dx/api";
import type {
  Consultation,
  ConsultationNoteEntry,
  Club,
  Pagination,
  CustomerHistorySummary,
} from "@heritage-dx/types";
import {
  buildClubMembershipPair,
  canDeleteConsultation,
  type ApprovalStatus,
} from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { ActionReasonModal } from "@/components/approval/ActionReasonModal";
import MatchedCustomerCard from "@/components/trade-memos/MatchedCustomerCard";

// 신규 notes JSONB 응답({entries:[...]}) 의 entries 만 추출. 과거 응답이 일시적으로
// 섞여 들어와도 [] 로 흡수해 화면 크래시를 막는다.
function buildMemoEntries(memo: Consultation): ConsultationNoteEntry[] {
  return Array.isArray(memo.notes?.entries) ? memo.notes.entries : [];
}

function formatMemoTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

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

export default function ConsultationsPage() {
  const consultationsRepo = useConsultationAdminRepository();
  const clubsRepo = useClubRepository();
  const customerRepo = useCustomerRepository();
  const { user } = useAuth();
  const { preloadedMemos, clearPreloadedMemos, clubs } = useData();
  const searchParams = useSearchParams();
  const memoIdParam = searchParams.get("memoId");
  const usedPreloadRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const [rawMemos, setRawMemos] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"" | "매수" | "매도">("");
  const [filterDone, setFilterDone] = useState<"" | "done" | "notDone">("notDone");
  const [filterApproval, setFilterApproval] = useState<"" | ApprovalStatus>("");
  const [showConverted, setShowConverted] = useState(false);
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  // 상담일지의 사유 입력 모달은 REOPEN 액션 전용 (FIRST_APPROVED 상태에서 거래내역 이관 전 무산 시 호출)
  const [reasonModal, setReasonModal] = useState<{ memoId: string } | null>(null);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

  // 골프장/회원권/기간 필터
  const [selectedClubCode, setSelectedClubCode] = useState("");
  const [selectedMembership, setSelectedMembership] = useState("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const clubsRef = useRef<Club[]>(clubs);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Consultation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consultation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 반대매매 사이드바 상태
  const [selectedMemo, setSelectedMemo] = useState<Consultation | null>(null);
  const [relatedMemos, setRelatedMemos] = useState<Consultation[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [relatedSort, setRelatedSort] = useState<"date" | "price">("date");
  const [relatedFilterDone, setRelatedFilterDone] = useState<"" | "done" | "notDone">("notDone");

  // 고객 히스토리
  const [customerHistory, setCustomerHistory] = useState<CustomerHistorySummary | null>(null);
  const [isLoadingCustomerHistory, setIsLoadingCustomerHistory] = useState(false);

  // 디바운스: searchInput → searchQuery (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // clubsRef 동기화
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // 골프장별 가용 필터 (rawMemos의 clubName에 해당하는 골프장만)
  const availableClubs = useMemo(() => {
    const clubNames = new Set(rawMemos.map((m) => m.clubName).filter(Boolean));
    return clubs.filter((c) => clubNames.has(c.name));
  }, [clubs, rawMemos]);

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

  // 클라이언트 필터링 (골프장 + 회원권 + 기간 + 완료여부 + 거래 전환 완료 포함)
  // isDone/isConverted 쿼리 파라미터는 백엔드가 거부하므로 모두 클라이언트 사이드에서 적용한다.
  const displayMemos = useMemo(() => {
    let result = rawMemos;
    if (selectedClubCode) {
      const club = clubsRef.current.find((c) => c.code === selectedClubCode);
      if (club) {
        result = result.filter((m) => m.clubName === club.name);
      }
    }
    if (selectedMembership) {
      result = result.filter((m) => m.membershipName === selectedMembership);
    }
    if (dateFrom) {
      result = result.filter((m) => m.registrationDate && m.registrationDate >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((m) => m.registrationDate && m.registrationDate <= dateTo);
    }
    if (filterDone === "done") {
      result = result.filter((m) => m.isDone === true);
    } else if (filterDone === "notDone") {
      result = result.filter((m) => !m.isDone);
    }
    // showConverted=false 면 거래로 전환된 상담(linkedTradeId 있음 또는 DEPOSIT_APPROVED) 제외
    if (!showConverted) {
      result = result.filter(
        (m) =>
          !m.linkedTradeId &&
          m.approvalStatus !== "DEPOSIT_APPROVED" &&
          m.approvalStatus !== "FIRST_APPROVED",
      );
    }
    return result;
  }, [rawMemos, selectedClubCode, selectedMembership, dateFrom, dateTo, filterDone, showConverted]);

  // 폼용 골프장/회원권 상태
  const [formClubCode, setFormClubCode] = useState("");
  const [formMemberships, setFormMemberships] = useState<Array<{ id: string; type: string; name: string }>>([]);
  const [manualClubInput, setManualClubInput] = useState(false);
  const [manualMembershipInput, setManualMembershipInput] = useState(false);

  const [form, setForm] = useState({
    clubId: "",
    clubName: "",
    membershipId: "",
    membershipName: "",
    membershipType: "",
    tradeType: "매수" as "매도" | "매수",
    customerName: "",
    contact: "",
    offerPrice: "",
    offerPriceNote: "",
    desiredPrice: "",
    desiredPriceNote: "",
    depositAmount: "",
    accountNumber: "",
    notes: "",
    registrationDate: new Date().toISOString().split("T")[0],
    tradeDate: "",
    remarks: "",
  });
  const formRef = useRef(form);
  formRef.current = form;

  const resetForm = () => {
    setForm({
      clubId: "",
      clubName: "",
      membershipId: "",
      membershipName: "",
      membershipType: "",
      tradeType: "매수",
      customerName: "",
      contact: "",
      offerPrice: "",
      offerPriceNote: "",
      desiredPrice: "",
      desiredPriceNote: "",
      depositAmount: "",
      accountNumber: "",
      notes: "",
      registrationDate: new Date().toISOString().split("T")[0],
      tradeDate: "",
      remarks: "",
    });
    setFormClubCode("");
    setFormMemberships([]);
    setManualClubInput(false);
    setManualMembershipInput(false);
  };

  // 폼: 골프장 선택 시 clubId/clubName 자동입력 + 회원권 목록 로드
  useEffect(() => {
    if (!formClubCode || formClubCode === "__manual__") {
      setFormMemberships([]);
      return;
    }
    clubsRepo.getOne(formClubCode).then((res) => {
      if (res.success && res.data) {
        setForm((f) => ({
          ...f,
          clubId: res.data!.id || "",
          clubName: res.data!.name,
        }));
        const mems = (res.data.memberships ?? []).map((m) => ({
          id: m.id,
          type: m.membershipType,
          name: m.membershipName || m.membershipType,
        }));
        setFormMemberships(mems);
        // 수정 모드에서 기존 회원권이 목록에 없으면 직접입력 모드 유지
        const currentType = formRef.current.membershipType;
        if (currentType && !mems.some((m) => m.name === currentType && m.type === currentType)) {
          // 정확한 매칭 시도: id 또는 name으로
          const matched = mems.find((m) => m.id === formRef.current.membershipId || m.name === currentType || m.type === currentType);
          if (!matched) {
            setManualMembershipInput(true);
          } else {
            setManualMembershipInput(false);
          }
        } else {
          setManualMembershipInput(false);
        }
      }
    }).catch(console.error);
  }, [formClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMemos = useCallback(async () => {
    // 초기 로드 시 프리로드 데이터 사용 (page 1, 필터 없음)
    if (
      !usedPreloadRef.current &&
      preloadedMemos &&
      page === 1 &&
      !searchQuery &&
      !filterType
    ) {
      usedPreloadRef.current = true;
      setRawMemos(preloadedMemos.trades);
      setPagination(preloadedMemos.pagination);
      setIsLoading(false);
      clearPreloadedMemos();
      return;
    }

    setIsLoading(true);
    try {
      // 백엔드가 isDone/isConverted 쿼리 파라미터를 거부하므로 서버 필터에서 제외.
      // 완료/진행중·거래전환 필터는 클라이언트 사이드(displayMemos)에서 적용한다.
      const response = await consultationsRepo.getAll({
        page,
        limit: 20,
        search: searchQuery || undefined,
        tradeType: filterType || undefined,
        sort: "registrationDate",
        order: "DESC",
        approvalStatus: filterApproval || undefined,
      });
      if (response.success && response.data) {
        const fresh = response.data.trades || [];
        if (page === 1) {
          setRawMemos(fresh);
        } else {
          // 인피니트 스크롤: dedupe 후 누적
          setRawMemos((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newOnes = fresh.filter((m) => !ids.has(m.id));
            return newOnes.length === 0 ? prev : [...prev, ...newOnes];
          });
        }
        setPagination(response.data.pagination || null);
      } else {
        console.error("loadMemos failed:", response.error);
        if (page === 1) setRawMemos([]);
      }
    } catch (error) {
      console.error("Failed to load trade memos:", error);
      if (page === 1) setRawMemos([]);
    }
    setIsLoading(false);
  }, [page, searchQuery, filterType, filterApproval, preloadedMemos, clearPreloadedMemos]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  // IntersectionObserver: sentinel 진입 시 다음 페이지 로드
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && pagination?.hasNext && !isLoading) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pagination?.hasNext, isLoading]);

  const handleAdd = async () => {
    if (!form.customerName.trim() || !form.clubName.trim()) {
      alert("골프장명과 고객명은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      const trimmedNote = form.notes.trim();
      const response = await consultationsRepo.create({
        ...buildClubMembershipPair({
          clubId: form.clubId,
          clubName: form.clubName,
          membershipId: form.membershipId,
          membershipType: form.membershipType,
        }),
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
        offerPriceNote: form.offerPriceNote || null,
        desiredPrice: form.desiredPrice ? Number(form.desiredPrice) : null,
        desiredPriceNote: form.desiredPriceNote || null,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        accountNumber: form.accountNumber || null,
        // 신규 API: notes 문자열은 백엔드가 첫 entry 로 자동 변환. 비어있으면 omit.
        ...(trimmedNote ? { notes: trimmedNote } : {}),
        registrationDate: form.registrationDate || null,
        tradeDate: form.tradeDate || null,
        remarks: form.remarks || null,
      });
      if (response.success) {
        alert("상담일지가 등록되었습니다.");
        setShowAddDrawer(false);
        resetForm();
        loadMemos();
      } else {
        alert(response.error || "등록에 실패했습니다.");
      }
    } catch {
      alert("등록 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingMemo?.id) return;
    if (!form.customerName.trim() || !form.clubName.trim()) {
      alert("골프장명과 고객명은 필수입니다.");
      return;
    }
    setIsSaving(true);
    try {
      // PUT 으로는 notes 직접 수정 금지. 메모는 별도 엔드포인트(POST/PATCH/DELETE
      // /admin/consultations/:id/notes[/:noteId]) 사용 — update 페이로드에서 omit.
      const response = await consultationsRepo.update(editingMemo.id, {
        ...buildClubMembershipPair({
          clubId: form.clubId,
          clubName: form.clubName,
          membershipId: form.membershipId,
          membershipType: form.membershipType,
        }),
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
        offerPriceNote: form.offerPriceNote || null,
        desiredPrice: form.desiredPrice ? Number(form.desiredPrice) : null,
        desiredPriceNote: form.desiredPriceNote || null,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        accountNumber: form.accountNumber || null,
        registrationDate: form.registrationDate || null,
        tradeDate: form.tradeDate || null,
        remarks: form.remarks || null,
      });
      if (response.success) {
        alert("상담일지가 수정되었습니다.");
        setEditingMemo(null);
        resetForm();
        loadMemos();
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
      const response = await consultationsRepo.delete(deleteTarget.id);
      if (response.success) {
        setRawMemos(rawMemos.filter((t) => t.id !== deleteTarget.id));
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleEdit = (trade: Consultation) => {
    setEditingMemo(trade);
    setForm({
      clubId: trade.clubId || "",
      clubName: trade.clubName || "",
      membershipId: trade.membershipId || "",
      membershipName: trade.membershipName || "",
      membershipType: trade.membershipName || "",
      tradeType: (trade.tradeType as "매도" | "매수") || "매수",
      customerName: trade.customerName || "",
      contact: trade.contact || "",
      offerPrice: trade.offerPrice ? String(trade.offerPrice) : "",
      offerPriceNote: trade.offerPriceNote || "",
      desiredPrice: trade.desiredPrice ? String(trade.desiredPrice) : "",
      desiredPriceNote: trade.desiredPriceNote || "",
      depositAmount: trade.depositAmount ? String(trade.depositAmount) : "",
      accountNumber: trade.accountNumber || "",
      // 편집 모드에서 notes 직접 수정은 PUT 으로 금지됨. 폼은 비워두고 메모는 별도 CRUD 사용.
      notes: "",
      registrationDate: trade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: trade.tradeDate || "",
      remarks: trade.remarks || "",
    });
    // 골프장 매칭
    const matched = clubs.find((c) => c.name === trade.clubName);
    if (matched) {
      setFormClubCode(matched.code);
      setManualClubInput(false);
    } else {
      setFormClubCode("__manual__");
      setManualClubInput(true);
    }
    setManualMembershipInput(false);
  };

  // 백엔드가 ConsultationInput 으로 isDone 을 더 이상 받지 않아 서버 영구화는 보류 상태.
  // 별도 토글 엔드포인트가 생기면 그쪽으로 연결한다. (현재는 로컬 상태만 변경)
  const handleToggleDone = async (memo: Consultation) => {
    const newIsDone = !memo.isDone;
    setRawMemos(prev => prev.map(m => m.id === memo.id ? { ...m, isDone: newIsDone } : m));
    setSelectedMemo(prev => prev && prev.id === memo.id ? { ...prev, isDone: newIsDone } : prev);
    setRelatedMemos(prev => prev.map(m => m.id === memo.id ? { ...m, isDone: newIsDone } : m));
  };

  const runApprovalAction = async (
    memo: Consultation,
    action: "APPROVE_FIRST" | "REOPEN",
    reason?: string,
  ) => {
    setApprovalBusyId(memo.id);
    try {
      const response = await consultationsRepo.approvalAction(memo.id, { action, reason });
      if (response.success && response.data) {
        const updated = response.data;
        setRawMemos((prev) => prev.map((m) => (m.id === memo.id ? updated : m)));
        setSelectedMemo((prev) => (prev && prev.id === memo.id ? updated : prev));
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

  const handleRowClick = async (memo: Consultation) => {
    setSelectedMemo(memo);
    setRelatedMemos([]);
    setIsLoadingRelated(true);
    setRelatedSort("date");
    setRelatedFilterDone("");
    setCustomerHistory(null);

    const oppositeType = memo.tradeType === "매수" ? "매도" : "매수";

    // 반대매매 + 고객 히스토리 병렬 로드
    const relatedPromise = consultationsRepo
      .getAll({ search: memo.clubName, tradeType: oppositeType, limit: 100 })
      .then((res) =>
        res.data?.trades?.filter((t: Consultation) => t.clubName === memo.clubName) || [],
      )
      .catch((error) => {
        console.error("Failed to load related memos:", error);
        return [] as Consultation[];
      });

    let historyPromise: Promise<CustomerHistorySummary | null> = Promise.resolve(null);
    if (memo.customerId) {
      setIsLoadingCustomerHistory(true);
      historyPromise = customerRepo
        .getHistorySummary(memo.customerId)
        .then((res) => (res.success && res.data ? res.data : null))
        .catch((error) => {
          console.error("Failed to load customer history:", error);
          return null;
        });
    }

    const [related, history] = await Promise.all([relatedPromise, historyPromise]);
    setRelatedMemos(related);
    setIsLoadingRelated(false);
    setCustomerHistory(history);
    setIsLoadingCustomerHistory(false);
  };

  const sortedRelatedMemos = useMemo(() => {
    let filtered = [...relatedMemos];
    if (relatedFilterDone === "done") filtered = filtered.filter(m => m.isDone);
    if (relatedFilterDone === "notDone") filtered = filtered.filter(m => !m.isDone);
    if (relatedSort === "price") {
      filtered.sort(
        (a, b) => (Number(b.offerPrice) || 0) - (Number(a.offerPrice) || 0)
      );
    } else {
      filtered.sort((a, b) =>
        (b.registrationDate || "").localeCompare(a.registrationDate || "")
      );
    }
    return filtered;
  }, [relatedMemos, relatedSort, relatedFilterDone]);

  // URL 쿼리 파라미터로 사이드바 자동 열기
  const handleRowClickRef = useRef(handleRowClick);
  handleRowClickRef.current = handleRowClick;

  useEffect(() => {
    if (!memoIdParam || autoOpenedRef.current || isLoading || rawMemos.length === 0) return;

    const targetMemo = rawMemos.find((m) => m.id === memoIdParam);
    if (targetMemo) {
      autoOpenedRef.current = true;
      handleRowClickRef.current(targetMemo);
      window.history.replaceState(null, "", "/trade-memos");
    }
  }, [memoIdParam, rawMemos, isLoading]);

  if (isLoading && rawMemos.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-900">상담일지</h1>
          {pagination && (
            <Badge variant="default">총 {pagination.total}건</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">모든 상담일지를 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>메모 목록</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setEditingMemo(null);
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
              value={filterDone}
              onChange={(e) => setFilterDone(e.target.value as "" | "done" | "notDone")}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white w-[100px] h-[34px]"
            >
              <option value="">전체</option>
              <option value="notDone">진행중</option>
              <option value="done">완료</option>
            </select>
            <select
              value={filterApproval}
              onChange={(e) => { setFilterApproval(e.target.value as "" | ApprovalStatus); setPage(1); }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white w-[140px] h-[34px]"
            >
              <option value="">승인 상태 전체</option>
              <option value="IN_CONSULTATION">상담중</option>
              <option value="PENDING_DEPOSIT">계약금 대기</option>
              {showConverted && <option value="DEPOSIT_APPROVED">계약금 승인</option>}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showConverted}
                onChange={(e) => { setShowConverted(e.target.checked); setPage(1); }}
                className="w-3.5 h-3.5 rounded border-gray-300"
              />
              거래 전환 완료 포함
            </label>
            <ClubSearchSelect
              clubs={availableClubs}
              selectedClubCode={selectedClubCode}
              onChange={(code) => { setSelectedClubCode(code); setSelectedMembership(""); }}
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
                placeholder="고객명, 골프장명으로 검색..."
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
          ) : displayMemos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">
                {searchInput || filterType || selectedClubCode || filterDone ? "검색 결과가 없습니다" : "등록된 상담일지가 없습니다"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="min-w-[400px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="py-2 pr-3 font-medium w-20">액션</th>
                    <th className="py-2 pr-3 font-medium">유형</th>
                    <th className="py-2 pr-3 font-medium">골프장</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">회원권</th>
                    <th className="py-2 pr-3 font-medium">고객명</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">연락처</th>
                    <th className="py-2 pr-3 font-medium">제시가</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">희망가</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">메모</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">등록일</th>
                    <th className="hidden md:table-cell py-2 pr-3 font-medium">작성자</th>
                    <th className="hidden md:table-cell py-2 font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayMemos.map((trade) => (
                    <tr key={trade.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer ${trade.isDone ? "opacity-50" : ""}`} onClick={() => handleRowClick(trade)}>
                      <td className="py-2.5 pr-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {(trade.approvalStatus === "IN_CONSULTATION" ||
                            trade.approvalStatus === "DRAFT") && (
                            <span
                              className="text-xs text-gray-400"
                              title="OS 에서 승인 요청 시 처리 가능"
                            >
                              상담중
                            </span>
                          )}
                          {(trade.approvalStatus === "PENDING_DEPOSIT" ||
                            trade.approvalStatus === "PENDING_APPROVAL") && (() => {
                            const hasDeposit = !!trade.depositAmount && trade.depositAmount > 0;
                            return (
                              <button
                                type="button"
                                disabled={approvalBusyId === trade.id || !hasDeposit}
                                onClick={() => runApprovalAction(trade, "APPROVE_FIRST")}
                                className="px-2 py-0.5 text-xs font-medium rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={hasDeposit ? "계약금 확인 후 거래 자동 생성" : "계약금 입력 후 확인 가능"}
                              >
                                계약금 확인
                              </button>
                            );
                          })()}
                          {(trade.approvalStatus === "DEPOSIT_APPROVED" || trade.approvalStatus === "FIRST_APPROVED") && (
                            <>
                              <button
                                type="button"
                                disabled={approvalBusyId === trade.id}
                                onClick={() => setReasonModal({ memoId: trade.id })}
                                className="px-2 py-0.5 text-xs font-medium rounded border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                title="계약금 입/송금 무산 시"
                              >
                                다시 열기
                              </button>
                              {trade.linkedTradeId && (
                                <a
                                  href={`/trade-records?highlight=${trade.linkedTradeId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2 py-0.5 text-xs font-medium rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  title="연결된 거래 페이지로 이동"
                                >
                                  거래 보기
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <Badge variant={trade.tradeType === "매수" ? "info" : "error"}>{trade.tradeType}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-gray-800 whitespace-nowrap">{trade.clubName}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-600 whitespace-nowrap">{trade.membershipName}</td>
                      <td className="py-2.5 pr-3 font-medium text-gray-900 whitespace-nowrap">{trade.customerName}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-500 whitespace-nowrap">{trade.contact}</td>
                      <td className="py-2.5 pr-3 text-gray-800 whitespace-nowrap">{formatPrice(trade.offerPrice)}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-800 whitespace-nowrap">{formatPrice(trade.desiredPrice)}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-500 max-w-[220px]">
                        {(() => {
                          const entries = buildMemoEntries(trade);
                          const latest = entries.length > 0 ? entries[entries.length - 1] : null;
                          if (!latest) return <span className="text-gray-300">메모 없음</span>;
                          return (
                            <div className="flex items-center gap-1.5 min-w-0" title={latest.content}>
                              <span className="truncate">{latest.content}</span>
                              {entries.length > 1 && (
                                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                                  +{entries.length - 1}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-400 whitespace-nowrap">{trade.registrationDate || "-"}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-gray-500 whitespace-nowrap">{trade.createdByName || "-"}</td>
                      <td className="hidden md:table-cell py-2.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(trade); }} className="p-1 hover:bg-gray-200 rounded" title="수정">
                            <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          </button>
                          {canDeleteConsultation(user, trade) && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(trade); }} className="p-1 hover:bg-gray-200 rounded" title="삭제">
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
              {/* 인피니트 스크롤 sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {pagination?.hasNext && isLoading && (
                <div className="py-4 text-center text-xs text-gray-400">불러오는 중...</div>
              )}
              {!pagination?.hasNext && rawMemos.length > 0 && (
                <div className="py-4 text-center text-xs text-gray-400">모든 항목을 불러왔습니다 ({rawMemos.length}건)</div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      <Drawer
        isOpen={showAddDrawer || !!editingMemo}
        onClose={() => { setShowAddDrawer(false); setEditingMemo(null); resetForm(); }}
        title={editingMemo ? "상담일지 수정" : "상담일지 추가"}
        width="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">골프장명 <span className="text-red-500">*</span></label>
            {manualClubInput ? (
              <div className="flex gap-1.5">
                <Input
                  value={form.clubName}
                  onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value, clubId: "" }))}
                  placeholder="골프장명 직접 입력"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setManualClubInput(false);
                    setFormClubCode("");
                    setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" }));
                    setFormMemberships([]);
                    setManualMembershipInput(false);
                  }}
                  className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
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
                      setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" }));
                      setFormMemberships([]);
                      setManualMembershipInput(false);
                    }
                  }}
                  placeholder="골프장 선택"
                />
                <button
                  type="button"
                  onClick={() => {
                    setManualClubInput(true);
                    setFormClubCode("__manual__");
                    setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" }));
                    setFormMemberships([]);
                    setManualMembershipInput(true);
                  }}
                  className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                >
                  직접입력
                </button>
              </div>
            )}
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">회원권 종류</label>
            {formMemberships.length > 0 && !manualMembershipInput ? (
              <select
                value={form.membershipId || form.membershipType}
                onChange={(e) => {
                  if (e.target.value === "__manual__") {
                    setManualMembershipInput(true);
                    setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" }));
                  } else {
                    const selected = formMemberships.find((m) => m.id === e.target.value);
                    if (selected) {
                      setForm((f) => ({
                        ...f,
                        membershipId: selected.id,
                        membershipType: selected.type,
                        membershipName: selected.name,
                      }));
                    } else {
                      setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" }));
                    }
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-gray-500"
              >
                <option value="">선택</option>
                {formMemberships.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value="__manual__">직접 입력</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  value={form.membershipType}
                  onChange={(e) => setForm((f) => ({ ...f, membershipType: e.target.value, membershipId: "", membershipName: "" }))}
                  placeholder="예: 개인정회원"
                  className="flex-1"
                />
                {formMemberships.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualMembershipInput(false);
                      setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" }));
                    }}
                    className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                  >
                    목록선택
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객명 <span className="text-red-500">*</span></label>
              <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="홍길동" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="010-1234-5678" />
            </div>
          </div>
          {/* 매칭된 고객 카드 — 수정 모드에서 editingMemo.customerId 가 있을 때만 노출.
              추가 모드(editingMemo === null)에는 customerId 가 없어 자동으로 숨겨진다. */}
          <MatchedCustomerCard customerId={editingMemo?.customerId ?? null} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제시가 (원)</label>
            <div className="flex gap-2">
              <Input type="number" value={form.offerPrice} onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value }))} placeholder="150000000" className="flex-1" />
              <Input value={form.offerPriceNote} onChange={(e) => setForm((f) => ({ ...f, offerPriceNote: e.target.value }))} placeholder="비고" className="w-24" />
            </div>
            {form.offerPrice && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.offerPrice)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">희망가 (원)</label>
            <div className="flex gap-2">
              <Input type="number" value={form.desiredPrice} onChange={(e) => setForm((f) => ({ ...f, desiredPrice: e.target.value }))} placeholder="180000000" className="flex-1" />
              <Input value={form.desiredPriceNote} onChange={(e) => setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))} placeholder="비고" className="w-24" />
            </div>
            {form.desiredPrice && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.desiredPrice)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              계약금 (원)
              <span className="ml-1 text-xs text-gray-400">— 입금 확인 후 승인 가능</span>
            </label>
            <Input
              type="number"
              value={form.depositAmount}
              onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
              placeholder="10000000"
            />
            {form.depositAmount && <p className="mt-1 text-xs text-gray-500">{formatPrice(form.depositAmount)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
            <Input
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              placeholder="110-123-456789"
            />
          </div>
          <div>
            <Textarea
              label="메모"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              minRows={2}
              placeholder="타회원권 교환 희망 등"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">등록일</label><Input type="date" value={form.registrationDate} onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">거래일</label><Input type="date" value={form.tradeDate} onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
            <Input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="계약금 입금 완료 등" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { setShowAddDrawer(false); setEditingMemo(null); resetForm(); }}>취소</Button>
            <Button onClick={editingMemo ? handleUpdate : handleAdd} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : editingMemo ? "수정" : "등록"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 반대매매 사이드바 */}
      <Drawer
        isOpen={!!selectedMemo}
        onClose={() => setSelectedMemo(null)}
        title={`${selectedMemo?.clubName || ""} 거래 현황`}
        width="lg"
      >
        {selectedMemo && (
          <div className="space-y-5">
            {/* 선택한 메모 하이라이트 카드 */}
            <div
              className={`rounded-lg p-4 border ${
                selectedMemo.isDone
                  ? "bg-emerald-50 border-emerald-200"
                  : selectedMemo.tradeType === "매수"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedMemo.tradeType === "매수" ? "info" : "error"
                    }
                  >
                    {selectedMemo.tradeType}
                  </Badge>
                  <span className="font-medium text-gray-900">
                    {selectedMemo.customerName}
                  </span>
                  {selectedMemo.membershipName && (
                    <span className="text-sm text-gray-500">
                      {selectedMemo.membershipName}
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedMemo.isDone}
                    onChange={() => handleToggleDone(selectedMemo)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">완료</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">제시가: </span>
                  <span className="text-gray-800 font-medium">
                    {formatPrice(selectedMemo.offerPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">희망가: </span>
                  <span className="text-gray-800 font-medium">
                    {formatPrice(selectedMemo.desiredPrice)}
                  </span>
                </div>
              </div>
              {selectedMemo.registrationDate && (
                <div className="mt-2 text-xs text-gray-400">
                  {selectedMemo.registrationDate}
                </div>
              )}
              {(() => {
                const entries = buildMemoEntries(selectedMemo);
                if (entries.length === 0) return null;
                const ordered = [...entries].reverse();
                return (
                  <div className="mt-3 rounded-md border border-gray-200 bg-gray-50/60 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-gray-500">
                      <MessageSquare className="h-3 w-3" />
                      메모 히스토리 · {entries.length}건
                    </div>
                    <div className="relative pl-4">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                      {ordered.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className={`relative py-2 ${
                            idx < ordered.length - 1 ? "border-b border-dashed border-gray-200" : ""
                          }`}
                        >
                          <span
                            className="absolute -left-[10.5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-[1.5px] border-gray-900 box-border"
                            style={{ background: idx === 0 ? "#0A0A0A" : "#fff" }}
                          />
                          <div className="flex items-baseline gap-2 text-[11px] text-gray-500">
                            <span className="font-semibold text-gray-700">{entry.author}</span>
                            <span className="font-mono text-gray-400">{formatMemoTimestamp(entry.createdAt)}</span>
                            {idx === 0 && (
                              <span className="rounded bg-gray-900 px-1.5 py-px text-[10px] font-bold text-white">
                                최신
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-800">
                            {entry.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 고객 이력 섹션 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {selectedMemo.customerName} 이력
                </h3>
                {customerHistory && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Badge variant="default">
                      상담 {customerHistory.summary.consultationCount}건
                    </Badge>
                    <Badge variant="default">
                      거래 {customerHistory.summary.membershipTradeCount}건
                    </Badge>
                  </div>
                )}
              </div>

              {!selectedMemo.customerId ? (
                <p className="text-xs text-gray-400">
                  연결된 고객 프로필이 없어 이력을 조회할 수 없습니다.
                </p>
              ) : isLoadingCustomerHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              ) : customerHistory ? (
                <div className="space-y-3 text-sm">
                  {customerHistory.recentConsultations.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-500 mb-1 uppercase">
                        최근 상담
                      </h4>
                      <ul className="space-y-1">
                        {customerHistory.recentConsultations.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between text-gray-700 gap-3"
                          >
                            <span className="truncate">
                              <Badge variant={c.tradeType === "매수" ? "info" : "error"}>
                                {c.tradeType}
                              </Badge>
                              <span className="ml-1.5">
                                {c.clubName} · {c.membershipName}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {c.registrationDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {customerHistory.recentMembershipTrades.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-500 mb-1 uppercase">
                        최근 거래
                      </h4>
                      <ul className="space-y-1">
                        {customerHistory.recentMembershipTrades.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between text-gray-700 gap-3"
                          >
                            <span className="truncate">
                              <Badge variant={t.tradeType === "매수" ? "info" : "error"}>
                                {t.tradeType}
                              </Badge>
                              <span className="ml-1.5">
                                {t.clubName} · {t.membershipName}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {t.contractDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {customerHistory.recentConsultations.length === 0 &&
                    customerHistory.recentMembershipTrades.length === 0 && (
                      <p className="text-xs text-gray-400">이력이 없습니다.</p>
                    )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">이력을 불러오지 못했습니다.</p>
              )}
            </div>

            {/* 반대 매매 섹션 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  반대 매매 (
                  {selectedMemo.tradeType === "매수" ? "매도" : "매수"}){" "}
                  {!isLoadingRelated && (
                    <span className="text-gray-400 font-normal">
                      {relatedMemos.length}건
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={relatedFilterDone}
                    onChange={(e) => setRelatedFilterDone(e.target.value as "" | "done" | "notDone")}
                    className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white"
                  >
                    <option value="">전체</option>
                    <option value="notDone">진행중</option>
                    <option value="done">완료</option>
                  </select>
                  <div className="flex gap-1">
                    {(["date", "price"] as const).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => setRelatedSort(sort)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          relatedSort === sort
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {sort === "date" ? "날짜순" : "가격순"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isLoadingRelated ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">조회 중...</span>
                </div>
              ) : sortedRelatedMemos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">
                    반대 매매 데이터가 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedRelatedMemos.map((related) => (
                    <div
                      key={related.id}
                      className={`rounded-lg border p-3 ${
                        related.isDone ? "opacity-60" : ""
                      } ${
                        related.tradeType === "매수"
                          ? "border-blue-100"
                          : "border-red-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              related.tradeType === "매수" ? "info" : "error"
                            }
                          >
                            {related.tradeType}
                          </Badge>
                          <span className="font-medium text-sm text-gray-900">
                            {related.customerName}
                          </span>
                          {related.membershipName && (
                            <span className="text-xs text-gray-500">
                              {related.membershipName}
                            </span>
                          )}
                          {related.isDone && (
                            <Badge variant="success">완료</Badge>
                          )}
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={related.isDone}
                            onChange={() => handleToggleDone(related)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500">완료</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <div>
                          <span className="text-gray-500">제시가: </span>
                          <span className="text-gray-800">
                            {formatPrice(related.offerPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">희망가: </span>
                          <span className="text-gray-800">
                            {formatPrice(related.desiredPrice)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                        {related.registrationDate && (
                          <span>{related.registrationDate}</span>
                        )}
                        {(() => {
                          const latest = related.notes?.entries?.[
                            related.notes.entries.length - 1
                          ];
                          if (!latest?.content) return null;
                          return (
                            <>
                              <span>·</span>
                              <span className="text-gray-500 truncate max-w-[200px]">
                                {latest.content}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="상담일지 삭제"
        message={`"${deleteTarget?.customerName}" 고객의 상담일지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />

      <ActionReasonModal
        open={!!reasonModal}
        action={reasonModal ? "REOPEN" : null}
        submitting={reasonSubmitting}
        onCancel={() => setReasonModal(null)}
        onConfirm={async (reason) => {
          if (!reasonModal) return;
          setReasonSubmitting(true);
          const target = rawMemos.find((m) => m.id === reasonModal.memoId);
          if (target) {
            const ok = await runApprovalAction(target, "REOPEN", reason);
            if (ok) setReasonModal(null);
          }
          setReasonSubmitting(false);
        }}
      />
    </div>
  );
}
