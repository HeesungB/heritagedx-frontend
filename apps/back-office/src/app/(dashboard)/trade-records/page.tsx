"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal } from "@heritage-dx/ui";
import { useClubRepository, useMembershipTradeAdminRepository } from "@heritage-dx/api";
import type { Club, MembershipTrade, MembershipTradeInput, Pagination } from "@heritage-dx/types";
import type { TradeWorkflowStatus } from "@heritage-dx/store";
import { canDeleteTrade, getTradeRecordCounts, useTopClubs } from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { ActionReasonModal } from "@/components/approval/ActionReasonModal";
import TradeRecordDetailPanel from "@/components/trade-records/TradeRecordDetailPanel";
import TradeRecordFormModal, {
  type TradeRecordFormState,
} from "@/components/trade-records/TradeRecordFormModal";
import TradeRecordList from "@/components/trade-records/TradeRecordList";
import TradeRecordsFilterBar from "@/components/trade-records/TradeRecordsFilterBar";
import TradeRecordsPageHeader from "@/components/trade-records/TradeRecordsPageHeader";
import TradeRecordsSplitLayout from "@/components/trade-records/TradeRecordsSplitLayout";

type TradeTypeFilter = "" | "매수" | "매도";
type WorkflowFilter = "" | TradeWorkflowStatus;

const PAGE_SIZE = 20;

function createEmptyForm(): TradeRecordFormState {
  return {
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
  };
}

function toNullableNumber(value: string): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export default function MembershipTradesPage() {
  const membershipTradesRepo = useMembershipTradeAdminRepository();
  const clubsRepo = useClubRepository();
  const { user } = useAuth();
  const { preloadedRecords, clearPreloadedRecords, clubs } = useData();
  const usedPreloadRef = useRef(false);
  const clubsRef = useRef<Club[]>(clubs);

  const [rawRecords, setRawRecords] = useState<MembershipTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TradeTypeFilter>("");
  const [filterWorkflow, setFilterWorkflow] = useState<WorkflowFilter>("");
  const [selectedClubCode, setSelectedClubCode] = useState("");
  const [selectedMembership, setSelectedMembership] = useState("");
  const [memberships, setMemberships] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [reasonModal, setReasonModal] = useState<{ recordId: string } | null>(null);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MembershipTrade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MembershipTrade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formClubCode, setFormClubCode] = useState("");
  const [formClubId, setFormClubId] = useState("");
  const [formMemberships, setFormMemberships] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<TradeRecordFormState>(() => createEmptyForm());

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  const availableClubs = useMemo(() => {
    const clubNames = new Set(rawRecords.map((record) => record.clubName).filter(Boolean));
    return clubs.filter((club) => clubNames.has(club.name));
  }, [clubs, rawRecords]);

  const {
    topClubCodes: topClubCodesFilter,
    isFavorite: isClubFavorite,
    toggleFavorite: toggleClubFavorite,
    trackSelection: trackClubSelection,
  } = useTopClubs(availableClubs, 5);
  const { topClubCodes: topClubCodesForm } = useTopClubs(clubs, 5);

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
            .map((membership) => membership.membershipName || membership.membershipType)
            .filter(Boolean);
          setMemberships([...new Set(names)]);
        }
      } catch {
        if (!cancelled) setMemberships([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubsRepo, selectedClubCode]);

  useEffect(() => {
    if (!formClubCode) {
      setFormMemberships([]);
      setFormClubId("");
      return;
    }

    let cancelled = false;
    clubsRepo
      .getOne(formClubCode)
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setFormClubId(res.data.id);
          setFormMemberships(
            (res.data.memberships ?? []).map((membership) => ({
              id: membership.id,
              name: membership.membershipName || membership.membershipType,
            })),
          );
          return;
        }
        setFormClubId("");
        setFormMemberships([]);
      })
      .catch(() => {
        if (!cancelled) {
          setFormClubId("");
          setFormMemberships([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clubsRepo, formClubCode]);

  const displayRecords = useMemo(() => {
    let result = rawRecords;

    if (selectedClubCode) {
      const club = clubsRef.current.find((item) => item.code === selectedClubCode);
      if (club) {
        result = result.filter((record) => record.clubName === club.name);
      }
    }

    if (selectedMembership) {
      result = result.filter((record) => record.membershipName === selectedMembership);
    }

    if (dateFrom) {
      result = result.filter(
        (record) => record.contractDate && record.contractDate >= dateFrom,
      );
    }

    if (dateTo) {
      result = result.filter(
        (record) => record.contractDate && record.contractDate <= dateTo,
      );
    }

    return result;
  }, [rawRecords, selectedClubCode, selectedMembership, dateFrom, dateTo]);

  const selectedRecord = useMemo(
    () => displayRecords.find((record) => record.id === selectedRecordId) ?? null,
    [displayRecords, selectedRecordId],
  );

  useEffect(() => {
    if (displayRecords.length === 0) {
      setSelectedRecordId(null);
      return;
    }

    if (!selectedRecordId || !displayRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(displayRecords[0].id);
    }
  }, [displayRecords, selectedRecordId]);

  const loadRecords = useCallback(async () => {
    if (
      !usedPreloadRef.current &&
      preloadedRecords &&
      page === 1 &&
      !searchQuery &&
      !filterType &&
      !filterWorkflow
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
        limit: PAGE_SIZE,
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
        setPagination(null);
      }
    } catch (error) {
      console.error("Failed to load trade records:", error);
      setRawRecords([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    clearPreloadedRecords,
    filterType,
    filterWorkflow,
    membershipTradesRepo,
    page,
    preloadedRecords,
    searchQuery,
  ]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resetForm = useCallback(() => {
    setFormClubCode("");
    setFormClubId("");
    setFormMemberships([]);
    setForm(createEmptyForm());
  }, []);

  const closeFormModal = useCallback(() => {
    setShowAddModal(false);
    setEditingRecord(null);
    resetForm();
  }, [resetForm]);

  const openAddModal = () => {
    resetForm();
    setEditingRecord(null);
    setShowAddModal(true);
  };

  const buildPayload = (): MembershipTradeInput | null => {
    if (!formClubId) {
      alert("골프장을 선택해주세요.");
      return null;
    }

    const membershipObj = formMemberships.find(
      (membership) => membership.name === form.membershipName,
    );
    if (!membershipObj) {
      alert("회원권을 선택해주세요.");
      return null;
    }

    if (!form.customerName.trim()) {
      alert("고객명은 필수입니다.");
      return null;
    }

    return {
      clubId: formClubId,
      membershipId: membershipObj.id,
      tradeType: form.tradeType,
      customerName: form.customerName,
      contact: form.contact,
      tradingPartner: form.tradingPartner || null,
      manager: form.manager || null,
      amount: toNullableNumber(form.amount),
      tradeAmount: toNullableNumber(form.tradeAmount),
      commission: toNullableNumber(form.commission),
      marketProfit: toNullableNumber(form.marketProfit),
      expense: toNullableNumber(form.expense),
      depositAmount: toNullableNumber(form.depositAmount),
      contractDate: form.contractDate || null,
      balanceDate: form.balanceDate || null,
      actualTransactionDate: form.actualTransactionDate || null,
      balanceCompleted: form.balanceCompleted,
      taxTransfer: form.taxTransfer,
      taxAcquisition: form.taxAcquisition,
      invoiceSales: toNullableNumber(form.invoiceSales),
      invoicePurchase: toNullableNumber(form.invoicePurchase),
      description: form.description || null,
      remarks: form.remarks || null,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setIsSaving(true);
    try {
      const response = editingRecord
        ? await membershipTradesRepo.update(editingRecord.id, payload)
        : await membershipTradesRepo.create(payload);

      if (response.success) {
        alert(editingRecord ? "거래 내역이 수정되었습니다." : "거래 내역이 등록되었습니다.");
        if (response.data) setSelectedRecordId(response.data.id);
        closeFormModal();
        loadRecords();
      } else {
        alert(response.error || (editingRecord ? "수정에 실패했습니다." : "등록에 실패했습니다."));
      }
    } catch {
      alert(editingRecord ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (record: MembershipTrade) => {
    setEditingRecord(record);
    setShowAddModal(false);
    const matchedClub = clubsRef.current.find((club) => club.name === record.clubName);
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

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const response = await membershipTradesRepo.delete(deleteTarget.id);
      if (response.success) {
        setRawRecords((records) => records.filter((record) => record.id !== deleteTarget.id));
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const runWorkflowAction = async (
    record: MembershipTrade,
    action: "ADVANCE_TO_TAX_FILING" | "ADVANCE_TO_COMPLETED" | "REJECT",
    reason?: string,
  ) => {
    setApprovalBusyId(record.id);
    try {
      const response = await membershipTradesRepo.workflowAction(record.id, { action, reason });
      if (response.success) {
        if (action === "REJECT") {
          setRawRecords((records) => records.filter((item) => item.id !== record.id));
          return true;
        }

        if (response.data) {
          const updated = response.data;
          setRawRecords((records) =>
            records.map((item) => (item.id === record.id ? updated : item)),
          );
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

  const counts = useMemo(() => getTradeRecordCounts(rawRecords), [rawRecords]);
  const totalCount = pagination?.total ?? counts.total;
  const rangeStart =
    pagination && totalCount > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.limit, totalCount) : 0;
  const canDelete = canDeleteTrade(user);

  return (
    <div className="flex h-full min-h-[calc(100vh-6rem)] flex-col bg-[#FAFAF9]">
      <TradeRecordsPageHeader totalCount={totalCount} counts={counts} onAdd={openAddModal} />

      <TradeRecordsSplitLayout
        className="flex-1 min-h-0"
        left={
          <div className="flex h-full min-h-[640px] flex-col">
            <TradeRecordsFilterBar
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
              tradeType={filterType}
              onTradeTypeChange={(value) => {
                setFilterType(value);
                setPage(1);
              }}
              workflowStatus={filterWorkflow}
              onWorkflowStatusChange={(value) => {
                setFilterWorkflow(value);
                setPage(1);
              }}
              clubs={availableClubs}
              selectedClubCode={selectedClubCode}
              onClubChange={(code) => {
                setSelectedClubCode(code);
                setSelectedMembership("");
                setPage(1);
              }}
              memberships={memberships}
              selectedMembership={selectedMembership}
              onMembershipChange={setSelectedMembership}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              topClubCodes={topClubCodesFilter}
              isClubFavorite={isClubFavorite}
              onToggleClubFavorite={(code, item) =>
                toggleClubFavorite(code, {
                  name: item.name,
                  region: item.region,
                  holes: item.holes,
                })
              }
              onClubSelect={(item) =>
                trackClubSelection({ code: item.code, name: item.name })
              }
              disabled={isLoading && rawRecords.length === 0}
              counts={counts}
              totalCount={totalCount}
            />

            <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0EE] bg-[#FAFAF9] px-5 py-2.5">
              <span className="font-mono text-[11.5px] tracking-[0.02em] text-[#525252]">
                표시 <b className="text-[#0A0A0A]">{displayRecords.length}</b> /{" "}
                {totalCount.toLocaleString("ko-KR")}
              </span>
              <span className="font-mono text-[11.5px] tracking-[0.02em] text-[#A3A3A3]">
                {rangeStart > 0 ? `${rangeStart}-${rangeEnd}` : "0"}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TradeRecordList
                records={displayRecords}
                selectedRecordId={selectedRecordId}
                onSelect={(record) => setSelectedRecordId(record.id)}
                isLoading={isLoading}
                pagination={pagination}
                page={page}
                onPrev={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => current + 1)}
              />
            </div>
          </div>
        }
        right={
          <div className="h-full overflow-y-auto px-8 py-7 pb-14">
            <TradeRecordDetailPanel
              record={selectedRecord}
              canDelete={canDelete}
              approvalBusyId={approvalBusyId}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onAdvanceToTaxFiling={(record) =>
                runWorkflowAction(record, "ADVANCE_TO_TAX_FILING")
              }
              onAdvanceToCompleted={(record) =>
                runWorkflowAction(record, "ADVANCE_TO_COMPLETED")
              }
              onReject={(record) => setReasonModal({ recordId: record.id })}
            />
          </div>
        }
      />

      <TradeRecordFormModal
        open={showAddModal || !!editingRecord}
        mode={editingRecord ? "edit" : "add"}
        form={form}
        setForm={setForm}
        onClose={closeFormModal}
        onSubmit={handleSave}
        isSaving={isSaving}
        clubs={clubs}
        formClubCode={formClubCode}
        setFormClubCode={(code) => {
          setFormClubCode(code);
          setFormClubId("");
          setFormMemberships([]);
        }}
        formMemberships={formMemberships}
        topClubCodesForm={topClubCodesForm}
        isClubFavorite={isClubFavorite}
        toggleClubFavorite={toggleClubFavorite}
        trackClubSelection={trackClubSelection}
      />

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
          const target = rawRecords.find((record) => record.id === reasonModal.recordId);
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
