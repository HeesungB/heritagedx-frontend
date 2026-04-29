"use client";

import { useMemo, useState } from "react";
import { Search, MapPin, Phone } from "lucide-react";
import { useClubs } from "@heritage-dx/store";
import type { ClubEntity } from "@heritage-dx/store";
import { useAppStores } from "@/stores";
import {
  INITIALS,
  getKoreanInitial,
  normalizeInitial,
} from "@/components/ClubDirectory";

type RegionKey =
  | "ALL"
  | "SUDOGWON"
  | "GANGWON"
  | "CHUNGCHEONG"
  | "JEOLLA"
  | "GYEONGSANG"
  | "JEJU";

const REGION_TABS: { key: RegionKey; label: string }[] = [
  { key: "ALL", label: "전체보기" },
  { key: "SUDOGWON", label: "수도권" },
  { key: "GANGWON", label: "강원도" },
  { key: "CHUNGCHEONG", label: "충청도" },
  { key: "JEOLLA", label: "전라도" },
  { key: "GYEONGSANG", label: "경상도" },
  { key: "JEJU", label: "제주도" },
];

function getRegionGroup(region: string): { key: RegionKey; label: string } {
  if (/서울|경기|인천/.test(region)) return { key: "SUDOGWON", label: "경기권" };
  if (region.includes("강원")) return { key: "GANGWON", label: "강원권" };
  if (/충청|충[남북]|대전|세종/.test(region))
    return { key: "CHUNGCHEONG", label: "충청권" };
  if (/전라|전[남북]|광주/.test(region))
    return { key: "JEOLLA", label: "전라권" };
  if (/경상|경[남북]|대구|부산|울산/.test(region))
    return { key: "GYEONGSANG", label: "경상권" };
  if (region.includes("제주")) return { key: "JEJU", label: "제주권" };
  return { key: "ALL", label: region.trim() };
}

function getOperationLabel(type: string): string {
  if (type === "MEMBERSHIP") return "회원제";
  if (type === "PUBLIC") return "퍼블릭";
  return type;
}

function getOperationTone(label: string): BadgeTone {
  if (label === "회원제") return "success";
  if (label === "퍼블릭") return "info";
  return "neutral";
}

type BadgeTone = "neutral" | "success" | "info";

const BADGE_TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-[#f3f4f6] text-[#4a5565]",
  success: "bg-[#ecfdf5] text-[#059669]",
  info: "bg-[#eff6ff] text-[#2563eb]",
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium tracking-[-0.005em] ${BADGE_TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

function ClubCard({
  club,
  onSelect,
}: {
  club: ClubEntity;
  onSelect?: (code: string) => void;
}) {
  const group = getRegionGroup(club.region);
  const operationType = club.operationTypes[0];
  const operationLabel = operationType ? getOperationLabel(operationType) : "";
  const addressText = club.address || club.region;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(club.code)}
      className="group rounded-2xl border border-[#e5e7eb] bg-white p-5 text-left transition-shadow hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101828]"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {group.label && <Badge>{group.label}</Badge>}
        {operationLabel && (
          <Badge tone={getOperationTone(operationLabel)}>{operationLabel}</Badge>
        )}
        {club.holes && <Badge>{club.holes} Holes</Badge>}
      </div>

      <h3 className="mt-3 text-[18px] font-bold leading-[26px] tracking-[-0.01em] text-[#101828]">
        {club.name}
      </h3>

      <div className="mt-3 space-y-1.5 text-[13px] leading-[20px] tracking-[-0.005em] text-[#4a5565]">
        {addressText && (
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#99a1af]" strokeWidth={2} />
            <span className="truncate">{addressText}</span>
          </p>
        )}
        {club.contact && (
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#99a1af]" strokeWidth={2} />
            <span>{club.contact}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default function ClubSearchPanel({
  onSelect,
}: {
  onSelect?: (code: string) => void;
}) {
  const { club: clubStore } = useAppStores();
  const { clubs, isLoading } = useClubs(clubStore);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState<RegionKey>("ALL");
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);

  const initialsWithClubs = useMemo(() => {
    const set = new Set<string>();
    for (const c of clubs) {
      set.add(normalizeInitial(getKoreanInitial(c.name)));
    }
    return set;
  }, [clubs]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return clubs.filter((c) => {
      if (region !== "ALL" && getRegionGroup(c.region).key !== region) return false;
      if (
        selectedInitial &&
        normalizeInitial(getKoreanInitial(c.name)) !== selectedInitial
      )
        return false;
      if (!k) return true;
      return (
        c.name.toLowerCase().includes(k) ||
        c.region.toLowerCase().includes(k) ||
        c.address.toLowerCase().includes(k) ||
        (c.contact ?? "").toLowerCase().includes(k)
      );
    });
  }, [clubs, keyword, region, selectedInitial]);

  return (
    <section className="mx-auto w-full max-w-[920px] px-6 py-10 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-bold leading-[36px] tracking-[-0.01em] text-[#101828]">
          골프장 정보 검색
        </h1>
        <p className="mt-2 text-[14px] leading-[22px] tracking-[-0.005em] text-[#6a7282]">
          전국 제휴 및 등록 골프장의 상세 정보를 빠르고 정확하게 확인하세요.
        </p>
      </header>

      <div className="flex h-12 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 focus-within:border-[#101828]">
        <Search className="h-4 w-4 shrink-0 text-[#99a1af]" strokeWidth={2} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="골프장명, 지역, 연락처 등으로 검색해보세요."
          className="h-full flex-1 bg-transparent text-[14px] tracking-[-0.005em] text-[#101828] placeholder:text-[#99a1af] focus:outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {REGION_TABS.map((tab) => {
          const active = region === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRegion(tab.key)}
              className={[
                "h-9 rounded-full px-4 text-[13px] font-medium tracking-[-0.005em] transition-colors",
                active
                  ? "bg-[#101828] text-white"
                  : "bg-white text-[#4a5565] hover:bg-gray-100",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {INITIALS.map((initial) => {
          const has = initialsWithClubs.has(initial);
          const active = selectedInitial === initial;
          return (
            <button
              key={initial}
              type="button"
              disabled={!has}
              onClick={() => setSelectedInitial(active ? null : initial)}
              className={[
                "h-8 rounded-md text-[12px] font-medium transition-colors",
                initial === "0-9" ? "px-2.5" : "w-8",
                active
                  ? "border border-[#101828] bg-[#101828] text-white"
                  : has
                    ? "border border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-gray-100"
                    : "cursor-not-allowed border border-[#f3f4f6] bg-white text-[#d1d5db]",
              ].join(" ")}
            >
              {initial}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[13px] tracking-[-0.005em] text-[#4a5565]">
          전체 목록{" "}
          <span className="font-bold text-[#f97316]">{filtered.length}건</span>
        </p>
        <span className="text-[13px] tracking-[-0.005em] text-[#6a7282]">
          최근 업데이트순
        </span>
      </div>

      {isLoading && filtered.length === 0 ? (
        <p className="mt-12 text-center text-[13px] text-[#6a7282]">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-center text-[13px] text-[#6a7282]">
          조건에 맞는 골프장이 없습니다.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((club) => (
            <ClubCard key={club.code} club={club} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
