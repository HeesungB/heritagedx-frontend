"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAppStores } from "@/stores";
import {
  mapCustomerDtoToEntity,
  useCustomers,
  useRecentSearches,
  type CustomerEntity,
  type CustomerUpdateInput,
} from "@heritage-dx/store";
import { useCustomerRepository } from "@heritage-dx/api";
import { ConfirmModal, Loading } from "@heritage-dx/ui";

import { PersonCard } from "./customer-detail/PersonCard";
import { BasicInfoCard } from "./customer-detail/BasicInfoCard";
import { MembershipCard } from "./customer-detail/MembershipCard";
import { ConsultationHistoryCard } from "./customer-detail/ConsultationHistoryCard";
import { NotesCard } from "./customer-detail/NotesCard";
import { cd } from "./customer-detail/styles";

interface Props {
  id: string;
}

export default function CustomerDetailClient({ id }: Props) {
  const router = useRouter();
  const { customer: customerStore } = useAppStores();
  const { items, update, remove } = useCustomers(customerStore);
  const customerRepo = useCustomerRepository();
  const { push: pushRecentCustomer } = useRecentSearches("customers");

  const [customer, setCustomer] = useState<CustomerEntity | null>(() => {
    const cached = items.find((c) => c.id === id);
    return cached ?? null;
  });
  const [loading, setLoading] = useState(!customer);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 단일 고객 fetch — 캐시 유무와 무관하게 한 번 신선한 값으로 덮어쓴다.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await customerRepo.getOne(id);
      if (cancelled) return;
      if (response.success && response.data) {
        // mapper 가 raw memo 를 평면화하면서 동시에 __MEMO_V1__ entries 도 디코딩.
        setCustomer(mapCustomerDtoToEntity(response.data));
        setLoadError(null);
      } else if (!customer) {
        setLoadError("고객 정보를 불러올 수 없습니다");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 진입 시 사이드바 최근 항목에 push.
  useEffect(() => {
    if (!customer) return;
    pushRecentCustomer({
      label: customer.name?.trim() || customer.contact || customer.id,
      value: customer.id,
      kind: "customer",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const handlePatch = useCallback(
    async (patch: CustomerUpdateInput): Promise<boolean> => {
      const updated = await update(id, patch);
      if (updated) {
        setCustomer(updated);
        return true;
      }
      return false;
    },
    [id, update],
  );

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await remove(id);
    setDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      router.push("/customers");
    }
  };

  if (loading && !customer) {
    return (
      <main style={cd.page}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
          <Loading />
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main style={cd.page}>
        <button
          type="button"
          onClick={() => router.push("/customers")}
          style={cd.backBtn}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          고객 관리 목록으로
        </button>
        <div style={{ ...cd.emptyBox, marginTop: 24 }}>
          {loadError ?? "고객 정보를 찾을 수 없습니다"}
        </div>
      </main>
    );
  }

  return (
    <main style={cd.page}>
      <div style={cd.topBar}>
        <button
          type="button"
          onClick={() => router.push("/customers")}
          style={cd.backBtn}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          고객 관리 목록으로
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          style={{
            ...cd.backBtn,
            color: "#b91c1c",
            borderColor: "#fecaca",
          }}
        >
          <Trash2 size={13} strokeWidth={1.5} />
          고객 삭제
        </button>
      </div>

      <div style={cd.titleRow}>
        <div>
          <h1 style={cd.title}>고객 상세 정보</h1>
          <div style={cd.subtitle}>
            등록된 고객의 상세 프로필과 상담 이력을 한 곳에서 확인하고 편집할 수 있습니다.
          </div>
        </div>
      </div>

      <PersonCard customer={customer} />
      <BasicInfoCard customer={customer} onPatch={handlePatch} />
      <MembershipCard customer={customer} onPatch={handlePatch} />
      <ConsultationHistoryCard customerId={customer.id} />
      <NotesCard customer={customer} onPatch={handlePatch} />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="고객 삭제"
        message={`${customer.name}(${customer.contact}) 고객을 삭제하시겠습니까?`}
        confirmText="삭제"
        variant="danger"
        isLoading={deleting}
      />
    </main>
  );
}
