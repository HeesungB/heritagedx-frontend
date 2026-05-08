"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStores } from "@/stores";
import { useCustomers } from "@heritage-dx/store";
import { Loading } from "@heritage-dx/ui";
import { CustomerCreateModal } from "./customer-create/CustomerCreateModal";

const DEFAULT_LIMIT = 20;

export default function CustomersPageClient() {
  const router = useRouter();
  const { customer: customerStore } = useAppStores();
  const {
    items,
    pagination,
    isLoading,
    isRefreshing,
    fetch,
  } = useCustomers(customerStore);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const pageNumbers = useMemo(() => {
    const window = 5;
    if (totalPages <= window) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(page - 2, totalPages - window + 1));
    return Array.from({ length: window }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div>
      <main className="mx-auto w-full max-w-[1500px] px-6 py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[36px] tracking-[-0.01em] text-[#101828]">
              고객 관리
            </h1>
            <p className="mt-2 text-[14px] leading-[22px] tracking-[-0.005em] text-[#6a7282]">
              등록된 고객의 상세 정보를 관리하고 조회할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#101828] px-4 text-[13px] font-medium tracking-[-0.005em] text-white hover:bg-black"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            신규 고객 등록
          </button>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[#f3f4f6] px-5 py-4">
            <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 focus-within:border-[#101828] sm:w-[260px]">
              <Search className="h-4 w-4 shrink-0 text-[#99a1af]" strokeWidth={2} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="테이블 내 검색..."
                className="h-full flex-1 bg-transparent text-[13px] tracking-[-0.005em] text-[#101828] placeholder:text-[#99a1af] focus:outline-none"
              />
            </div>
          </div>

          {isLoading && items.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loading />
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-[13px] text-[#99a1af]">
              등록된 고객이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[12px] tracking-[-0.005em] text-[#6a7282]">
                    <th className="px-4 py-3 text-center font-medium">No.</th>
                    <th className="px-4 py-3 text-left font-medium">고객명</th>
                    <th className="px-4 py-3 text-left font-medium">연락처</th>
                    <th className="px-4 py-3 text-left font-medium">이메일</th>
                    <th className="px-4 py-3 text-left font-medium">주소</th>
                    <th className="px-4 py-3 text-left font-medium">등록일</th>
                    <th className="px-4 py-3 text-left font-medium">메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/customers/${item.id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-center text-[#6a7282]">
                        {(page - 1) * DEFAULT_LIMIT + index + 1}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#101828]">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-[#4a5565]">
                        {item.contact}
                      </td>
                      <td className="px-4 py-4 text-[#4a5565]">
                        {item.email || "-"}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-[#4a5565]">
                        {item.address || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[#4a5565]">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-4 text-[#6a7282]">
                        {item.memo || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] px-5 py-4">
            <span className="text-[13px] tracking-[-0.005em] text-[#6a7282]">
              총{" "}
              <strong className="font-bold text-[#101828]">{total}명</strong>의
              고객이 있습니다.
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!pagination?.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#4a5565] disabled:cursor-not-allowed disabled:text-[#d1d5db] hover:enabled:bg-gray-50"
                  aria-label="이전 페이지"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-md text-[13px] font-medium transition-colors ${
                      p === page
                        ? "bg-[#101828] text-white"
                        : "border border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!pagination?.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#4a5565] disabled:cursor-not-allowed disabled:text-[#d1d5db] hover:enabled:bg-gray-50"
                  aria-label="다음 페이지"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
        {isRefreshing && (
          <p className="mt-2 text-[11px] text-[#99a1af]">불러오는 중...</p>
        )}
      </main>

      {showCreateModal && (
        <CustomerCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
