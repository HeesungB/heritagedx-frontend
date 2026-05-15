"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCustomerRepository } from "@heritage-dx/api";
import {
  getCustomerGradeLabel,
  getOwnedMembershipStatusLabel,
  mapCustomerDtoToEntity,
  mapCustomerHistorySummaryDtoToEntity,
  type CustomerEntity,
  type CustomerHistoryRecentConsultationEntity,
  type CustomerHistoryRecentMembershipTradeEntity,
  type CustomerHistorySummaryEntity,
} from "@heritage-dx/store";

interface Props {
  customerId: string | null;
  fallbackName?: string | null;
  fallbackContact?: string | null;
}

type TabKey = "info" | "memberships" | "history" | "trades";

// 시안 ~/Desktop/add customer.html 의 매칭 고객 카드와 동일한 시각.
// OS 의 apps/os/src/components/trade-memo/MatchedCustomerCard 와 디자인은 1:1 이지만,
// 백오피스는 store 컨텍스트 없이 customerRepo 를 직접 호출하는 패턴이라 별도 wrapper.
export default function MatchedCustomerCard({
  customerId,
  fallbackName,
  fallbackContact,
}: Props) {
  const customerRepo = useCustomerRepository();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<TabKey>("info");
  const [customer, setCustomer] = useState<CustomerEntity | null>(null);
  const [history, setHistory] =
    useState<CustomerHistorySummaryEntity | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setHistory(null);
      setLoading(false);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setCustomer(null);
    setHistory(null);
    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        const [customerResult, historyResult] = await Promise.allSettled([
          customerRepo.getOne(customerId),
          customerRepo.getHistorySummary(customerId),
        ]);
        if (cancelled) return;

        if (
          customerResult.status === "fulfilled" &&
          customerResult.value.success &&
          customerResult.value.data
        ) {
          setCustomer(mapCustomerDtoToEntity(customerResult.value.data));
        } else {
          setCustomer(null);
          setLoadError("고객 상세 정보를 불러오지 못했습니다.");
          if (customerResult.status === "rejected") {
            console.error("Failed to load customer:", customerResult.reason);
          }
        }

        try {
          if (
            historyResult.status === "fulfilled" &&
            historyResult.value.success &&
            historyResult.value.data
          ) {
            setHistory(mapCustomerHistorySummaryDtoToEntity(historyResult.value.data));
          } else {
            setHistory(null);
            if (historyResult.status === "rejected") {
              console.error("Failed to load customer history:", historyResult.reason);
            }
          }
        } catch (historyError) {
          console.error("Failed to map customer history:", historyError);
          setHistory(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to render matched customer:", error);
        setCustomer(null);
        setHistory(null);
        setLoadError("고객 상세 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  if (!customerId) {
    if (!fallbackName && !fallbackContact) return null;
    return (
      <CustomerPlaceholderCard
        name={fallbackName}
        contact={fallbackContact}
        loading={false}
        message="연결된 고객 프로필이 없습니다."
      />
    );
  }

  if (!customer) {
    return (
      <CustomerPlaceholderCard
        name={fallbackName}
        contact={fallbackContact}
        loading={loading}
        message={loading ? "고객 정보 불러오는 중..." : loadError ?? "고객 정보를 찾을 수 없습니다."}
      />
    );
  }

  const gradeLabel = getCustomerGradeLabel(customer.customerGrade);
  const region = customer.residenceArea ?? customer.address ?? null;

  return (
    <div className="mt-1 flex-shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#fafafa]">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-bold text-white">
            {customer.name?.slice(0, 1) || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13.5px] font-bold text-[#0a0a0a]">
                {customer.name}
              </span>
              {gradeLabel && (
                <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-1.5 py-[1px] text-[10.5px] font-semibold text-[#166534]">
                  {gradeLabel}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[#6b7280]">
              <span>등록 {formatYmd(customer.createdAt)}</span>
              {region && (
                <>
                  <span className="text-[#d4d4d8]">·</span>
                  <span className="truncate">{region}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`shrink-0 text-[#6b7280] transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-[#e5e7eb] bg-white">
          <div className="flex gap-0 border-b border-[#f3f4f6] px-3.5">
            <TabButton
              label="기본 정보"
              active={tab === "info"}
              onClick={() => setTab("info")}
            />
            <TabButton
              label="보유 회원권"
              active={tab === "memberships"}
              onClick={() => setTab("memberships")}
            />
            <TabButton
              label="상담 히스토리"
              active={tab === "history"}
              onClick={() => setTab("history")}
              count={history?.summary.consultationCount ?? null}
            />
            <TabButton
              label="거래 내역"
              active={tab === "trades"}
              onClick={() => setTab("trades")}
              count={history?.summary.membershipTradeCount ?? null}
            />
          </div>

          <div className="px-3.5 py-3">
            {tab === "info" && (
              <InfoTab customer={customer} customerId={customerId} />
            )}
            {tab === "memberships" && <MembershipsTab customer={customer} />}
            {tab === "history" && (
              <HistoryTab
                customerId={customerId}
                items={history?.recentConsultations ?? []}
                total={history?.summary.consultationCount ?? 0}
              />
            )}
            {tab === "trades" && (
              <TradesTab
                customerId={customerId}
                items={history?.recentMembershipTrades ?? []}
                total={history?.summary.membershipTradeCount ?? 0}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerPlaceholderCard({
  name,
  contact,
  loading,
  message,
}: {
  name?: string | null;
  contact?: string | null;
  loading: boolean;
  message: string;
}) {
  const displayName = name?.trim() || "";
  const displayContact = contact?.trim() || "";

  return (
    <div className="mt-1 flex-shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#fafafa]">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-bold text-white">
          {displayName.slice(0, 1) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {displayName ? (
              <span className="text-[13.5px] font-bold text-[#0a0a0a]">
                {displayName}
              </span>
            ) : loading ? (
              <SkeletonLine className="h-4 w-20" />
            ) : (
              <span className="text-[13.5px] font-bold text-[#0a0a0a]">
                고객 정보 없음
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-[1px] text-[10.5px] font-semibold text-gray-500">
              {loading ? "조회 중" : "상세 미확인"}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-[#6b7280]">{message}</p>
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] bg-white px-3.5 py-3">
        <DefRow label="고객명">
          {displayName ? (
            <span className="font-semibold">{displayName}</span>
          ) : loading ? (
            <SkeletonLine className="h-3.5 w-24" />
          ) : (
            "-"
          )}
        </DefRow>
        <DefRow label="연락처">
          {displayContact ? (
            <span className="font-mono text-[12px] font-semibold">
              {displayContact}
            </span>
          ) : loading ? (
            <SkeletonLine className="h-3.5 w-28" />
          ) : (
            "-"
          )}
        </DefRow>
        {loading && (
          <>
            <DefRow label="이메일">
              <SkeletonLine className="h-3.5 w-32" />
            </DefRow>
            <DefRow label="거주지">
              <SkeletonLine className="h-3.5 w-36" />
            </DefRow>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block animate-pulse rounded bg-[#e5e7eb] ${className}`}
    />
  );
}

function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mr-4 inline-flex h-9 items-center gap-1.5 border-b-2 px-1 text-[12px] transition-colors ${
        active
          ? "border-[#0a0a0a] font-bold text-[#0a0a0a]"
          : "border-transparent font-medium text-[#6b7280] hover:text-[#374151]"
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span
          className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums ${
            active ? "bg-[#0a0a0a] text-white" : "bg-[#e5e7eb] text-[#6b7280]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function InfoTab({
  customer,
  customerId,
}: {
  customer: CustomerEntity;
  customerId: string;
}) {
  return (
    <div>
      <DefRow label="고객명">
        <span className="font-semibold">{customer.name}</span>
      </DefRow>
      <DefRow label="연락처">
        <span className="font-mono text-[12px] font-semibold">
          {customer.contact || "-"}
        </span>
      </DefRow>
      <DefRow label="이메일">{customer.email || "-"}</DefRow>
      <DefRow label="직업">{customer.occupation || "-"}</DefRow>
      <DefRow label="연령대">{customer.ageBracket || "-"}</DefRow>
      <DefRow label="거주지">
        {customer.residenceArea || customer.address || "-"}
      </DefRow>
      <Link
        href={`/customers/${customerId}`}
        className="mt-2 inline-block text-[11px] text-[#9ca3af] hover:text-[#374151]"
      >
        ↗ 고객 관리 페이지에서 전체 정보 보기
      </Link>
    </div>
  );
}

const OWNED_MEMBERSHIP_STATUS_BADGE: Record<string, string> = {
  OWNED: "bg-[#dcfce7] text-[#166534]",
  SELLING: "bg-[#fef3c7] text-[#92400e]",
  TRANSFER_PENDING: "bg-[#dbeafe] text-[#1e3a8a]",
  SOLD: "bg-[#e5e7eb] text-[#374151]",
  UNKNOWN: "bg-[#f3f4f6] text-[#6b7280]",
};

function MembershipsTab({ customer }: { customer: CustomerEntity }) {
  const summary = customer.ownedMembershipSummary?.trim();
  const items = customer.ownedMemberships;
  return (
    <div>
      {summary ? (
        <div className="mb-3 rounded-md border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5 text-[12px] leading-[1.55] text-[#374151]">
          {summary}
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#d4d4d8] bg-white px-3 py-4 text-center text-[11.5px] text-[#9ca3af]">
          등록된 보유 회원권이 없습니다
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#fafafa]">
              <tr className="text-[11px] font-medium text-[#6b7280]">
                <th className="px-2.5 py-1.5 text-left font-medium">골프장</th>
                <th className="px-2.5 py-1.5 text-left font-medium">회원 유형</th>
                <th className="px-2.5 py-1.5 text-left font-medium">상태</th>
                <th className="px-2.5 py-1.5 text-right font-medium">수량</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={`${it.clubId}-${it.membershipId}`}
                  className="border-t border-[#f3f4f6]"
                >
                  <td className="px-2.5 py-1.5 text-[#0a0a0a]">
                    {it.clubName ?? "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-[#0a0a0a]">
                    {it.membershipName ?? "-"}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold ${
                        OWNED_MEMBERSHIP_STATUS_BADGE[it.status] ??
                        "bg-[#f3f4f6] text-[#6b7280]"
                      }`}
                    >
                      {getOwnedMembershipStatusLabel(it.status) ?? it.status}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums text-[#0a0a0a]">
                    {it.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  customerId,
  items,
  total,
}: {
  customerId: string;
  items: CustomerHistoryRecentConsultationEntity[];
  total: number;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#d4d4d8] bg-white px-3 py-4 text-center text-[11.5px] text-[#9ca3af]">
        최근 상담 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[#e5e7eb]" />
      <ul className="space-y-3">
        {items.slice(0, 3).map((h, i) => (
          <li key={h.id} className="relative pl-5">
            <span
              className={`absolute left-[2px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                i === 0
                  ? "border-[#0a0a0a] bg-[#0a0a0a]"
                  : "border-[#d4d4d8] bg-white"
              }`}
            />
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] font-bold text-[#0a0a0a]">
                {h.tradeType} · {h.clubName}
              </span>
              {h.registrationDate && (
                <span className="shrink-0 font-mono text-[10.5px] text-[#9ca3af]">
                  {formatYmd(h.registrationDate)}
                </span>
              )}
            </div>
            <p className="m-0 text-[11.5px] leading-[1.55] text-[#52525b]">
              {h.membershipName}
              <span className="mx-1.5 text-[#d4d4d8]">·</span>
              {h.approvalStatus}
            </p>
          </li>
        ))}
      </ul>
      {total > items.length && (
        <Link
          href={`/customers/${customerId}`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[11.5px] font-medium text-[#374151] hover:bg-[#fafafa]"
        >
          전체 상담 메모 보기 →
        </Link>
      )}
    </div>
  );
}

function TradesTab({
  customerId,
  items,
  total,
}: {
  customerId: string;
  items: CustomerHistoryRecentMembershipTradeEntity[];
  total: number;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[#d4d4d8] bg-white px-3 py-4 text-center text-[11.5px] text-[#9ca3af]">
        최근 거래 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-[#e5e7eb]" />
      <ul className="space-y-3">
        {items.slice(0, 3).map((t, i) => (
          <li key={t.id} className="relative pl-5">
            <span
              className={`absolute left-[2px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                i === 0
                  ? "border-[#0a0a0a] bg-[#0a0a0a]"
                  : "border-[#d4d4d8] bg-white"
              }`}
            />
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] font-bold text-[#0a0a0a]">
                {t.tradeType} · {t.clubName}
              </span>
              {t.contractDate && (
                <span className="shrink-0 font-mono text-[10.5px] text-[#9ca3af]">
                  {formatYmd(t.contractDate)}
                </span>
              )}
            </div>
            <p className="m-0 text-[11.5px] leading-[1.55] text-[#52525b]">
              {t.membershipName}
              <span className="mx-1.5 text-[#d4d4d8]">·</span>
              {t.workflowStatus}
            </p>
          </li>
        ))}
      </ul>
      {total > items.length && (
        <Link
          href={`/customers/${customerId}`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[11.5px] font-medium text-[#374151] hover:bg-[#fafafa]"
        >
          전체 거래 내역 보기 →
        </Link>
      )}
    </div>
  );
}

function DefRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[68px_1fr] gap-2.5 border-b border-[#f3f4f6] py-2 text-[12px] last:border-b-0">
      <div className="font-medium text-[#6b7280]">{label}</div>
      <div className="text-[#0a0a0a]">{children}</div>
    </div>
  );
}

function formatYmd(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${dd}`;
}
