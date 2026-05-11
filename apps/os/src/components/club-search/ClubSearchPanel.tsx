"use client";

import { Fragment, useMemo, useState } from "react";
import { Search, MapPin, Phone, Star } from "lucide-react";
import { useClubs, useTopClubs } from "@heritage-dx/store";
import type { ClubEntity } from "@heritage-dx/store";
import { useAppStores } from "@/stores";
import {
  INITIALS,
  getKoreanInitial,
  normalizeInitial,
  REGION_GROUPS,
  getRegionGroup,
} from "@heritage-dx/utils";

type RegionKey = "ALL" | (typeof REGION_GROUPS)[number];

const REGION_TABS: { key: RegionKey; label: string }[] = [
  { key: "ALL", label: "전체보기" },
  ...REGION_GROUPS.map((g) => ({ key: g, label: g })),
];

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
  neutral: "bg-[#f1f5f9] text-[#45556c]",
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
      className={`inline-flex h-[22px] items-center gap-1 rounded px-2 text-[11px] font-bold tracking-[0.005em] ${BADGE_TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

function ClubCard({
  club,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: {
  club: ClubEntity;
  onSelect?: (code: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const group = getRegionGroup(club.region);
  const operationType = club.operationTypes[0];
  const operationLabel = operationType ? getOperationLabel(operationType) : "";
  const addressText = club.address || club.region;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onSelect?.(club.code)}
        className="group block w-full rounded-[10px] border border-[#e2e8f0] bg-white p-3.5 text-left transition duration-150 hover:-translate-y-px hover:shadow-[0_4px_14px_0_rgba(15,23,43,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101828]"
      >
        <div className="flex flex-wrap items-center gap-1.5 pr-7">
          {group && <Badge>{group}</Badge>}
          {operationLabel && (
            <Badge tone={getOperationTone(operationLabel)}>{operationLabel}</Badge>
          )}
          {club.holes && <Badge>{club.holes}</Badge>}
        </div>

        <h3
          title={club.name}
          className="mt-2 truncate text-[15px] font-bold leading-[20px] tracking-[-0.01em] text-[#0f172b]"
        >
          {club.name}
        </h3>

        <div className="mt-2 flex flex-col gap-1.5 text-[12px] leading-[17px] tracking-[-0.005em] text-[#62748e]">
          {addressText && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#90a1b9]" strokeWidth={1.5} />
              <span className="truncate">{addressText}</span>
            </p>
          )}
          {club.contact && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#90a1b9]" strokeWidth={1.5} />
              <span className="truncate">{club.contact}</span>
            </p>
          )}
        </div>
      </button>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/80 backdrop-blur-sm transition-colors hover:bg-gray-100"
        >
          <Star
            className={`h-4 w-4 ${
              isFavorite ? "fill-amber-400 stroke-amber-500" : "stroke-gray-300"
            }`}
            strokeWidth={1.8}
          />
        </button>
      )}
    </div>
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

  const { topClubCodes, isFavorite, toggleFavorite, trackSelection } =
    useTopClubs(clubs, 5);

  const topClubs = useMemo(() => {
    const byCode = new Map(clubs.map((c) => [c.code, c]));
    return topClubCodes
      .map((code) => byCode.get(code))
      .filter((c): c is ClubEntity => Boolean(c));
  }, [clubs, topClubCodes]);

  const hasActiveFilter =
    Boolean(keyword.trim()) || region !== "ALL" || selectedInitial !== null;

  const handleSelect = (code: string) => {
    const club = clubs.find((c) => c.code === code);
    if (club) trackSelection({ code: club.code, name: club.name });
    onSelect?.(code);
  };

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
      if (region !== "ALL" && getRegionGroup(c.region) !== region) return false;
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
    <section className="mx-auto w-full max-w-[1500px] px-6 py-5 lg:px-8">
      <header>
        <h1 className="text-[22px] font-bold leading-[28px] tracking-[-0.016em] text-[#0f172b]">
          골프장 정보 검색
        </h1>
        <p className="mt-0.5 text-[13px] leading-[18px] tracking-[-0.012em] text-[#62748e]">
          전국 제휴 및 등록 골프장의 상세 정보를 빠르고 정확하게 확인하세요.
        </p>
      </header>

      <div className="mt-4 flex h-11 items-center gap-2 rounded-[10px] border border-[#90a1b9] bg-white px-4 focus-within:border-[#0f172b]">
        <Search className="h-4 w-4 shrink-0 text-[#90a1b9]" strokeWidth={1.75} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="골프장명, 지역, 연락처 등으로 검색해보세요."
          className="h-full flex-1 bg-transparent text-[14px] font-medium tracking-[-0.022em] text-[#0f172b] placeholder:text-[#90a1b9] focus:outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {REGION_TABS.map((tab) => {
          const active = region === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRegion(tab.key)}
              className={[
                "h-8 rounded-lg border px-3.5 text-[13px] font-bold leading-[18px] tracking-[-0.012em] transition-colors",
                active
                  ? "border-[#0f172b] bg-[#0f172b] text-white"
                  : "border-[#e2e8f0] bg-white text-[#314158] hover:bg-[#f8fafc]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1 rounded-[10px] border border-[#e2e8f0] bg-white px-2 py-1.5">
        {INITIALS.map((initial, idx) => {
          const has = initialsWithClubs.has(initial);
          const active = selectedInitial === initial;
          const isLast = idx === INITIALS.length - 1;
          return (
            <Fragment key={initial}>
              {isLast && (
                <span aria-hidden className="mx-1 h-4 w-px bg-[#e2e8f0]" />
              )}
              <button
                type="button"
                disabled={!has}
                onClick={() => setSelectedInitial(active ? null : initial)}
                className={[
                  "inline-flex h-7 items-center justify-center rounded-md text-[13px] font-semibold transition-colors",
                  initial === "0-9" ? "px-2" : "w-8",
                  active
                    ? "bg-[#0f172b] text-white"
                    : has
                      ? "bg-transparent text-[#62748e] hover:bg-[#f1f5f9] hover:text-[#0f172b]"
                      : "cursor-not-allowed bg-transparent text-[#cbd5e1]",
                ].join(" ")}
              >
                {initial}
              </button>
            </Fragment>
          );
        })}
      </div>

      {!hasActiveFilter && topClubs.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" strokeWidth={1.8} />
            <p className="text-[13px] font-bold leading-[18px] tracking-[-0.012em] text-[#0f172b]">
              즐겨찾기 · 최근
            </p>
            <span className="text-[11px] leading-[16px] text-[#90a1b9]">
              {topClubs.length}건
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {topClubs.map((club) => (
              <ClubCard
                key={`top-${club.code}`}
                club={club}
                onSelect={handleSelect}
                isFavorite={isFavorite(club.code)}
                onToggleFavorite={() =>
                  toggleFavorite(club.code, {
                    name: club.name,
                    region: club.region,
                    holes: club.holes,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between">
        <p className="text-[14px] font-bold leading-[20px] tracking-[-0.012em] text-[#0f172b]">
          전체 목록 {filtered.length}건
        </p>
        <span className="text-[12px] leading-[16px] text-[#62748e]">
          최근 업데이트순
        </span>
      </div>

      {isLoading && filtered.length === 0 ? (
        <p className="mt-12 text-center text-[13px] text-[#62748e]">불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-center text-[13px] text-[#62748e]">
          조건에 맞는 골프장이 없습니다.
        </p>
      ) : (
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((club) => (
            <ClubCard
              key={club.code}
              club={club}
              onSelect={handleSelect}
              isFavorite={isFavorite(club.code)}
              onToggleFavorite={() =>
                toggleFavorite(club.code, {
                  name: club.name,
                  region: club.region,
                  holes: club.holes,
                })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

