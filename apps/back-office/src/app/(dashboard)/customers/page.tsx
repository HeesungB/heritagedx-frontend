"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Loader2, UserCircle } from "lucide-react";
import { PageContainer } from "@/components/layout";
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Drawer,
  Badge,
  PageLoading,
} from "@heritage-dx/ui";
import { useCustomerRepository } from "@heritage-dx/api";
import type { Customer, CustomerHistorySummary, Pagination } from "@heritage-dx/types";

const LIMIT = 20;

export default function CustomersPage() {
  const customerRepo = useCustomerRepository();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [history, setHistory] = useState<CustomerHistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
        setCustomers(response.data.customers);
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

  const handleSelect = (customer: Customer) => {
    setSelected(customer);
    loadHistory(customer.id);
  };

  const handleClose = () => {
    setSelected(null);
    setHistory(null);
  };

  if (isLoading && customers.length === 0) {
    return <PageLoading />;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCircle className="w-6 h-6 text-gray-700" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">고객 관리</h1>
            <p className="text-sm text-gray-500">
              조직 내 등록된 고객 {pagination?.total ?? 0}명
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>고객 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="고객명, 연락처, 메모 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="sm:w-56">
              <Select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                options={[
                  { value: "", label: "전체 담당자" },
                  ...ownerOptions.map((option) => ({
                    value: option.id,
                    label: option.name,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg max-h-[600px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                {searchQuery || ownerFilter
                  ? "검색 결과가 없습니다."
                  : "등록된 고객이 없습니다."}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객명
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주소
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등급
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연령대
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      거주 지역
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당자
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => handleSelect(customer)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {customer.contact}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
                        {customer.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">
                        {customer.address || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {customer.customerGrade ? (
                          <Badge variant="info">{customer.customerGrade}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {customer.ageBracket || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">
                        {customer.residenceArea || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {customer.memo ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <Badge variant="default">{customer.createdByName}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                이전
              </Button>
              <span className="text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}

          {isLoading && customers.length > 0 && (
            <div className="flex justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer
        isOpen={!!selected}
        onClose={handleClose}
        title={selected ? `${selected.name} 고객 상세` : ""}
        width="2xl"
      >
        {selected && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">기본 정보</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">고객명</div>
                  <div className="font-medium text-gray-900">{selected.name}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">연락처</div>
                  <div className="font-medium text-gray-900">{selected.contact}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">담당자</div>
                  <div className="font-medium text-gray-900">
                    {selected.createdByName}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">등록일</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selected.createdAt).toLocaleString("ko-KR")}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">이메일</div>
                  <div className="font-medium text-gray-900">
                    {selected.email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">주소</div>
                  <div className="font-medium text-gray-900 break-all">
                    {selected.address || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">영업 등급</div>
                  <div className="font-medium text-gray-900">
                    {selected.customerGrade ? (
                      <Badge variant="info">{selected.customerGrade}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">연령대</div>
                  <div className="font-medium text-gray-900">
                    {selected.ageBracket || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">직업</div>
                  <div className="font-medium text-gray-900">
                    {selected.occupation || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">거주 지역</div>
                  <div className="font-medium text-gray-900">
                    {selected.residenceArea || "-"}
                  </div>
                </div>
                {selected.ownedMembershipSummary && (
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs">보유 회원권 요약</div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {selected.ownedMembershipSummary}
                    </div>
                  </div>
                )}
                {selected.memo && (
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs">메모</div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {selected.memo}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">활동 요약</h3>
              {historyLoading ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : history ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs text-gray-500">상담 건수</div>
                      <div className="font-bold text-lg text-gray-900">
                        {history.summary.consultationCount}건
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs text-gray-500">거래 건수</div>
                      <div className="font-bold text-lg text-gray-900">
                        {history.summary.membershipTradeCount}건
                      </div>
                    </div>
                  </div>

                  {history.recentConsultations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mt-3 mb-1">
                        최근 상담
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {history.recentConsultations.map((c) => (
                          <li
                            key={c.id}
                            className="flex justify-between text-gray-700"
                          >
                            <span>
                              {c.clubName} · {c.membershipName} ·{" "}
                              <span className="text-gray-500">{c.tradeType}</span>
                            </span>
                            <span className="text-gray-400 text-xs">
                              {c.registrationDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {history.recentMembershipTrades.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mt-3 mb-1">
                        최근 거래
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {history.recentMembershipTrades.map((t) => (
                          <li
                            key={t.id}
                            className="flex justify-between text-gray-700"
                          >
                            <span>
                              {t.clubName} · {t.membershipName} ·{" "}
                              <span className="text-gray-500">{t.tradeType}</span>
                            </span>
                            <span className="text-gray-400 text-xs">
                              {t.contractDate ?? "-"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">이력이 없습니다.</p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
