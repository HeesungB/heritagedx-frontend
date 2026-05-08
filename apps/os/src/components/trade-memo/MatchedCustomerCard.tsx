"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppStores } from "@/stores";
import {
  getCustomerGradeLabel,
  getOwnedMembershipStatusLabel,
  mapConsultationDtoToEntity,
  useCustomers,
  type ConsultationEntity,
  type CustomerEntity,
} from "@heritage-dx/store";
import { useConsultationRepository } from "@heritage-dx/api";
import { StatusBadge } from "@/components/approval/StatusBadge";

interface Props {
  customerId: string | null;
}

type TabKey = "info" | "memberships" | "history";

const HISTORY_FETCH_LIMIT = 100;

export default function MatchedCustomerCard({ customerId }: Props) {
  const { customer: customerStore } = useAppStores();
  const { items, getOne } = useCustomers(customerStore);
  const consultationRepo = useConsultationRepository();

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<TabKey>("info");
  const [customer, setCustomer] = useState<CustomerEntity | null>(null);
  const [consultations, setConsultations] = useState<ConsultationEntity[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setConsultations([]);
      setHistoryTotal(0);
      return;
    }
    let cancelled = false;
    setLoading(true);

    // store.items 에 캐시된 단건이 있으면 즉시 노출, 그 후 신선한 값으로 덮어쓴다.
    const cached = items.find((c) => c.id === customerId) ?? null;
    if (cached) setCustomer(cached);

    void Promise.all([
      getOne(customerId),
      consultationRepo.getAll({
        customerId,
        limit: HISTORY_FETCH_LIMIT,
        sort: "registrationDate",
        order: "DESC",
      }),
    ]).then(([nextCustomer, response]) => {
      if (cancelled) return;
      if (nextCustomer) setCustomer(nextCustomer);
      if (response.success && response.data) {
        setConsultations(response.data.trades.map(mapConsultationDtoToEntity));
        setHistoryTotal(
          response.data.pagination?.total ?? response.data.trades.length,
        );
      } else {
        setConsultations([]);
        setHistoryTotal(0);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  if (!customerId) return null;
  if (!customer) {
    return (
      <div className="mt-1 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-3 text-[11.5px] text-[#6b7280]">
        {loading ? "고객 정보 불러오는 중…" : "고객 정보를 찾을 수 없습니다."}
      </div>
    );
  }

  const gradeLabel = getCustomerGradeLabel(customer.customerGrade);
  const region = customer.residenceArea ?? customer.address ?? null;

  return (
    <div className="mt-1 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#fafafa]">
      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-bold text-white">
            {customer.name.slice(0, 1) || "·"}
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
          {/* Tabs */}
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
              count={historyTotal || null}
            />
          </div>

          {/* Tab body */}
          <div className="px-3.5 py-3">
            {tab === "info" && (
              <InfoTab customer={customer} customerId={customerId} />
            )}
            {tab === "memberships" && <MembershipsTab customer={customer} />}
            {tab === "history" && (
              <HistoryTab
                customerId={customerId}
                items={consultations}
                total={historyTotal}
              />
            )}
          </div>
        </div>
      )}
    </div>
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
          {customer.contact || "—"}
        </span>
      </DefRow>
      <DefRow label="이메일">{customer.email || "—"}</DefRow>
      <DefRow label="직업">{customer.occupation || "—"}</DefRow>
      <DefRow label="연령대">{customer.ageBracket || "—"}</DefRow>
      <DefRow label="거주지">
        {customer.residenceArea || customer.address || "—"}
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
                    {it.clubName ?? "—"}
                  </td>
                  <td className="px-2.5 py-1.5 text-[#0a0a0a]">
                    {it.membershipName ?? "—"}
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
  items: ConsultationEntity[];
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
    <div>
      <div className="max-h-72 overflow-y-auto pr-1">
        <div className="relative">
          <div className="pointer-events-none absolute left-1.5 top-2 bottom-2 w-px bg-[#e5e7eb]" />
          <ul className="space-y-3">
            {items.map((h, i) => (
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
              <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] leading-[1.55] text-[#52525b]">
                <span>{h.membershipType}</span>
                <span className="text-[#d4d4d8]">·</span>
                <StatusBadge status={h.approvalStatus} />
              </div>
            </li>
            ))}
          </ul>
        </div>
      </div>
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
  if (!value) return "—";
  // ISO datetime 또는 날짜 문자열을 YYYY.MM.DD 형식으로.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${dd}`;
}
