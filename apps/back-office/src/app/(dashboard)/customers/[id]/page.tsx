"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserCircle } from "lucide-react";
import { useCustomerRepository } from "@heritage-dx/api";
import {
  mapCustomerDtoToEntity,
  mapCustomerHistorySummaryDtoToEntity,
  type CustomerEntity,
  type CustomerHistorySummaryEntity,
  type CustomerUpdateInput,
} from "@heritage-dx/store";
import {
  PageHeadingV2,
  CustomerDetailCrumbRow,
  CustomerPersonCard,
  CustomerBasicInfoCard,
  CustomerConsultationHistoryCard,
  CustomerDealsCard,
  CustomerMembershipsCard,
  CustomerNotesCard,
} from "@/components/customer";

const LIMIT = 20;

interface NeighborState {
  positionLabel: string | null;
  prevId: string | null;
  nextId: string | null;
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerRepo = useCustomerRepository();

  const contextQuery = useMemo(() => {
    const qs = new URLSearchParams();
    const q = searchParams.get("q");
    const ownerParam = searchParams.get("owner");
    const pageParam = searchParams.get("page");
    if (q) qs.set("q", q);
    if (ownerParam) qs.set("owner", ownerParam);
    if (pageParam) qs.set("page", pageParam);
    return qs.toString();
  }, [searchParams]);

  const backHref = contextQuery ? `/customers?${contextQuery}` : "/customers";

  const [customer, setCustomer] = useState<CustomerEntity | null>(null);
  const [history, setHistory] = useState<CustomerHistorySummaryEntity | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [neighbor, setNeighbor] = useState<NeighborState>({
    positionLabel: null,
    prevId: null,
    nextId: null,
  });

  // 단건 + 이력 요약 병렬 fetch
  useEffect(() => {
    if (!customerId) return;
    let canceled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([
      customerRepo.getOne(customerId),
      customerRepo.getHistorySummary(customerId),
    ])
      .then(([oneRes, historyRes]) => {
        if (canceled) return;
        if (oneRes.success && oneRes.data) {
          setCustomer(mapCustomerDtoToEntity(oneRes.data));
        } else {
          setError(
            (typeof oneRes.error === "string" ? oneRes.error : undefined) ??
              "고객을 불러오지 못했습니다.",
          );
        }
        if (historyRes.success && historyRes.data) {
          setHistory(mapCustomerHistorySummaryDtoToEntity(historyRes.data));
        }
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [customerRepo, customerId]);

  // 페이저(이전/다음 고객) — 목록 컨텍스트(q/owner/page) 와 동일한 정렬로 호출 후 인접 id 계산
  useEffect(() => {
    if (!customerId) return;
    let canceled = false;
    const q = searchParams.get("q") ?? "";
    const ownerFilter = searchParams.get("owner") ?? "";
    const pageParam = Math.max(1, Number(searchParams.get("page") ?? "1"));
    customerRepo
      .getAll({
        page: pageParam,
        limit: LIMIT,
        search: q || undefined,
        sort: "updatedAt",
        order: "DESC",
      })
      .then((res) => {
        if (canceled || !res.success || !res.data) return;
        const filtered = ownerFilter
          ? res.data.customers.filter((c) => c.createdByUserId === ownerFilter)
          : res.data.customers;
        const idx = filtered.findIndex((c) => c.id === customerId);
        if (idx === -1) {
          // 현재 페이지에서 고객을 못 찾으면 전체 위치만 표시 (인접 id 는 비활성)
          setNeighbor({
            positionLabel: res.data.pagination.total
              ? `— / ${String(res.data.pagination.total).padStart(2, "0")}`
              : null,
            prevId: null,
            nextId: null,
          });
          return;
        }
        const globalPos = (pageParam - 1) * LIMIT + idx + 1;
        setNeighbor({
          positionLabel: `${String(globalPos).padStart(2, "0")} / ${String(res.data.pagination.total).padStart(2, "0")}`,
          prevId: idx > 0 ? (filtered[idx - 1]?.id ?? null) : null,
          nextId:
            idx < filtered.length - 1 ? (filtered[idx + 1]?.id ?? null) : null,
        });
      });
    return () => {
      canceled = true;
    };
  }, [customerRepo, customerId, searchParams]);

  const handlePrev = useCallback(() => {
    if (!neighbor.prevId) return;
    const suffix = contextQuery ? `?${contextQuery}` : "";
    router.push(`/customers/${neighbor.prevId}${suffix}`);
  }, [neighbor.prevId, contextQuery, router]);

  const handleNext = useCallback(() => {
    if (!neighbor.nextId) return;
    const suffix = contextQuery ? `?${contextQuery}` : "";
    router.push(`/customers/${neighbor.nextId}${suffix}`);
  }, [neighbor.nextId, contextQuery, router]);

  const handlePatch = useCallback(
    async (patch: CustomerUpdateInput): Promise<boolean> => {
      if (!customer) return false;
      const res = await customerRepo.update(customer.id, patch);
      if (res.success && res.data) {
        setCustomer(mapCustomerDtoToEntity(res.data));
        return true;
      }
      return false;
    },
    [customer, customerRepo],
  );

  if (isLoading) {
    return (
      <div className="px-10 pt-7 pb-14">
        <div className="max-w-[1480px] mx-auto flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="px-10 pt-7 pb-14">
        <div className="max-w-[1480px] mx-auto py-24 text-center text-sm text-neutral-500">
          {error ?? "고객 정보를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 pt-7 pb-14">
      <div className="max-w-[1480px] mx-auto">
        <CustomerDetailCrumbRow
          backHref={backHref}
          positionLabel={neighbor.positionLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={!!neighbor.prevId}
          hasNext={!!neighbor.nextId}
        />

        <PageHeadingV2
          kicker="Customer Detail"
          title="고객 상세 정보"
          subtitle="등록된 고객의 상세 프로필과 상담 이력, 거래 현황을 한 곳에서 확인하고 편집합니다."
          icon={<UserCircle className="w-[18px] h-[18px]" strokeWidth={1.6} />}
        />

        <CustomerPersonCard customer={customer} />

        <CustomerBasicInfoCard customer={customer} onPatch={handlePatch} />
        <CustomerConsultationHistoryCard summary={history} />
        <CustomerDealsCard summary={history} />
        <CustomerMembershipsCard customer={customer} onPatch={handlePatch} />
        <CustomerNotesCard customer={customer} onPatch={handlePatch} />
      </div>
    </div>
  );
}
