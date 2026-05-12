"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UserCircle } from "lucide-react";
import { useCustomerRepository } from "@heritage-dx/api";
import type { Pagination } from "@heritage-dx/types";
import {
  mapCustomerDtoToEntity,
  type CustomerEntity,
} from "@heritage-dx/store";
import PageHeadingV2 from "@/components/customer/PageHeadingV2";
import CustomerListPanel from "@/components/customer/CustomerListPanel";
import CustomerListTable from "@/components/customer/CustomerListTable";

const LIMIT = 20;

function buildContextQuery(
  page: number,
  searchQuery: string,
  ownerFilter: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (searchQuery) params.set("q", searchQuery);
  if (ownerFilter) params.set("owner", ownerFilter);
  return params.toString();
}

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerRepo = useCustomerRepository();

  const initialPage = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const initialQuery = searchParams.get("q") ?? "";
  const initialOwner = searchParams.get("owner") ?? "";

  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [ownerFilter, setOwnerFilter] = useState(initialOwner);
  const [page, setPage] = useState(initialPage);

  // searchInput 변경 시 300ms 디바운스 후 실제 query 반영, page 리셋.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 페이지 컨텍스트를 URL 에 직렬화 — 상세 페이지 페이저가 이걸 읽음.
  useEffect(() => {
    const qs = buildContextQuery(page, searchQuery, ownerFilter);
    router.replace(qs ? `/customers?${qs}` : "/customers");
  }, [page, searchQuery, ownerFilter, router]);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await customerRepo.getAll({
        page,
        limit: LIMIT,
        search: searchQuery || undefined,
        sort: "updatedAt",
        order: "DESC",
      });
      if (response.success && response.data) {
        setCustomers(response.data.customers.map(mapCustomerDtoToEntity));
        setPagination(response.data.pagination);
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerRepo, page, searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const ownerOptions = useMemo(() => {
    const set = new Map<string, string>();
    customers.forEach((c) => {
      if (c.createdByUserId && c.createdByName) {
        set.set(c.createdByUserId, c.createdByName);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!ownerFilter) return customers;
    return customers.filter((c) => c.createdByUserId === ownerFilter);
  }, [customers, ownerFilter]);

  const handleRowClick = useCallback(
    (customer: CustomerEntity) => {
      const qs = buildContextQuery(page, searchQuery, ownerFilter);
      const suffix = qs ? `?${qs}` : "";
      router.push(`/customers/${customer.id}${suffix}`);
    },
    [router, page, searchQuery, ownerFilter],
  );

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * LIMIT, total);

  return (
    <div className="px-10 pt-10 pb-14">
      <div className="max-w-[1480px] mx-auto">
        <PageHeadingV2
          kicker="Customer Management"
          title="고객 관리"
          subtitle={`조직 내 등록된 고객 ${total}명`}
          icon={<UserCircle className="w-[18px] h-[18px]" strokeWidth={1.6} />}
        />

        <CustomerListPanel
          countLabel={total}
          metaLabel="all grades · active"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          ownerFilter={ownerFilter}
          ownerOptions={ownerOptions}
          onOwnerFilterChange={(value) => {
            setOwnerFilter(value);
            setPage(1);
          }}
          page={page}
          totalPages={totalPages}
          total={total}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          {isLoading && customers.length === 0 ? (
            <div className="px-6 py-16 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <CustomerListTable
              rows={filteredCustomers}
              startIndex={(page - 1) * LIMIT + 1}
              onRowClick={handleRowClick}
              emptyText={
                searchQuery || ownerFilter
                  ? "검색 결과가 없습니다."
                  : "등록된 고객이 없습니다."
              }
            />
          )}
        </CustomerListPanel>

        {isLoading && customers.length > 0 && (
          <div className="flex justify-center mt-3">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          </div>
        )}
      </div>
    </div>
  );
}
