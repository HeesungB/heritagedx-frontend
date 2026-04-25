"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStores } from "@/stores";
import { useCustomers } from "@heritage-dx/store";
import type { CustomerEntity, CustomerHistorySummaryEntity } from "@heritage-dx/store";
import { useCustomerRepository } from "@heritage-dx/api";
import {
  Button,
  Input,
  Textarea,
  Modal,
  ConfirmModal,
  Drawer,
  Loading,
} from "@heritage-dx/ui";

const DEFAULT_LIMIT = 20;

interface CustomerFormState {
  name: string;
  contact: string;
  email: string;
  address: string;
  memo: string;
}

const emptyForm: CustomerFormState = {
  name: "",
  contact: "",
  email: "",
  address: "",
  memo: "",
};

export default function CustomersPageClient() {
  const { customer: customerStore } = useAppStores();
  const {
    items,
    pagination,
    isLoading,
    isRefreshing,
    fetch,
    create,
    update,
    remove,
  } = useCustomers(customerStore);

  const customerRepo = useCustomerRepository();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CustomerFormState>(emptyForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CustomerEntity | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormState>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CustomerEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<CustomerHistorySummaryEntity | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetch({
      page,
      limit: DEFAULT_LIMIT,
      search: searchQuery || undefined,
      sort: "updatedAt",
      order: "DESC",
    });
  }, [page, searchQuery, fetch]);

  const loadHistory = useCallback(
    async (customerId: string) => {
      setHistoryLoading(true);
      setHistory(null);
      try {
        const response = await customerRepo.getHistorySummary(customerId);
        if (response.success && response.data) {
          setHistory(response.data);
        }
      } finally {
        setHistoryLoading(false);
      }
    },
    [customerRepo],
  );

  const handleSelect = (item: CustomerEntity) => {
    setSelected(item);
    setEditForm({
      name: item.name,
      contact: item.contact,
      email: item.email ?? "",
      address: item.address ?? "",
      memo: item.memo ?? "",
    });
    setEditError(null);
    loadHistory(item.id);
  };

  const handleCloseDrawer = () => {
    setSelected(null);
    setHistory(null);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.contact.trim()) {
      setCreateError("고객명과 연락처를 입력해주세요.");
      return;
    }
    setCreateSubmitting(true);
    setCreateError(null);
    const result = await create({
      name: createForm.name.trim(),
      contact: createForm.contact.trim(),
      email: createForm.email.trim() || null,
      address: createForm.address.trim() || null,
      memo: createForm.memo.trim() || undefined,
    });
    setCreateSubmitting(false);
    if (result.success) {
      setShowCreateModal(false);
      setCreateForm(emptyForm);
    } else {
      setCreateError(
        result.conflict
          ? "이미 등록된 연락처입니다."
          : result.errorMessage ?? "고객 등록에 실패했습니다.",
      );
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    if (!editForm.name.trim() || !editForm.contact.trim()) {
      setEditError("고객명과 연락처를 입력해주세요.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    const updated = await update(selected.id, {
      name: editForm.name.trim(),
      contact: editForm.contact.trim(),
      email: editForm.email.trim() || null,
      address: editForm.address.trim() || null,
      memo: editForm.memo.trim() || undefined,
    });
    setEditSubmitting(false);
    if (updated) {
      setSelected(updated);
    } else {
      setEditError("고객 정보 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await remove(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      if (selected?.id === deleteTarget.id) {
        handleCloseDrawer();
      }
      setDeleteTarget(null);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const renderList = () => {
    if (isLoading && items.length === 0) {
      return (
        <div className="flex justify-center py-20">
          <Loading />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500 text-sm">
          등록된 고객이 없습니다.
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => handleSelect(item)}
            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{item.name}</span>
                <span className="text-sm text-gray-500">{item.contact}</span>
              </div>
              {item.memo && (
                <p className="text-xs text-gray-500 mt-1 truncate">{item.memo}</p>
              )}
            </div>
            <div className="text-xs text-gray-500 text-right shrink-0">
              <div>담당: {item.createdByName || "-"}</div>
              <div>{new Date(item.createdAt).toLocaleDateString("ko-KR")}</div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">고객 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              총 {total}명의 고객이 등록되어 있습니다.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>신규 고객 등록</Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder="고객명 또는 연락처로 검색"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {isRefreshing && (
            <div className="px-4 py-1 text-xs text-gray-400">불러오는 중...</div>
          )}
          {renderList()}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              disabled={!pagination?.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span className="text-sm text-gray-600">
              {pagination?.page ?? 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!pagination?.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm(emptyForm);
          setCreateError(null);
        }}
        title="신규 고객 등록"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm(emptyForm);
                setCreateError(null);
              }}
              disabled={createSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleCreate} isLoading={createSubmitting}>
              등록
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              고객명 *
            </label>
            <Input
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처 *
            </label>
            <Input
              value={createForm.contact}
              onChange={(e) =>
                setCreateForm({ ...createForm, contact: e.target.value })
              }
              placeholder="010-1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              placeholder="hong@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <Input
              value={createForm.address}
              onChange={(e) =>
                setCreateForm({ ...createForm, address: e.target.value })
              }
              placeholder="서울특별시 강남구 테헤란로 123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <Textarea
              value={createForm.memo}
              onChange={(e) =>
                setCreateForm({ ...createForm, memo: e.target.value })
              }
              rows={3}
              placeholder="선호 시간, 관심 회원권 등"
            />
          </div>
          {createError && (
            <p className="text-sm text-red-600">{createError}</p>
          )}
        </div>
      </Modal>

      <Drawer
        isOpen={!!selected}
        onClose={handleCloseDrawer}
        title={selected ? `${selected.name} 고객 정보` : ""}
        width="xl"
      >
        {selected && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">기본 정보</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객명
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <Input
                  value={editForm.contact}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contact: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="hong@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  placeholder="서울특별시 강남구 테헤란로 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <Textarea
                  value={editForm.memo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, memo: e.target.value })
                  }
                  rows={3}
                />
              </div>
              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="danger"
                  onClick={() => setDeleteTarget(selected)}
                >
                  삭제
                </Button>
                <Button onClick={handleUpdate} isLoading={editSubmitting}>
                  저장
                </Button>
              </div>
            </section>

            <section className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">고객 이력</h3>
              {historyLoading ? (
                <div className="py-6 flex justify-center">
                  <Loading />
                </div>
              ) : history ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-gray-500">상담</div>
                      <div className="font-bold text-lg text-gray-900">
                        {history.summary.consultationCount}건
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-gray-500">거래</div>
                      <div className="font-bold text-lg text-gray-900">
                        {history.summary.membershipTradeCount}건
                      </div>
                    </div>
                  </div>

                  {history.recentConsultations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mt-2 mb-1">
                        최근 상담
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {history.recentConsultations.map((c) => (
                          <li key={c.id} className="text-gray-700">
                            {c.clubName} · {c.membershipName} ·{" "}
                            <span className="text-gray-500">
                              {c.tradeType} / {c.registrationDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {history.recentMembershipTrades.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mt-2 mb-1">
                        최근 거래
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {history.recentMembershipTrades.map((t) => (
                          <li key={t.id} className="text-gray-700">
                            {t.clubName} · {t.membershipName} ·{" "}
                            <span className="text-gray-500">
                              {t.tradeType} / {t.contractDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">이력이 없습니다.</p>
              )}
            </section>

            <section className="text-xs text-gray-500 border-t pt-3 space-y-1">
              <div>등록자: {selected.createdByName}</div>
              <div>
                등록일: {new Date(selected.createdAt).toLocaleString("ko-KR")}
              </div>
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="고객 삭제"
        message={
          deleteTarget
            ? `${deleteTarget.name}(${deleteTarget.contact}) 고객을 삭제하시겠습니까?`
            : ""
        }
        confirmText="삭제"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
