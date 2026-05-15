"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  MessageSquare,
  Edit3,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import {
  PageLoading,
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  ConfirmModal,
  Badge,
  ClubSearchSelect,
} from "@heritage-dx/ui";
import {
  useConsultationAdminRepository,
  useAdminRepositories,
  useClubRepository,
  useConsultationRepository,
} from "@heritage-dx/api";
import type {
  AdminConsultationAction,
  Consultation,
  ConsultationNoteEntry,
  Club,
  Pagination,
  Settlement,
  SettlementUpdateInput,
} from "@heritage-dx/types";
import {
  buildClubMembershipPair,
  canDeleteConsultation,
  isConsultationCompleted,
  useTopClubs,
  type ApprovalStatus,
} from "@heritage-dx/store";
import type { ConsultationAiResponse } from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { ActionReasonModal } from "@/components/approval/ActionReasonModal";
import MatchedCustomerCard from "@/components/trade-memos/MatchedCustomerCard";

function buildMemoEntries(memo: Consultation): ConsultationNoteEntry[] {
  return Array.isArray(memo.notes?.entries) ? memo.notes.entries : [];
}

function formatMemoTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const mo = pad(d.getMonth() + 1);
    const da = pad(d.getDate());
    const hr = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${mo}-${da} ${hr}:${mi}`;
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

function getProgressStatusInfo(progressStatus: string) {
  switch (progressStatus) {
    case "DEPOSIT_REVIEW":
      return { label: "계약금 검토중", dotClass: "bg-blue-400", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
    case "DOCUMENT_AND_BALANCE_IN_PROGRESS":
      return { label: "서류·잔금 진행", dotClass: "bg-emerald-400", pillClass: "bg-green-50 text-green-700 border-green-200" };
    case "BALANCE_REVIEW":
      return { label: "잔금 검토중", dotClass: "bg-blue-400", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
    case "TAX_IN_PROGRESS":
      return { label: "세무신고 진행", dotClass: "bg-sky-400", pillClass: "bg-sky-50 text-sky-700 border-sky-200" };
    case "TAX_REVIEW":
      return { label: "세무 검토중", dotClass: "bg-blue-400", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
    case "TRADE_COMPLETED":
    case "COMPLETED":
      return { label: "거래 완료", dotClass: "bg-emerald-600", pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    // backwards compat
    case "PENDING_DEPOSIT":
      return { label: "계약금 검토중", dotClass: "bg-blue-400", pillClass: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { label: "상담중", dotClass: "bg-amber-400", pillClass: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

const formatSettlementAmount = (v: number | null | undefined) => {
  if (!v) return "-";
  return formatPrice(v);
};

const entityTypeLabel = (v: string | null | undefined) => {
  if (v === "TAXABLE_CORP") return "법인(과세)";
  if (v === "NON_TAXABLE_CORP") return "법인(비과세)";
  if (v === "INDIVIDUAL") return "개인";
  return v || "-";
};

const MAX_AI_LENGTH = 2000;

export default function ConsultationsPage() {
  const consultationsRepo = useConsultationAdminRepository();
  const settlementsRepo = useAdminRepositories().settlements;
  const generalConsultationRepo = useConsultationRepository();
  const clubsRepo = useClubRepository();
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
  const [filterApproval, setFilterApproval] = useState<"" | ApprovalStatus>("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [reasonModal, setReasonModal] = useState<{ memoId: string; action: string } | null>(null);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

  const clubsRef = useRef<Club[]>(clubs);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Consultation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consultation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 거래 현황 모달
  const [selectedMemo, setSelectedMemo] = useState<Consultation | null>(null);
  const [relatedMemos, setRelatedMemos] = useState<Consultation[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [relatedSort, setRelatedSort] = useState<"date" | "price">("date");
  const [relatedOppositeTab, setRelatedOppositeTab] = useState<"매수" | "매도">("매수");
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // 입출금표
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false);
  const [settlementEditMode, setSettlementEditMode] = useState(false);
  const [settlementDraft, setSettlementDraft] = useState<Partial<SettlementUpdateInput>>({});
  const [isSavingSettlement, setIsSavingSettlement] = useState(false);

  // 추가 Drawer 탭
  const [addDrawerTab, setAddDrawerTab] = useState<"ai" | "manual">("manual");
  // AI 입력 상태
  const [aiText, setAiText] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { topClubCodes: topClubCodesForm, isFavorite: isClubFavorite, toggleFavorite: toggleClubFavorite, trackSelection: trackClubSelection } = useTopClubs(clubs, 5);

  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // "/" 단축키로 검색창 포커스
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // AI textarea 자동 높이
  useLayoutEffect(() => {
    const el = aiTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 288)}px`;
  }, [aiText]);

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
    setAiText("");
    setAiError(null);
    setAddDrawerTab("manual");
  };

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 폼: 골프장 선택 시 회원권 목록 로드
  useEffect(() => {
    if (!formClubCode || formClubCode === "__manual__") {
      setFormMemberships([]);
      return;
    }
    clubsRepo.getOne(formClubCode).then((res) => {
      if (res.success && res.data) {
        setForm((f) => ({ ...f, clubId: res.data!.id || "", clubName: res.data!.name }));
        const mems = (res.data.memberships ?? []).map((m) => ({ id: m.id, type: m.membershipType, name: m.membershipName || m.membershipType }));
        setFormMemberships(mems);
        const currentType = formRef.current.membershipType;
        if (currentType) {
          const matched = mems.find((m) => m.id === formRef.current.membershipId || m.name === currentType || m.type === currentType);
          if (!matched) setManualMembershipInput(true);
          else setManualMembershipInput(false);
        } else {
          setManualMembershipInput(false);
        }
      }
    }).catch(console.error);
  }, [formClubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 클라이언트 필터: 날짜 범위
  const displayMemos = useMemo(() => {
    let result = rawMemos;
    if (dateFrom) result = result.filter((m) => m.registrationDate && m.registrationDate >= dateFrom);
    if (dateTo) result = result.filter((m) => m.registrationDate && m.registrationDate <= dateTo);
    return result;
  }, [rawMemos, dateFrom, dateTo]);

  const loadMemos = useCallback(async () => {
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
      const response = await consultationsRepo.getAll({
        page,
        limit: 20,
        search: searchQuery || undefined,
        tradeType: filterType || undefined,
        sort: "registrationDate",
        order: sortOrder === "latest" ? "DESC" : "ASC",
        approvalStatus: filterApproval || undefined,
      });
      if (response.success && response.data) {
        const fresh = response.data.trades || [];
        if (page === 1) {
          setRawMemos(fresh);
        } else {
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
  }, [page, searchQuery, filterType, filterApproval, sortOrder, preloadedMemos, clearPreloadedMemos]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  // IntersectionObserver 인피니트 스크롤
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && pagination?.hasNext && !isLoading) setPage((p) => p + 1);
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
        ...buildClubMembershipPair({ clubId: form.clubId, clubName: form.clubName, membershipId: form.membershipId, membershipType: form.membershipType }),
        tradeType: form.tradeType,
        customerName: form.customerName,
        contact: form.contact,
        offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
        offerPriceNote: form.offerPriceNote || null,
        desiredPrice: form.desiredPrice ? Number(form.desiredPrice) : null,
        desiredPriceNote: form.desiredPriceNote || null,
        depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
        accountNumber: form.accountNumber || null,
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
      const response = await consultationsRepo.update(editingMemo.id, {
        ...buildClubMembershipPair({ clubId: form.clubId, clubName: form.clubName, membershipId: form.membershipId, membershipType: form.membershipType }),
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
      notes: "",
      registrationDate: trade.registrationDate || new Date().toISOString().split("T")[0],
      tradeDate: trade.tradeDate || "",
      remarks: trade.remarks || "",
    });
    const matched = clubs.find((c) => c.name === trade.clubName);
    if (matched) {
      setFormClubCode(matched.code);
      setManualClubInput(false);
    } else {
      setFormClubCode("__manual__");
      setManualClubInput(true);
    }
    setManualMembershipInput(false);
    setAddDrawerTab("manual");
  };

  const runApprovalAction = async (
    memo: Consultation,
    action: string,
    reason?: string,
  ) => {
    setApprovalBusyId(memo.id);
    try {
      const response = await consultationsRepo.approvalAction(memo.id, { action: action as AdminConsultationAction, reason });
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

  const closeDetailModal = () => {
    setSelectedMemo(null);
    setNoteInput("");
    setSettlement(null);
    setSettlementEditMode(false);
    setSettlementDraft({});
  };

  const loadSettlement = async (memo: Consultation) => {
    const sid = memo.settlementId;
    if (!sid) {
      setSettlement(null);
      return;
    }
    setIsLoadingSettlement(true);
    try {
      const res = await settlementsRepo.getOne(sid);
      if (res.success && res.data) setSettlement(res.data);
      else setSettlement(null);
    } catch {
      setSettlement(null);
    } finally {
      setIsLoadingSettlement(false);
    }
  };

  const handleSaveSettlement = async () => {
    if (!settlement?.id) return;
    setIsSavingSettlement(true);
    try {
      const res = await settlementsRepo.update(settlement.id, settlementDraft as SettlementUpdateInput);
      if (res.success && res.data) {
        setSettlement(res.data);
        setSettlementEditMode(false);
        setSettlementDraft({});
      } else {
        alert("입출금표 저장에 실패했습니다.");
      }
    } catch {
      alert("입출금표 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingSettlement(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedMemo?.id || !noteInput.trim()) return;
    setIsAddingNote(true);
    try {
      const response = await consultationsRepo.addNote(selectedMemo.id, { content: noteInput.trim() });
      if (response.success && response.data) {
        const updated = response.data;
        setSelectedMemo(updated);
        setRawMemos((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        setNoteInput("");
      } else {
        alert(response.error ?? "메모 추가에 실패했습니다.");
      }
    } catch {
      alert("메모 추가 중 오류가 발생했습니다.");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleRowClick = async (memo: Consultation) => {
    setSelectedMemo(memo);
    setRelatedMemos([]);
    setIsLoadingRelated(true);
    setRelatedSort("date");
    setSettlement(null);
    setSettlementEditMode(false);
    setSettlementDraft({});
    const oppositeType = memo.tradeType === "매수" ? "매도" : "매수";
    setRelatedOppositeTab(oppositeType);

    const [related] = await Promise.all([
      consultationsRepo
        .getAll({ search: memo.clubName, tradeType: oppositeType, limit: 100 })
        .then((res) => res.data?.trades?.filter((t: Consultation) => t.clubName === memo.clubName) || [])
        .catch(() => [] as Consultation[]),
      loadSettlement(memo),
    ]);

    setRelatedMemos(related);
    setIsLoadingRelated(false);
  };

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

  const sortedRelatedMemos = useMemo(() => {
    const filtered = relatedMemos.filter((m) => m.tradeType === relatedOppositeTab);
    if (relatedSort === "price") {
      return [...filtered].sort((a, b) => (Number(b.offerPrice) || 0) - (Number(a.offerPrice) || 0));
    }
    return [...filtered].sort((a, b) => (b.registrationDate || "").localeCompare(a.registrationDate || ""));
  }, [relatedMemos, relatedSort, relatedOppositeTab]);

  const buyCount = useMemo(() => relatedMemos.filter((m) => m.tradeType === "매수").length, [relatedMemos]);
  const sellCount = useMemo(() => relatedMemos.filter((m) => m.tradeType === "매도").length, [relatedMemos]);

  // AI 폼 채우기
  const handleAiSubmit = async () => {
    const trimmed = aiText.trim();
    if (!trimmed || aiSubmitting) return;
    setAiError(null);
    setAiSubmitting(true);
    try {
      const response = await generalConsultationRepo.createDraftFromText({ text: trimmed });
      if (response.success && response.data) {
        const draft = response.data.draft;
        const clubMatch = response.data.matches?.club;
        const memMatch = response.data.matches?.membership;
        // form 채우기
        setForm((f) => ({
          ...f,
          clubName: draft.club || f.clubName,
          membershipType: draft.membership || f.membershipType,
          membershipName: draft.membership || f.membershipName,
          tradeType: (draft.tradeType as "매도" | "매수") || f.tradeType,
          customerName: draft.customerName || f.customerName,
          contact: draft.contact || f.contact,
          desiredPrice: draft.desiredPrice != null ? String(draft.desiredPrice) : f.desiredPrice,
        }));
        // 골프장 ID 매칭
        if (clubMatch?.matched && clubMatch.id) {
          const matchedClub = clubs.find((c) => c.id === clubMatch.id || c.name === clubMatch.name);
          if (matchedClub) {
            setFormClubCode(matchedClub.code);
            setManualClubInput(false);
          } else {
            setFormClubCode("__manual__");
            setManualClubInput(true);
          }
        } else if (draft.club) {
          setFormClubCode("__manual__");
          setManualClubInput(true);
        }
        setAiText("");
        setAddDrawerTab("manual");
      } else {
        setAiError(response.error ?? "AI 추출에 실패했습니다.");
      }
    } catch {
      setAiError("네트워크 오류가 발생했습니다.");
    } finally {
      setAiSubmitting(false);
    }
  };

  // URL 파라미터 자동 오픈 처리는 위에서 이미 처리됨

  if (isLoading && rawMemos.length === 0) return <PageLoading />;

  const typeCounts = {
    all: pagination?.total ?? displayMemos.length,
    buy: displayMemos.filter((m) => m.tradeType === "매수").length,
    sell: displayMemos.filter((m) => m.tradeType === "매도").length,
  };

  return (
    <div className="p-6 pb-12 max-w-[1480px] mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-flex-start gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="w-[18px] h-[18px] text-gray-900" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold tracking-[0.14em] text-gray-400 uppercase">
            Consultation Log
          </span>
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">상담일지</h1>
            {pagination && (
              <span className="text-[12.5px] font-medium text-gray-500 font-mono">
                총 {pagination.total}건
              </span>
            )}
          </div>
          <span className="text-[12.5px] text-gray-500">모든 상담일지를 관리합니다</span>
        </div>
      </div>

      {/* 메인 패널 */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        {/* 패널 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-[13.5px] font-semibold text-gray-900">상담 목록</h2>
          <Button
            size="sm"
            onClick={() => { resetForm(); setEditingMemo(null); setShowAddDrawer(true); }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            새 상담일지 작성
          </Button>
        </div>

        {/* 검색 행 */}
        <div className="px-5 py-[18px] border-b border-gray-100">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="이 페이지에서 검색 - 고객명, 연락처, 골프장, 회원권 이름..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full h-11 pl-11 pr-14 text-[13.5px] text-gray-900 bg-gray-50 border border-gray-200 rounded-[10px] outline-none transition-all focus:bg-white focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(10,10,10,0.05)] placeholder:text-gray-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-[5px] shadow-[0_1px_0_#F3F4F6] font-mono">
              /
            </span>
          </div>
        </div>

        {/* 필터 행 */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 유형 pill */}
            {([["", "전체"], ["매수", "매수"], ["매도", "매도"]] as const).map(([val, label]) => (
              <button
                key={val || "all"}
                onClick={() => { setFilterType(val); setPage(1); }}
                className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-semibold rounded-full border transition-all cursor-pointer ${
                  filterType === val
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                <span>{label}</span>
                {val === "" && (
                  <span className={`text-[11.5px] font-bold px-2 py-px rounded-full font-mono min-w-[24px] text-center ${filterType === "" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {pagination?.total ?? rawMemos.length}
                  </span>
                )}
                {val === "매수" && (
                  <span className={`text-[11.5px] font-bold px-2 py-px rounded-full font-mono min-w-[24px] text-center ${filterType === "매수" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {rawMemos.filter((m) => m.tradeType === "매수").length}
                  </span>
                )}
                {val === "매도" && (
                  <span className={`text-[11.5px] font-bold px-2 py-px rounded-full font-mono min-w-[24px] text-center ${filterType === "매도" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {rawMemos.filter((m) => m.tradeType === "매도").length}
                  </span>
                )}
              </button>
            ))}

            <span className="w-px h-5 bg-gray-200 mx-1" />

            {/* 승인 상태 */}
            <select
              value={filterApproval}
              onChange={(e) => { setFilterApproval(e.target.value as "" | ApprovalStatus); setPage(1); }}
              className="h-8 pl-3 pr-7 text-[12.5px] text-gray-900 bg-white border border-gray-200 rounded-lg outline-none cursor-pointer hover:border-gray-400 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="">승인 상태 전체</option>
              <option value="DEPOSIT_APPROVED">승인완료</option>
              <option value="PENDING_DEPOSIT">승인요청</option>
              <option value="IN_CONSULTATION">요청됨</option>
            </select>

            {/* 날짜 범위 */}
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-[12.5px] text-gray-900 bg-transparent border-none outline-none w-[110px]"
                />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-[12.5px] text-gray-900 bg-transparent border-none outline-none w-[110px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[13px] text-gray-500 whitespace-nowrap">
              총 <span className="font-bold text-gray-900 font-mono">{pagination?.total ?? displayMemos.length}</span>건
            </span>
            <span className="w-px h-5 bg-gray-200" />
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as "latest" | "oldest"); setPage(1); setRawMemos([]); }}
              className="h-8 pl-3 pr-7 text-[12.5px] text-gray-900 bg-white border border-gray-200 rounded-lg outline-none cursor-pointer hover:border-gray-400 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          {isLoading && rawMemos.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">불러오는 중...</span>
            </div>
          ) : displayMemos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-[18px] h-[18px] text-gray-400" />
              </div>
              <p className="text-[13.5px] font-semibold text-gray-500 mb-1">검색 결과가 없습니다</p>
              <p className="text-[12.5px] text-gray-400">다른 검색어나 필터를 시도해 보세요</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm" style={{ minWidth: 1100 }}>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 text-center whitespace-nowrap">유형</th>
                    <th className="py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">상태</th>
                    <th className="py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">골프장</th>
                    <th className="hidden md:table-cell py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">회원권</th>
                    <th className="py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">고객명</th>
                    <th className="hidden md:table-cell py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">연락처</th>
                    <th className="hidden md:table-cell py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap" style={{ maxWidth: 220 }}>메모</th>
                    <th className="py-3 px-3 text-right text-[11.5px] font-medium text-gray-500 whitespace-nowrap">매시가</th>
                    <th className="hidden md:table-cell py-3 px-3 text-right text-[11.5px] font-medium text-gray-500 whitespace-nowrap">희망가</th>
                    <th className="hidden md:table-cell py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">등록일</th>
                    <th className="hidden md:table-cell py-3 px-3 text-left text-[11.5px] font-medium text-gray-500 whitespace-nowrap">작성자</th>
                    <th className="hidden md:table-cell py-3 px-3 text-center text-[11.5px] font-medium text-gray-500 whitespace-nowrap">승인 요청</th>
                    <th className="py-3 px-3 text-center text-[11.5px] font-medium text-gray-500 whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {displayMemos.map((trade) => {
                    const statusInfo = getProgressStatusInfo(trade.progressStatus || trade.approvalStatus || "IN_CONSULTATION");
                    const approvalPill = statusInfo;
                    const entries = buildMemoEntries(trade);
                    const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
                    const isDone = isConsultationCompleted(trade);
                    return (
                      <tr
                        key={trade.id}
                        className={`border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${isDone ? "opacity-50" : ""}`}
                        onClick={() => handleRowClick(trade)}
                      >
                        {/* 유형 */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center min-w-[44px] h-[22px] px-2 rounded text-[11.5px] font-semibold ${trade.tradeType === "매수" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {trade.tradeType || "-"}
                          </span>
                        </td>
                        {/* 상태 */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600">
                            <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        {/* 골프장 */}
                        <td className="py-3.5 px-3 font-medium text-gray-800 whitespace-nowrap text-[13px]">
                          {trade.clubName}
                        </td>
                        {/* 회원권 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-gray-600 whitespace-nowrap text-[13px]">
                          {trade.membershipName}
                        </td>
                        {/* 고객명 */}
                        <td className="py-3.5 px-3 font-medium text-gray-900 whitespace-nowrap text-[13px]">
                          {trade.customerName}
                        </td>
                        {/* 연락처 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-gray-500 whitespace-nowrap font-mono text-[12.5px]">
                          {trade.contact}
                        </td>
                        {/* 메모 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-gray-600" style={{ maxWidth: 220 }}>
                          {latestEntry ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate text-[12.5px]">{latestEntry.content}</span>
                              <span className="flex-shrink-0 text-[11.5px] text-gray-400 font-mono">
                                {formatMemoTimestamp(latestEntry.createdAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[12.5px]">-</span>
                          )}
                        </td>
                        {/* 매시가 */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="font-mono text-[13px] font-medium text-gray-900">
                            {formatPrice(trade.offerPrice)}
                          </span>
                        </td>
                        {/* 희망가 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="font-mono text-[13px] font-medium text-gray-900">
                            {formatPrice(trade.desiredPrice)}
                          </span>
                        </td>
                        {/* 등록일 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-gray-400 whitespace-nowrap font-mono text-[12.5px]">
                          {trade.registrationDate || "-"}
                        </td>
                        {/* 작성자 */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-gray-500 whitespace-nowrap text-[13px]">
                          {trade.createdByName || "-"}
                        </td>
                        {/* 진행 상태 pill */}
                        <td className="hidden md:table-cell py-3.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-[3px] rounded text-[11px] font-semibold border ${approvalPill.pillClass}`}>
                            {approvalPill.label}
                          </span>
                        </td>
                        {/* 관리 */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(trade)}
                              className="text-[12.5px] font-medium text-gray-500 hover:text-gray-900 hover:underline underline-offset-2 transition-colors"
                            >
                              수정
                            </button>
                            {canDeleteConsultation(user, trade) && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(trade)}
                                className="text-[12.5px] font-medium text-red-500 hover:text-red-700 hover:underline underline-offset-2 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div ref={sentinelRef} className="h-1" />
              {pagination?.hasNext && isLoading && (
                <div className="py-4 text-center text-xs text-gray-400">불러오는 중...</div>
              )}
            </>
          )}
        </div>

        {/* 패널 푸터 */}
        {!pagination?.hasNext && rawMemos.length > 0 && (
          <div className="py-3.5 px-5 border-t border-gray-100 text-center bg-gray-50/60">
            <span className="text-[12px] text-gray-400">
              모든 항목을 불러왔습니다 <span className="font-semibold text-gray-500 font-mono">({rawMemos.length}건)</span>
            </span>
          </div>
        )}
      </div>

      {/* ─── 거래 현황 중앙 모달 ─── */}
      {!!selectedMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) closeDetailModal(); }}>
          <div
            className="relative bg-gray-50 rounded-2xl w-full max-h-[calc(100vh-48px)] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
            style={{ maxWidth: 880 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="px-6 py-[18px] border-b border-gray-200 bg-white flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="text-[19px] font-extrabold text-gray-900 tracking-tight">{selectedMemo.clubName} 거래 현황</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-gray-500">
                  <span>{selectedMemo.membershipName}</span>
                  <span className="text-gray-300">·</span>
                  <span className={`inline-flex items-center justify-center px-2 h-[22px] rounded text-[11.5px] font-semibold ${selectedMemo.tradeType === "매수" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {selectedMemo.tradeType}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span>{selectedMemo.customerName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-[18px] flex flex-col gap-3.5">
              {/* Card 1: 현재 상담일지 */}
              {(() => {
                const entries = buildMemoEntries(selectedMemo);
                const ordered = [...entries].reverse();
                const statusInfo = getProgressStatusInfo(selectedMemo.progressStatus || selectedMemo.approvalStatus || "IN_CONSULTATION");
                const isDone = isConsultationCompleted(selectedMemo);
                const hasDeposit = !!selectedMemo.depositAmount && selectedMemo.depositAmount > 0;
                const docReady = !!selectedMemo.settlementDocumentGenerated;
                const progressStatus = selectedMemo.progressStatus || selectedMemo.approvalStatus || "IN_CONSULTATION";
                return (
                  <div className={`bg-white border rounded-2xl overflow-hidden flex-shrink-0 ${isDone ? "border-emerald-200 bg-emerald-50/30" : selectedMemo.tradeType === "매수" ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30"}`}>
                    <div className="px-[18px] py-3.5 border-b border-transparent flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">현재 상담일지</h4>
                      <span className={`inline-flex items-center justify-center min-w-[40px] h-[22px] px-2 rounded text-[11.5px] font-bold ${selectedMemo.tradeType === "매수" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {selectedMemo.tradeType}
                      </span>
                    </div>
                    <div className="px-[18px] pt-1 pb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-[19px] font-extrabold text-gray-900 tracking-tight">{selectedMemo.customerName}</h3>
                      <span className="text-[13px] text-gray-500 font-medium">{selectedMemo.membershipName}</span>
                    </div>
                    <div className="px-[18px] pb-3.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-gray-600">
                        <span className={`w-[6px] h-[6px] rounded-full ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 px-[18px] py-4 border-t border-black/5">
                      {[
                        { label: "골프장", value: selectedMemo.clubName },
                        { label: "연락처", value: selectedMemo.contact, mono: true },
                        { label: "작성자", value: selectedMemo.createdByName },
                        { label: "매시가", value: formatPrice(selectedMemo.offerPrice), price: true },
                        { label: "희망가", value: formatPrice(selectedMemo.desiredPrice), price: true },
                        { label: "등록일", value: selectedMemo.registrationDate, mono: true },
                      ].map(({ label, value, mono, price }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.04em]">{label}</span>
                          <span className={`text-[13.5px] font-semibold text-gray-900 break-all ${mono ? "font-mono text-[13px] font-medium" : ""} ${price ? "text-[15px] font-bold font-mono" : ""} ${!value || value === "-" ? "text-gray-300 font-normal" : ""}`}>
                            {value || "-"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 메모 히스토리 */}
                    <div className="mx-[18px] mb-[18px] mt-1 p-4 bg-white/85 border border-gray-200 rounded-[10px]">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gray-900">
                          <MessageSquare className="w-3.5 h-3.5" />
                          메모 히스토리
                        </div>
                        <span className="text-[11.5px] text-gray-500 font-mono">총 {entries.length}건</span>
                      </div>
                      {/* 메모 추가 입력 */}
                      <div className="mb-3">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="메모를 입력하세요..."
                          rows={2}
                          className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12.5px] leading-[1.55] text-gray-800 outline-none focus:border-gray-900 focus:bg-white"
                        />
                        <div className="mt-1.5 flex justify-end">
                          <button
                            type="button"
                            disabled={!noteInput.trim() || isAddingNote}
                            onClick={() => void handleAddNote()}
                            className="inline-flex h-7 items-center gap-1 rounded-md bg-gray-900 px-3 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            {isAddingNote ? "추가 중..." : "메모 추가"}
                          </button>
                        </div>
                      </div>
                      {ordered.length === 0 ? (
                        <p className="text-[12.5px] text-gray-400 text-center py-2">작성된 메모가 없습니다</p>
                      ) : (
                        <div className="relative pl-4">
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                          {ordered.map((entry, idx) => (
                            <div key={entry.id} className={`relative py-2 ${idx < ordered.length - 1 ? "border-b border-dashed border-gray-200" : ""}`}>
                              <span
                                className="absolute -left-[10.5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-[1.5px] box-border"
                                style={{ background: idx === 0 ? "#111827" : "#fff", borderColor: idx === 0 ? "#111827" : "#9CA3AF" }}
                              />
                              <div className="flex items-baseline gap-2 text-[11px] text-gray-500 mb-0.5">
                                <span className="font-semibold text-gray-700">{entry.author}</span>
                                <span className="font-mono text-gray-400">{formatMemoTimestamp(entry.createdAt)}</span>
                                {idx === 0 && (
                                  <span className="rounded bg-gray-900 px-1.5 py-px text-[9.5px] font-bold text-white tracking-[0.02em]">최신</span>
                                )}
                              </div>
                              <p className="text-[13px] text-gray-800 leading-[1.55] whitespace-pre-wrap break-words mt-0.5">{entry.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 영역 */}
                    {progressStatus !== "TRADE_COMPLETED" && progressStatus !== "COMPLETED" && (
                      <div className="px-[18px] pb-[18px] flex items-center gap-2 flex-wrap">
                        {(progressStatus === "IN_CONSULTATION" || progressStatus === "DEPOSIT_REVIEW" || progressStatus === "PENDING_DEPOSIT") && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id || !hasDeposit || !docReady}
                            onClick={() => void runApprovalAction(selectedMemo, "CONFIRM_DEPOSIT")}
                            title={!hasDeposit ? "계약금 입력 후 확인 가능" : !docReady ? "입출금표 문서 생성 완료가 필요합니다" : "계약금 확인 완료 - 거래 자동 생성"}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {approvalBusyId === selectedMemo.id ? "처리 중…" : "계약금 확인 완료"}
                          </button>
                        )}
                        {progressStatus === "DEPOSIT_REVIEW" && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id}
                            onClick={() => setReasonModal({ memoId: selectedMemo.id, action: "REOPEN" })}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                          >
                            다시 열기
                          </button>
                        )}
                        {(progressStatus === "DOCUMENT_AND_BALANCE_IN_PROGRESS" || progressStatus === "BALANCE_REVIEW") && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id}
                            onClick={() => void runApprovalAction(selectedMemo, "CONFIRM_DOCUMENT_AND_BALANCE")}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {approvalBusyId === selectedMemo.id ? "처리 중…" : "잔금·서류 확인 완료"}
                          </button>
                        )}
                        {progressStatus === "BALANCE_REVIEW" && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id}
                            onClick={() => setReasonModal({ memoId: selectedMemo.id, action: "REQUEST_REREVIEW" })}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                          >
                            재확인 요청
                          </button>
                        )}
                        {(progressStatus === "TAX_IN_PROGRESS" || progressStatus === "TAX_REVIEW") && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id}
                            onClick={() => void runApprovalAction(selectedMemo, "COMPLETE_TAX_FILING")}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {approvalBusyId === selectedMemo.id ? "처리 중…" : "세무 처리 완료"}
                          </button>
                        )}
                        {progressStatus === "TAX_REVIEW" && (
                          <button
                            type="button"
                            disabled={approvalBusyId === selectedMemo.id}
                            onClick={() => setReasonModal({ memoId: selectedMemo.id, action: "REQUEST_REREVIEW" })}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                          >
                            재확인 요청
                          </button>
                        )}
                        {selectedMemo.linkedTradeId && (
                          <a
                            href={`/trade-records?highlight=${selectedMemo.linkedTradeId}`}
                            className="px-3 py-1.5 text-[12.5px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            거래 보기
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Card 1-b: 입출금표 */}
              {(selectedMemo.settlementId || selectedMemo.settlementDocumentGenerated) && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                  <div className="px-[18px] py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">입출금표</h4>
                    <div className="flex items-center gap-2">
                      {settlementEditMode ? (
                        <>
                          <button
                            type="button"
                            disabled={isSavingSettlement}
                            onClick={() => { setSettlementEditMode(false); setSettlementDraft({}); }}
                            className="px-3 py-1 text-[12px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            disabled={isSavingSettlement}
                            onClick={() => void handleSaveSettlement()}
                            className="px-3 py-1 text-[12px] font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                          >
                            {isSavingSettlement ? "저장 중…" : "저장"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!settlement || isLoadingSettlement}
                          onClick={() => { if (settlement) { setSettlementDraft({}); setSettlementEditMode(true); } }}
                          className="px-3 py-1 text-[12px] font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          수정
                        </button>
                      )}
                    </div>
                  </div>
                  {isLoadingSettlement ? (
                    <div className="flex items-center justify-center px-[18px] py-8 text-[13px] text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      불러오는 중…
                    </div>
                  ) : !settlement ? (
                    <div className="px-[18px] py-6 text-center text-[12.5px] text-gray-400">입출금표가 없습니다</div>
                  ) : (
                    <div className="px-[18px] py-4 flex flex-col gap-4">
                      {/* 헤더 */}
                      <div>
                        <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.06em] mb-2">헤더</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "회원권명", field: "membershipName", value: settlement.membershipName },
                            { label: "거래일", field: "tradeDate", value: settlement.tradeDate },
                            { label: "계약금액", field: "salesContractAmount", value: formatSettlementAmount(settlement.salesContractAmount), isNumber: true, rawKey: "salesContractAmount" },
                            { label: "비고", field: "specialNotes", value: settlement.specialNotes },
                          ].map(({ label, field, value, isNumber, rawKey }) => (
                            <div key={field} className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.04em]">{label}</span>
                              {settlementEditMode ? (
                                <input
                                  type={isNumber ? "number" : "text"}
                                  defaultValue={isNumber ? (settlement[rawKey as keyof Settlement] as number | null) ?? "" : (value ?? "")}
                                  onChange={(e) => setSettlementDraft((d) => ({ ...d, [rawKey ?? field]: isNumber ? (e.target.value ? Number(e.target.value) : null) : e.target.value || null }))}
                                  className="h-7 px-2 text-[12.5px] border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                                />
                              ) : (
                                <span className="text-[13px] font-semibold text-gray-900">{value || "-"}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 매도자 */}
                      <div>
                        <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.06em] mb-2">매도자</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: "성명", field: "sellName", value: settlement.sellName },
                            { label: "연락처", field: "sellPhone", value: settlement.sellPhone },
                            { label: "구분", field: "sellEntityType", value: entityTypeLabel(settlement.sellEntityType) },
                            { label: "회원권 금액", field: "sellMembershipAmount", value: formatSettlementAmount(settlement.sellMembershipAmount), isNumber: true, rawKey: "sellMembershipAmount" },
                            { label: "계약금", field: "sellDepositAmount", value: formatSettlementAmount(settlement.sellDepositAmount), isNumber: true, rawKey: "sellDepositAmount" },
                            { label: "잔금", field: "sellBalanceAmount", value: formatSettlementAmount(settlement.sellBalanceAmount), isNumber: true, rawKey: "sellBalanceAmount" },
                          ].map(({ label, field, value, isNumber, rawKey }) => (
                            <div key={field} className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.04em]">{label}</span>
                              {settlementEditMode && isNumber ? (
                                <input
                                  type="number"
                                  defaultValue={(settlement[rawKey as keyof Settlement] as number | null) ?? ""}
                                  onChange={(e) => setSettlementDraft((d) => ({ ...d, [rawKey ?? field]: e.target.value ? Number(e.target.value) : null }))}
                                  className="h-7 px-2 text-[12.5px] border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                                />
                              ) : settlementEditMode ? (
                                <input
                                  type="text"
                                  defaultValue={value ?? ""}
                                  onChange={(e) => setSettlementDraft((d) => ({ ...d, [field]: e.target.value || null }))}
                                  className="h-7 px-2 text-[12.5px] border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                                />
                              ) : (
                                <span className="text-[13px] font-semibold text-gray-900">{value || "-"}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {settlement.sellCommissionDeducted != null && (
                          <p className="mt-1.5 text-[11.5px] text-gray-500">
                            수수료 공제: <span className="font-semibold">{settlement.sellCommissionDeducted ? "포함" : "미포함"}</span>
                            {settlement.sellCommissionAmount ? ` (${formatSettlementAmount(settlement.sellCommissionAmount)})` : ""}
                          </p>
                        )}
                      </div>
                      {/* 매수자 */}
                      <div>
                        <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.06em] mb-2">매수자</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: "성명", field: "buyName", value: settlement.buyName },
                            { label: "연락처", field: "buyPhone", value: settlement.buyPhone },
                            { label: "구분", field: "buyEntityType", value: entityTypeLabel(settlement.buyEntityType) },
                            { label: "회원권 금액", field: "buyMembershipAmount", value: formatSettlementAmount(settlement.buyMembershipAmount), isNumber: true, rawKey: "buyMembershipAmount" },
                            { label: "계약금", field: "buyDepositAmount", value: formatSettlementAmount(settlement.buyDepositAmount), isNumber: true, rawKey: "buyDepositAmount" },
                            { label: "잔금", field: "buyBalanceAmount", value: formatSettlementAmount(settlement.buyBalanceAmount), isNumber: true, rawKey: "buyBalanceAmount" },
                          ].map(({ label, field, value, isNumber, rawKey }) => (
                            <div key={field} className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-[0.04em]">{label}</span>
                              {settlementEditMode && isNumber ? (
                                <input
                                  type="number"
                                  defaultValue={(settlement[rawKey as keyof Settlement] as number | null) ?? ""}
                                  onChange={(e) => setSettlementDraft((d) => ({ ...d, [rawKey ?? field]: e.target.value ? Number(e.target.value) : null }))}
                                  className="h-7 px-2 text-[12.5px] border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                                />
                              ) : settlementEditMode ? (
                                <input
                                  type="text"
                                  defaultValue={value ?? ""}
                                  onChange={(e) => setSettlementDraft((d) => ({ ...d, [field]: e.target.value || null }))}
                                  className="h-7 px-2 text-[12.5px] border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                                />
                              ) : (
                                <span className="text-[13px] font-semibold text-gray-900">{value || "-"}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {settlement.buyStampTaxIncluded != null && (
                          <p className="mt-1.5 text-[11.5px] text-gray-500">
                            인지세: <span className="font-semibold">{settlement.buyStampTaxIncluded ? "포함" : "미포함"}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card 2: 고객 프로필 */}
              <MatchedCustomerCard
                customerId={selectedMemo.customerId ?? null}
                fallbackName={selectedMemo.customerName}
                fallbackContact={selectedMemo.contact}
              />

              {/* Card 3: 같은 골프장 매물 (반대 포함 전체) */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                <div className="px-[18px] py-3.5 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-gray-900">
                    {selectedMemo.clubName} 매물
                    <span className="ml-1.5 text-[12.5px] text-gray-400 font-normal font-mono">{relatedMemos.length}건</span>
                  </h4>
                  {/* 탭: 매수/매도 */}
                  <div className="inline-flex gap-0.5 p-[3px] bg-gray-100 rounded-lg">
                    {(["매수", "매도"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setRelatedOppositeTab(tab)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-all ${
                          relatedOppositeTab === tab
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span>{tab}</span>
                        <span className={`text-[10.5px] font-bold px-1.5 py-px rounded-full font-mono min-w-[20px] text-center ${
                          relatedOppositeTab === tab ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
                        } ${relatedOppositeTab === tab && tab === "매수" ? "bg-amber-600" : ""} ${relatedOppositeTab === tab && tab === "매도" ? "bg-red-600" : ""}`}>
                          {tab === "매수" ? buyCount : sellCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-[18px] py-3.5">
                  {/* 정렬 */}
                  <div className="flex justify-end mb-2.5">
                    <div className="inline-flex p-[2px] bg-gray-100 rounded-lg">
                      {(["date", "price"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRelatedSort(s)}
                          className={`px-2.5 py-[4px] text-[11.5px] font-semibold rounded-md transition-colors ${relatedSort === s ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          {s === "date" ? "날짜순" : "가격순"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isLoadingRelated ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">조회 중...</span>
                    </div>
                  ) : sortedRelatedMemos.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-gray-200 rounded-[10px]">
                      <p className="text-[12.5px] text-gray-400">{relatedOppositeTab} 거래가 없습니다</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sortedRelatedMemos.map((related) => {
                        const isDoneRelated = isConsultationCompleted(related);
                        const latestRelated = related.notes?.entries?.[related.notes.entries.length - 1];
                        return (
                          <div key={related.id} className={`border border-gray-200 rounded-[10px] p-3.5 bg-white transition-colors hover:border-gray-300 ${isDoneRelated ? "opacity-70" : ""}`}>
                            <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
                              <span className={`inline-flex items-center justify-center min-w-[40px] h-[22px] px-2 rounded text-[11.5px] font-bold ${related.tradeType === "매수" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"} ${isDoneRelated ? "opacity-55" : ""}`}>
                                {related.tradeType}
                              </span>
                              <span className="text-[13.5px] font-bold text-gray-900">{related.customerName}</span>
                              <span className="text-[12px] text-gray-500">{related.membershipName}</span>
                              <div className="ml-auto flex items-center gap-1.5">
                                {(() => { const s = getProgressStatusInfo(related.progressStatus || related.approvalStatus || "IN_CONSULTATION"); return <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-gray-600"><span className={`w-[6px] h-[6px] rounded-full ${s.dotClass}`} />{s.label}</span>; })()}
                                {isDoneRelated && <span className="inline-flex items-center px-2 py-px rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50">완료</span>}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[12px]">
                              {[
                                { lab: "매시가", v: formatPrice(related.offerPrice) },
                                { lab: "희망가", v: formatPrice(related.desiredPrice) },
                                { lab: "연락처", v: related.contact || "-" },
                              ].map(({ lab, v }) => (
                                <div key={lab} className="flex flex-col gap-0.5">
                                  <span className="text-[10.5px] font-medium text-gray-400 uppercase tracking-wider">{lab}</span>
                                  <span className="text-[12.5px] font-semibold text-gray-900 font-mono">{v}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-dashed border-gray-100 text-[11.5px] text-gray-400">
                              <span className="font-mono">{related.registrationDate || ""}</span>
                              {latestRelated?.content && (
                                <>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-gray-500 truncate flex-1">{latestRelated.content}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 새 상담일지 중앙 모달 (AI 탭 + 일반 입력 탭) ─── */}
      {(showAddDrawer || !!editingMemo) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddDrawer(false); setEditingMemo(null); resetForm(); } }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-[16px] font-bold text-gray-900">
                {editingMemo ? "상담일지 수정" : "상담일지 작성"}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddDrawer(false); setEditingMemo(null); resetForm(); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 탭 헤더 */}
            {!editingMemo && (
              <div className="flex items-center border-b border-gray-100 px-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAddDrawerTab("ai")}
                  className={`inline-flex items-center gap-1.5 px-0 mr-6 py-3 text-[13.5px] font-medium border-b-2 -mb-px transition-colors ${addDrawerTab === "ai" ? "text-gray-900 font-bold border-gray-900" : "text-gray-400 border-transparent hover:text-gray-600"}`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${addDrawerTab === "ai" ? "text-violet-600" : "text-gray-400"}`} />
                  AI 입력
                  <span className="inline-flex items-center gap-1 px-2 py-px bg-violet-50 text-violet-700 text-[9.5px] font-bold rounded-full uppercase tracking-wide">BETA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddDrawerTab("manual")}
                  className={`inline-flex items-center gap-1.5 px-0 py-3 text-[13.5px] font-medium border-b-2 -mb-px transition-colors ${addDrawerTab === "manual" ? "text-gray-900 font-bold border-gray-900" : "text-gray-400 border-transparent hover:text-gray-600"}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  일반 입력
                </button>
              </div>
            )}

            {/* 스크롤 가능한 폼 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* AI 탭 */}
              {!editingMemo && addDrawerTab === "ai" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-violet-50 px-2 text-[11px] font-bold uppercase tracking-wide text-violet-700">
                      <Sparkles className="h-3 w-3" />
                      beta
                    </span>
                    <h4 className="text-[14px] font-bold text-gray-900">AI 자연어 입력</h4>
                  </div>
                  <p className="text-[12px] leading-relaxed text-gray-500">
                    한 줄로 적어주세요. AI 가 골프장·회원권·거래유형·고객정보를 추출해 폼을 채워줍니다.
                  </p>
                  <div className="rounded border border-gray-200 bg-gray-50 px-2.5 py-2 text-[11px] leading-relaxed text-gray-500">
                    <p>· 개인/법인 미언급 시 <span className="font-medium text-gray-700">개인</span> 기본.</p>
                    <p>· 매수/매도 미언급 시 <span className="font-medium text-gray-700">매수</span> 기본.</p>
                    <p>· 최대 {MAX_AI_LENGTH.toLocaleString()}자.</p>
                  </div>
                  <textarea
                    ref={aiTextareaRef}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value.slice(0, MAX_AI_LENGTH))}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        void handleAiSubmit();
                      }
                    }}
                    placeholder="예: 남서울 정회원 매수 홍길동 010-1234-5678 희망가 5억"
                    maxLength={MAX_AI_LENGTH}
                    className="block min-h-[6rem] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2.5 text-[13px] leading-[1.55] text-gray-800 outline-none focus:border-gray-900 focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]"
                    style={{ maxHeight: "288px" }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-500">{aiText.length.toLocaleString()} / {MAX_AI_LENGTH.toLocaleString()}</span>
                    <button
                      type="button"
                      disabled={!aiText.trim() || aiSubmitting}
                      onClick={() => void handleAiSubmit()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 transition-colors"
                    >
                      {aiSubmitting ? (
                        <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />분석 중…</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5" />AI 로 폼 채우기</>
                      )}
                    </button>
                  </div>
                  {aiError && (
                    <div className="rounded border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] text-red-700">{aiError}</div>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    Tip: <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-px text-[10px]">⌘/Ctrl</kbd> + <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-px text-[10px]">Enter</kbd> 로도 제출할 수 있습니다.
                  </p>
                </div>
              )}

              {/* 일반 입력 탭 */}
              {(addDrawerTab === "manual" || editingMemo) && (
                <div className="space-y-5">
                  {/* Section 1: 거래 정보 */}
                  <div>
                    <div className="inline-flex items-center gap-2 mb-3.5">
                      <span className="inline-grid place-items-center w-[22px] h-[22px] bg-gray-900 text-white rounded-[5px] text-[11.5px] font-bold font-mono">1</span>
                      <h4 className="text-sm font-bold text-gray-900">거래 정보</h4>
                    </div>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">거래유형 <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-0 bg-gray-100 rounded-[10px] p-1">
                          {(["매수", "매도"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, tradeType: type }))}
                              className={`flex-1 py-2.5 text-sm font-semibold rounded-[7px] border-none transition-all ${
                                form.tradeType === type ? "bg-blue-700 text-white shadow-sm" : "text-gray-500 bg-transparent hover:text-gray-800"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">골프장명 <span className="text-red-500">*</span></label>
                          {manualClubInput ? (
                            <div className="flex gap-1.5">
                              <Input
                                value={form.clubName}
                                onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value, clubId: "" }))}
                                placeholder="골프장명 직접 입력"
                                className="flex-1"
                              />
                              <button type="button" onClick={() => { setManualClubInput(false); setFormClubCode(""); setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" })); setFormMemberships([]); setManualMembershipInput(false); }} className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap">목록선택</button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <ClubSearchSelect
                                clubs={clubs}
                                selectedClubCode={formClubCode}
                                onChange={(code) => { setFormClubCode(code); if (!code) { setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" })); setFormMemberships([]); setManualMembershipInput(false); } }}
                                topClubCodes={topClubCodesForm}
                                isFavorite={isClubFavorite}
                                onToggleFavorite={(code, item) => toggleClubFavorite(code, { name: item.name, region: item.region, holes: item.holes })}
                                onClubSelect={(item) => trackClubSelection({ code: item.code, name: item.name })}
                                placeholder="골프장 선택"
                              />
                              <button type="button" onClick={() => { setManualClubInput(true); setFormClubCode("__manual__"); setForm((f) => ({ ...f, clubName: "", clubId: "", membershipType: "", membershipId: "", membershipName: "" })); setFormMemberships([]); setManualMembershipInput(true); }} className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap">직접입력</button>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">회원권 종류 <span className="text-red-500">*</span></label>
                          {formMemberships.length > 0 && !manualMembershipInput ? (
                            <select
                              value={form.membershipId || form.membershipType}
                              onChange={(e) => {
                                if (e.target.value === "__manual__") { setManualMembershipInput(true); setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" })); }
                                else {
                                  const selected = formMemberships.find((m) => m.id === e.target.value);
                                  if (selected) setForm((f) => ({ ...f, membershipId: selected.id, membershipType: selected.type, membershipName: selected.name }));
                                  else setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" }));
                                }
                              }}
                              className="w-full h-10 px-3 text-[13.5px] rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gray-500"
                            >
                              <option value="">선택</option>
                              {formMemberships.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                              <option value="__manual__">직접 입력</option>
                            </select>
                          ) : (
                            <div className="flex gap-1.5">
                              <Input value={form.membershipType} onChange={(e) => setForm((f) => ({ ...f, membershipType: e.target.value, membershipId: "", membershipName: "" }))} placeholder="예: 개인정회원" className="flex-1" />
                              {formMemberships.length > 0 && (
                                <button type="button" onClick={() => { setManualMembershipInput(false); setForm((f) => ({ ...f, membershipType: "", membershipId: "", membershipName: "" })); }} className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap">목록선택</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: 고객 정보 */}
                  <div>
                    <div className="inline-flex items-center gap-2 mb-3.5">
                      <span className="inline-grid place-items-center w-[22px] h-[22px] bg-gray-900 text-white rounded-[5px] text-[11.5px] font-bold font-mono">2</span>
                      <h4 className="text-sm font-bold text-gray-900">고객 정보</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">고객명 <span className="text-red-500">*</span></label>
                        <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="홍길동" />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">연락처 <span className="text-red-500">*</span></label>
                        <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="010-1234-5678" type="tel" />
                      </div>
                    </div>
                    <MatchedCustomerCard
                      customerId={editingMemo?.customerId ?? null}
                      fallbackName={editingMemo?.customerName ?? null}
                      fallbackContact={editingMemo?.contact ?? null}
                    />
                  </div>

                  {/* Section 3: 금액 정보 */}
                  <div>
                    <div className="inline-flex items-center gap-2 mb-3.5">
                      <span className="inline-grid place-items-center w-[22px] h-[22px] bg-gray-900 text-white rounded-[5px] text-[11.5px] font-bold font-mono">3</span>
                      <h4 className="text-sm font-bold text-gray-900">금액 정보</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">제시가 <span className="text-[11.5px] font-normal text-gray-400">만원</span></label>
                          <Input type="number" value={form.offerPrice} onChange={(e) => setForm((f) => ({ ...f, offerPrice: e.target.value }))} placeholder="0" className="text-right" />
                          {form.offerPrice && <p className="mt-1 text-[11px] text-gray-500">{formatPrice(form.offerPrice)}</p>}
                        </div>
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">제시가 비고</label>
                          <Input value={form.offerPriceNote} onChange={(e) => setForm((f) => ({ ...f, offerPriceNote: e.target.value }))} placeholder="비고 (예: 매도 의향가)" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">희망가 <span className="text-[11.5px] font-normal text-gray-400">만원</span></label>
                          <Input type="number" value={form.desiredPrice} onChange={(e) => setForm((f) => ({ ...f, desiredPrice: e.target.value }))} placeholder="0" className="text-right" />
                          {form.desiredPrice && <p className="mt-1 text-[11px] text-gray-500">{formatPrice(form.desiredPrice)}</p>}
                        </div>
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">희망가 비고</label>
                          <Input value={form.desiredPriceNote} onChange={(e) => setForm((f) => ({ ...f, desiredPriceNote: e.target.value }))} placeholder="비고" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">계약금 <span className="text-[11.5px] font-normal text-gray-400">만원</span></label>
                          <Input type="number" value={form.depositAmount} onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))} placeholder="0" className="text-right" />
                          {form.depositAmount && <p className="mt-1 text-[11px] text-gray-500">{formatPrice(form.depositAmount)}</p>}
                        </div>
                        <div>
                          <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">계좌번호</label>
                          <Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} placeholder="110-123-456789" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: 메모 / 특이사항 */}
                  <div>
                    <div className="inline-flex items-center gap-2 mb-3.5">
                      <span className="inline-grid place-items-center w-[22px] h-[22px] bg-gray-900 text-white rounded-[5px] text-[11.5px] font-bold font-mono">4</span>
                      <h4 className="text-sm font-bold text-gray-900">메모 / 특이사항</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">메모</label>
                        <Textarea
                          value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                          minRows={2}
                          placeholder="타회원권 교환 희망 / 매수 의향 등"
                          disabled={!!editingMemo}
                        />
                        {editingMemo && <p className="mt-1 text-[11px] text-gray-400">수정 모드에서는 메모를 직접 편집할 수 없습니다.</p>}
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">특이사항</label>
                        <Textarea
                          value={form.remarks}
                          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                          minRows={2}
                          placeholder="계약금 입금 완료 / 특별 요청사항 등"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: 일정 */}
                  <div>
                    <div className="inline-flex items-center gap-2 mb-3.5">
                      <span className="inline-grid place-items-center w-[22px] h-[22px] bg-gray-900 text-white rounded-[5px] text-[11.5px] font-bold font-mono">5</span>
                      <h4 className="text-sm font-bold text-gray-900">일정</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">등록일</label>
                        <Input type="date" value={form.registrationDate} onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-semibold text-gray-900 mb-1.5">거래일</label>
                        <Input type="date" value={form.tradeDate} onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* 저장/취소 */}
                  <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
                    <span className="text-[12px] text-gray-400"><span className="text-red-500 font-bold">*</span> 필수 입력</span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setShowAddDrawer(false); setEditingMemo(null); resetForm(); }}>취소</Button>
                      <Button onClick={editingMemo ? handleUpdate : handleAdd} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />저장 중...</> : editingMemo ? "수정" : "저장"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        action={reasonModal ? (reasonModal.action as "REOPEN") : null}
        submitting={reasonSubmitting}
        onCancel={() => setReasonModal(null)}
        onConfirm={async (reason) => {
          if (!reasonModal) return;
          setReasonSubmitting(true);
          const target = rawMemos.find((m) => m.id === reasonModal.memoId) ?? selectedMemo;
          if (target) {
            const ok = await runApprovalAction(target, reasonModal.action, reason);
            if (ok) setReasonModal(null);
          }
          setReasonSubmitting(false);
        }}
      />
    </div>
  );
}
