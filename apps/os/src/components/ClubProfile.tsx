"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Gift,
  Coins,
  TrendingUp,
  Wallet,
  FolderClosed,
  MapPin,
  ScrollText,
} from "lucide-react";
import { Club, ClubDetail } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@heritage-dx/ui";
import TradeMemoSidebar from "./TradeMemoSidebar";
import MapSidebar from "./MapSidebar";
import ClubBasicInfoTable from "./club-profile/ClubBasicInfoTable";
import BenefitsSheetSection from "./club-profile/BenefitsSheetSection";
import EstimateSection from "./club-profile/EstimateSection";
import PriceChart, { PRICE_CHART_PERIODS } from "./club-profile/PriceChart";
import SectionCard from "./club-profile/SectionCard";
import ClubSwitcher from "./club-profile/ClubSwitcher";
import { useHeaderActions } from "@/contexts/HeaderActionsContext";
import type { MarketPricePeriod } from "@heritage-dx/store";
import { trackEvent } from "@/lib/gtag";
import {
  useSheetStorage,
  loadCustomTemplates,
  saveCustomTemplates,
  migrateOldStorageKeys,
} from "@/hooks/useSheetStorage";

type ProfileTab = "membership" | "infoSheet" | "estimate";
type OwnerType = "personal" | "corporate";

function matchOwnerType(
  m: ClubDetail["memberships"][number],
  type: OwnerType,
): boolean {
  const text = `${m.membershipName ?? ""} ${m.membershipType ?? ""}`.toLowerCase();
  if (type === "personal") return /개인|personal/.test(text);
  return /법인|corporate/.test(text);
}

interface ClubProfileProps {
  detail: ClubDetail | null;
  loading: boolean;
  clubs?: Club[];
  onClubNavigate?: (clubCode: string) => void;
}

function splitLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5 text-[13px] leading-[20px] tracking-[-0.005em] text-[#4a5565]">
      {items.map((line, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="shrink-0 text-[#99a1af]">{idx + 1}.</span>
          <span className="whitespace-pre-wrap">{line}</span>
        </li>
      ))}
    </ol>
  );
}

function GreenFeeTable({
  weekday,
  weekend,
}: {
  weekday: Record<string, number>;
  weekend: Record<string, number>;
}) {
  const memberKeys = Array.from(
    new Set([...Object.keys(weekday), ...Object.keys(weekend)]),
  );
  const formatVal = (v: number | undefined) => {
    if (v == null) return "-";
    return (v / 10000).toLocaleString();
  };
  if (memberKeys.length === 0) {
    return (
      <p className="py-4 text-center text-[13px] text-[#99a1af]">
        등록된 그린피 정보가 없습니다.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-gray-50 text-[#4a5565]">
            <th className="border-b border-gray-200 px-3 py-2 text-left font-medium">
              구분
            </th>
            {memberKeys.map((key) => (
              <th
                key={key}
                className="border-b border-l border-gray-200 px-3 py-2 font-medium"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[#101828]">
          <tr>
            <td className="bg-gray-50 px-3 py-2 font-medium text-[#4a5565]">
              주중
            </td>
            {memberKeys.map((key) => (
              <td
                key={key}
                className="border-l border-gray-200 px-3 py-2 text-center font-bold"
              >
                {formatVal(weekday[key])}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-t border-gray-200 bg-gray-50 px-3 py-2 font-medium text-[#4a5565]">
              주말
            </td>
            {memberKeys.map((key) => (
              <td
                key={key}
                className="border-l border-t border-gray-200 px-3 py-2 text-center font-bold"
              >
                {formatVal(weekend[key])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FeeLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2">
      <span className="text-[12px] text-[#4a5565]">{label}</span>
      <span className="text-[13px] font-bold text-[#101828]">
        {(value / 10000).toLocaleString()}
        <span className="ml-0.5 text-[11px] font-medium text-[#6a7282]">
          만원
        </span>
      </span>
    </div>
  );
}

function CostsTable({
  costs,
}: {
  costs: ClubDetail["costs"];
}) {
  const rows: { label: string; value: string | null }[] = [
    { label: "명의개서료", value: costs.registrationFee },
    { label: "인지대", value: costs.stampDuty },
    { label: "대행수수료", value: costs.agencyFee },
    { label: "기타비용", value: costs.otherCosts },
  ];
  const visible = rows.filter((r) => r.value);
  if (visible.length === 0) {
    return (
      <p className="py-4 text-center text-[13px] text-[#99a1af]">
        등록된 비용 정보가 없습니다.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full border-collapse table-fixed text-[13px]">
        <colgroup>
          <col className="w-28" />
          <col />
          <col className="w-28" />
          <col />
        </colgroup>
        <tbody>
          {Array.from({ length: Math.ceil(visible.length / 2) }).map((_, i) => {
            const left = visible[i * 2];
            const right = visible[i * 2 + 1];
            return (
              <tr key={i}>
                <td className="border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-[#4a5565]">
                  {left.label}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {left.value}
                </td>
                {right ? (
                  <>
                    <td className="border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-[#4a5565]">
                      {right.label}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {right.value}
                    </td>
                  </>
                ) : (
                  <td colSpan={2} className="border border-gray-200" />
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DocumentsBox({
  title,
  tone,
  text,
}: {
  title: string;
  tone: "buy" | "sell";
  text: string | null | undefined;
}) {
  const styles =
    tone === "buy"
      ? "border-rose-200 bg-rose-50/50"
      : "border-blue-200 bg-blue-50/50";
  const titleColor = tone === "buy" ? "text-rose-700" : "text-blue-700";
  return (
    <div className={`rounded-lg border ${styles} p-4`}>
      <p className={`mb-2 text-[13px] font-semibold ${titleColor}`}>{title}</p>
      {text ? (
        <p className="whitespace-pre-wrap text-[12px] leading-[18px] tracking-[-0.005em] text-[#4a5565]">
          {text}
        </p>
      ) : (
        <p className="text-[12px] text-[#99a1af]">정보 없음</p>
      )}
    </div>
  );
}

function MembershipInfoBlock({
  membership,
  marketMembershipInfo,
  reservationNotes,
}: {
  membership: ClubDetail["memberships"][number];
  marketMembershipInfo?: string | null;
  reservationNotes?: string | null;
}) {
  const benefits = splitLines(membership.memberBenefits);
  const otherInfoLines = splitLines(marketMembershipInfo);

  const tableRows: { label: string; value: string | null }[] = [
    {
      label: "회원권명",
      value: membership.membershipName || membership.membershipType || null,
    },
    {
      label: "분양가",
      value:
        [membership.initialSalePrice, membership.initialSaleMethod]
          .filter(Boolean)
          .join(" · ") || null,
    },
    {
      label: "특이사항",
      value: membership.specialNotes,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full border-collapse table-fixed text-[13px]">
          <colgroup>
            <col className="w-24" />
            <col />
          </colgroup>
          <tbody>
            {tableRows
              .filter((r) => r.value)
              .map((row) => (
                <tr key={row.label}>
                  <td className="border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-[#4a5565]">
                    {row.label}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 whitespace-pre-wrap">
                    {row.value}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {(benefits.length > 0 || otherInfoLines.length > 0) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {benefits.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="mb-2 text-[13px] font-semibold text-amber-700">
                회원혜택
              </p>
              <NumberedList items={benefits} />
            </div>
          )}
          {otherInfoLines.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-2 text-[13px] font-semibold text-[#4a5565]">
                기타정보
              </p>
              <ul className="space-y-1 text-[13px] leading-[20px] tracking-[-0.005em] text-[#4a5565]">
                {otherInfoLines.map((line, idx) => (
                  <li key={idx} className="whitespace-pre-wrap">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {reservationNotes && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <p className="mb-2 text-[13px] font-semibold text-blue-700">
            예약안내
          </p>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-[20px] tracking-[-0.005em] text-[#4a5565]">
            {reservationNotes}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ClubProfile({
  detail,
  loading,
  clubs,
  onClubNavigate,
}: ClubProfileProps) {
  const { user } = useAuth();
  const { setActions } = useHeaderActions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("membership");
  const [isMemoSidebarOpen, setIsMemoSidebarOpen] = useState(false);
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(false);
  const [ownerType, setOwnerType] = useState<OwnerType>("personal");
  const [selectedMembershipIndex, setSelectedMembershipIndex] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<MarketPricePeriod>("3m");
  const prevDetailCode = useRef<string | null>(null);

  const estimateStorage = useSheetStorage(detail?.code, "estimate");
  const benefitsStorage = useSheetStorage(detail?.code, "benefits");

  const [customTemplates, setCustomTemplates] = useState<string[]>(() =>
    loadCustomTemplates(),
  );

  useEffect(() => {
    migrateOldStorageKeys();
  }, []);

  useEffect(() => {
    saveCustomTemplates(customTemplates);
  }, [customTemplates]);

  useEffect(() => {
    setSelectedMembershipIndex(0);
    setOwnerType("personal");
  }, [detail?.code]);

  useEffect(() => {
    setSelectedMembershipIndex(0);
  }, [ownerType]);

  useEffect(() => {
    if (detail && !loading && detail.code !== prevDetailCode.current) {
      prevDetailCode.current = detail.code;
      trackEvent("club_view", { club_name: detail.name });
    }
  }, [detail, loading]);

  useEffect(() => {
    if (!detail) {
      setActions(null);
      return;
    }
    setActions(
      <div className="flex items-center gap-3">
        <ClubSwitcher
          currentClub={{ code: detail.code, name: detail.name }}
          clubs={clubs ?? []}
          onSelect={(code) => onClubNavigate?.(code)}
        />
        {detail.basicInfo.holes && (
          <span className="text-[13px] text-[#6a7282]">
            {detail.basicInfo.holes}
          </span>
        )}
      </div>,
    );
    return () => setActions(null);
  }, [detail, clubs, onClubNavigate, setActions]);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f5f5f5] p-6">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <div className="flex justify-center py-8">
            <Loading text="골프장 정보 로딩 중..." />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f5f5f5] p-6">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-center text-[13px] text-[#6a7282]">
          골프장을 선택해 주세요.
        </div>
      </div>
    );
  }

  const allMemberships = detail.memberships ?? [];
  const filteredByOwner = allMemberships.filter((m) =>
    matchOwnerType(m, ownerType),
  );
  const filteredMemberships =
    filteredByOwner.length > 0 ? filteredByOwner : allMemberships;
  const selectedMembership =
    filteredMemberships[selectedMembershipIndex] ?? filteredMemberships[0];
  const primaryContact =
    detail.contacts?.find((c) => c.isPrimary) || detail.contacts?.[0];

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "membership", label: "회원권 정보" },
    { id: "infoSheet", label: "혜택지" },
    { id: "estimate", label: "견적서" },
  ];

  const initialSaleSummary = selectedMembership
    ? [selectedMembership.initialSalePrice, selectedMembership.initialSaleMethod]
        .filter(Boolean)
        .join(" · ")
    : "";
  const reservationNotesText =
    selectedMembership?.reservationNotes ??
    detail.registration.reservationNotes ??
    null;
  const idxInAll = selectedMembership
    ? allMemberships.findIndex((m) => m.id === selectedMembership.id)
    : -1;
  const safeIndexInAll = idxInAll >= 0 ? idxInAll : 0;

  return (
    <div className="flex min-w-0 flex-1 print:block">
      <div className="flex-1 min-w-0 bg-[#f5f5f5] print:p-0">
        {/* 헤더 */}
        <div className="border-b border-[#e5e7eb] bg-white">
          <div className="px-6 pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[24px] font-bold tracking-[-0.01em] text-[#101828]">
                {detail.name}
              </h2>
              {detail.basicInfo.holes && (
                <span className="text-[14px] text-[#6a7282]">
                  {detail.basicInfo.holes}
                </span>
              )}
              {selectedMembership?.recentPriceUpdateDate && (
                <span className="text-[12px] text-[#99a1af]">
                  매물 시세 · {selectedMembership.recentPriceUpdateDate} 기준
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {!isMapSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMapSidebarOpen(true);
                      setIsMemoSidebarOpen(false);
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 text-[12px] font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                    지도
                  </button>
                )}
                {!isMemoSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemoSidebarOpen(true);
                      setIsMapSidebarOpen(false);
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12px] font-medium text-white hover:bg-emerald-700"
                  >
                    <ScrollText className="h-3.5 w-3.5" strokeWidth={2} />
                    상담일지
                  </button>
                )}
              </div>
            </div>

            {allMemberships.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex h-8 items-center rounded-lg border border-[#e5e7eb] bg-white p-0.5">
                  {(["personal", "corporate"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOwnerType(t)}
                      className={`h-7 rounded-md px-3 text-[12px] font-medium transition-colors ${
                        ownerType === t
                          ? "bg-[#101828] text-white"
                          : "text-[#6a7282] hover:text-[#101828]"
                      }`}
                    >
                      {t === "personal" ? "개인" : "법인"}
                    </button>
                  ))}
                </div>
                {filteredMemberships.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filteredMemberships.map((m, index) => (
                      <button
                        key={m.id || index}
                        type="button"
                        onClick={() => setSelectedMembershipIndex(index)}
                        className={`h-7 rounded-md border px-3 text-[12px] font-medium transition-colors ${
                          selectedMembershipIndex === index
                            ? "border-[#101828] bg-[#101828] text-white"
                            : "border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-gray-50"
                        }`}
                      >
                        {m.membershipName || m.membershipType || `회원권 ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <p className="text-[11px] tracking-[-0.005em] text-[#6a7282]">
                  회원권
                </p>
                <p className="mt-1 text-[18px] font-bold tracking-[-0.01em] text-[#101828]">
                  {selectedMembership?.membershipName ||
                    selectedMembership?.membershipType ||
                    "-"}
                </p>
                {initialSaleSummary && (
                  <p className="mt-1 text-[11px] text-[#6a7282]">
                    {initialSaleSummary}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <p className="text-[11px] font-medium tracking-[-0.005em] text-[#dc2626]">
                  매수
                </p>
                <p className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#dc2626]">
                  {selectedMembership?.recentMarketPrice ||
                    detail.marketInfo.recentMarketPrice ||
                    "-"}
                </p>
                <p className="mt-1 text-[11px] text-[#6a7282]">단위: 만원</p>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <p className="text-[11px] font-medium tracking-[-0.005em] text-[#2563eb]">
                  매도
                </p>
                <p className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#2563eb]">
                  {selectedMembership?.dealerPriceRange ||
                    detail.marketInfo.dealerPriceRange ||
                    "-"}
                </p>
                <p className="mt-1 text-[11px] text-[#6a7282]">단위: 만원</p>
              </div>
            </div>
          </div>

          <div className="mt-4 px-6">
            <div className="flex gap-1 border-b border-[#f3f4f6]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`-mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-[#101828] text-[#101828]"
                      : "border-transparent text-[#99a1af] hover:text-[#4a5565]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {activeTab === "membership" && (
            <div className="space-y-4">
              <SectionCard
                number="01"
                title="골프장 정보"
                subtitle="기본 정보 및 코스 개요"
                Icon={Building2}
              >
                <ClubBasicInfoTable
                  companyName={detail.companyName ?? undefined}
                  openingDate={detail.basicInfo.openingDate ?? undefined}
                  holes={detail.basicInfo.holes ?? undefined}
                  memberCount={
                    detail.basicInfo.memberCount != null
                      ? String(detail.basicInfo.memberCount)
                      : undefined
                  }
                  address={detail.address}
                  region={detail.region}
                  memberDaySchedule={
                    selectedMembership?.memberDaySchedule ?? undefined
                  }
                  phoneNumber={primaryContact?.phoneNumber ?? undefined}
                  totalLength={detail.basicInfo.totalLength ?? undefined}
                  introduction={detail.basicInfo.introduction ?? undefined}
                  facilities={detail.basicInfo.facilities ?? undefined}
                  website={detail.website ?? undefined}
                />
              </SectionCard>

              {selectedMembership ? (
                <SectionCard
                  number="02"
                  title="회원권 정보"
                  subtitle={`${
                    selectedMembership.membershipName ||
                    selectedMembership.membershipType ||
                    ""
                  } 상세`}
                  Icon={Gift}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                >
                  <MembershipInfoBlock
                    membership={selectedMembership}
                    marketMembershipInfo={detail.marketInfo.membershipInfo}
                    reservationNotes={reservationNotesText}
                  />
                </SectionCard>
              ) : (
                <SectionCard
                  number="02"
                  title="회원권 정보"
                  Icon={Gift}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                >
                  <p className="py-4 text-center text-[13px] text-[#99a1af]">
                    등록된 회원권이 없습니다.
                  </p>
                </SectionCard>
              )}

              <SectionCard
                number="03"
                title="그린피 정보"
                subtitle={`${
                  selectedMembership?.membershipName ||
                  selectedMembership?.membershipType ||
                  ""
                } 기준 · 단위: 만원`}
                Icon={Coins}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              >
                <GreenFeeTable
                  weekday={selectedMembership?.weekdayGreenFee ?? {}}
                  weekend={selectedMembership?.weekendGreenFee ?? {}}
                />
                {(detail.costs.cartFee != null ||
                  detail.costs.caddyFee != null) && (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {detail.costs.cartFee != null && (
                      <FeeLine label="카트피" value={detail.costs.cartFee} />
                    )}
                    {detail.costs.caddyFee != null && (
                      <FeeLine label="캐디피" value={detail.costs.caddyFee} />
                    )}
                  </div>
                )}
              </SectionCard>

              {selectedMembership?.id && (
                <SectionCard
                  number="04"
                  title="시세 추이"
                  subtitle="단위: 만원"
                  Icon={TrendingUp}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                  toolbar={
                    <div className="flex gap-1">
                      {PRICE_CHART_PERIODS.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setChartPeriod(key)}
                          className={`h-7 rounded-md px-2.5 text-[12px] font-medium transition-colors ${
                            chartPeriod === key
                              ? "bg-[#101828] text-white"
                              : "border border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <PriceChart
                    membershipId={selectedMembership.id}
                    period={chartPeriod}
                  />
                </SectionCard>
              )}

              <SectionCard
                number="05"
                title="기타 비용"
                subtitle="명의개서 시 발생 비용"
                Icon={Wallet}
                iconBg="bg-gray-100"
                iconColor="text-gray-600"
              >
                <CostsTable costs={detail.costs} />
              </SectionCard>

              <SectionCard
                number="06"
                title="구비서류"
                subtitle="매수/매도 시 필요 서류"
                Icon={FolderClosed}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DocumentsBox
                    title="매수 서류"
                    tone="buy"
                    text={selectedMembership?.buyerDocuments}
                  />
                  <DocumentsBox
                    title="매도 서류"
                    tone="sell"
                    text={selectedMembership?.sellerDocuments}
                  />
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "infoSheet" && (
            <BenefitsSheetSection
              detail={detail}
              selectedMembershipIndex={safeIndexInAll}
              fieldOverrides={benefitsStorage.overrides}
              onFieldOverrideChange={benefitsStorage.setOverride}
              hiddenSheetItems={benefitsStorage.hiddenItems}
              onHiddenSheetItemsChange={benefitsStorage.setHiddenItems}
              customItems={benefitsStorage.customItems}
              onCustomItemsChange={benefitsStorage.setCustomItems}
              customTemplates={customTemplates}
              onCustomTemplatesChange={setCustomTemplates}
              defaultManagerName={user?.name}
            />
          )}

          {activeTab === "estimate" && (
            <EstimateSection
              detail={detail}
              selectedMembershipIndex={safeIndexInAll}
              fieldOverrides={estimateStorage.overrides}
              onFieldOverrideChange={estimateStorage.setOverride}
            />
          )}
        </div>
      </div>

      {isMapSidebarOpen && detail && (
        <MapSidebar
          currentAddress={detail.address}
          clubName={detail.name}
          onClose={() => setIsMapSidebarOpen(false)}
          clubs={clubs}
          onClubSelect={onClubNavigate}
        />
      )}

      {isMemoSidebarOpen && detail && (
        <TradeMemoSidebar
          clubDetail={detail}
          onClose={() => setIsMemoSidebarOpen(false)}
        />
      )}
    </div>
  );
}
