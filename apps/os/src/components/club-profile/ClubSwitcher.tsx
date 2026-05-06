"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Star } from "lucide-react";
import { useTopClubs } from "@heritage-dx/store";
import type { Club } from "@/types";
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
  { key: "ALL", label: "전체" },
  { key: "SUDOGWON", label: "수도권" },
  { key: "GANGWON", label: "강원도" },
  { key: "CHUNGCHEONG", label: "충청도" },
  { key: "JEOLLA", label: "전라도" },
  { key: "GYEONGSANG", label: "경상도" },
  { key: "JEJU", label: "제주도" },
];

function getRegionKey(region: string | undefined): RegionKey {
  const r = region ?? "";
  if (/서울|경기|인천/.test(r)) return "SUDOGWON";
  if (r.includes("강원")) return "GANGWON";
  if (/충청|충[남북]|대전|세종/.test(r)) return "CHUNGCHEONG";
  if (/전라|전[남북]|광주/.test(r)) return "JEOLLA";
  if (/경상|경[남북]|대구|부산|울산/.test(r)) return "GYEONGSANG";
  if (r.includes("제주")) return "JEJU";
  return "ALL";
}

export default function ClubSwitcher({
  currentClub,
  clubs,
  onSelect,
}: {
  currentClub: { code: string; name: string };
  clubs: Club[];
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionKey>("ALL");
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setRegion("ALL");
      setSelectedInitial(null);
    }
  }, [open]);

  const initialsWithClubs = useMemo(() => {
    const set = new Set<string>();
    for (const c of clubs) {
      set.add(normalizeInitial(getKoreanInitial(c.name)));
    }
    return set;
  }, [clubs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = clubs.filter((c) => {
      if (region !== "ALL" && getRegionKey(c.region) !== region) return false;
      if (
        selectedInitial &&
        normalizeInitial(getKoreanInitial(c.name)) !== selectedInitial
      )
        return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.region ?? "").toLowerCase().includes(q)
      );
    });
    return result.sort((a, b) => {
      if (a.code === currentClub.code) return -1;
      if (b.code === currentClub.code) return 1;
      return a.name.localeCompare(b.name, "ko");
    });
  }, [clubs, query, region, selectedInitial, currentClub.code]);

  const hasActiveFilter =
    Boolean(query.trim()) || region !== "ALL" || selectedInitial !== null;

  const { topClubCodes, isFavorite, toggleFavorite, trackSelection } =
    useTopClubs(clubs, 5);
  const topClubs = useMemo(() => {
    const byCode = new Map(clubs.map((c) => [c.code, c]));
    return topClubCodes
      .map((code) => byCode.get(code))
      .filter((c): c is Club => Boolean(c));
  }, [clubs, topClubCodes]);

  const handleSelect = (c: Club) => {
    if (c.code === currentClub.code) {
      setOpen(false);
      return;
    }
    trackSelection({ code: c.code, name: c.name });
    onSelect(c.code);
    setOpen(false);
  };

  const handleToggleFavorite = (c: Club) => {
    toggleFavorite(c.code, {
      name: c.name,
      region: c.region,
      holes: c.holes,
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] tracking-[-0.005em] hover:bg-gray-50"
      >
        <Search className="h-4 w-4 shrink-0 text-[#99a1af]" strokeWidth={2} />
        <span className="font-bold text-[#101828]">{currentClub.name}</span>
        <span className="text-[#6a7282]">다른 골프장으로 이동</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#99a1af]" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[420px] rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="border-b border-[#f3f4f6] p-3">
            <div className="flex h-9 items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-2.5 focus-within:border-[#101828]">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#99a1af]" strokeWidth={2} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="골프장명, 지역으로 빠른 검색"
                className="h-full flex-1 bg-transparent text-[12px] tracking-[-0.005em] text-[#101828] placeholder:text-[#99a1af] focus:outline-none"
              />
              <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-[#6a7282]">
                ESC
              </kbd>
            </div>
          </div>

          <div className="border-b border-[#f3f4f6] px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-medium tracking-[0.2px] text-[#99a1af]">
              지역
            </p>
            <div className="flex flex-wrap gap-1">
              {REGION_TABS.map((tab) => {
                const active = region === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRegion(tab.key)}
                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-[#101828] text-white"
                        : "border border-[#e5e7eb] bg-white text-[#4a5565] hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-[#f3f4f6] px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-medium tracking-[0.2px] text-[#99a1af]">
              가나다
            </p>
            <div className="flex flex-wrap gap-1">
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
                      "h-7 rounded-md text-[11px] font-medium transition-colors",
                      initial === "0-9" ? "px-2" : "w-7",
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
          </div>

          {!hasActiveFilter && topClubs.length > 0 && (
            <div className="border-b border-[#f3f4f6] px-3 py-2.5">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium tracking-[0.2px] text-[#99a1af]">
                <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" strokeWidth={1.8} />
                즐겨찾기 · 최근
              </p>
              <div className="flex flex-col gap-0.5">
                {topClubs.map((c) => {
                  const isCurrent = c.code === currentClub.code;
                  const fav = isFavorite(c.code);
                  return (
                    <ClubRow
                      key={`top-${c.code}`}
                      club={c}
                      isCurrent={isCurrent}
                      isFavorite={fav}
                      onSelect={() => handleSelect(c)}
                      onToggleFavorite={() => handleToggleFavorite(c)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-[#99a1af]">
            <span>{hasActiveFilter ? "검색 결과" : "전체 골프장"}</span>
            <span>{filtered.length}개</span>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-1.5 pt-0">
            {filtered.length === 0 ? (
              <p className="px-2.5 py-6 text-center text-[12px] text-[#99a1af]">
                검색 결과가 없습니다.
              </p>
            ) : (
              filtered.map((c) => {
                const isCurrent = c.code === currentClub.code;
                const fav = isFavorite(c.code);
                return (
                  <ClubRow
                    key={c.code}
                    club={c}
                    isCurrent={isCurrent}
                    isFavorite={fav}
                    onSelect={() => handleSelect(c)}
                    onToggleFavorite={() => handleToggleFavorite(c)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClubRow({
  club,
  isCurrent,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  club: Club;
  isCurrent: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md px-2.5 py-2 transition-colors hover:bg-gray-50 ${
        isCurrent ? "bg-gray-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 min-w-0 items-center justify-between text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#101828]">{club.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#6a7282]">
            {[club.region, club.holes].filter(Boolean).join(" · ") || "-"}
          </p>
        </div>
        {isCurrent && (
          <span className="ml-2 shrink-0 text-[11px] font-medium text-[#6a7282]">현재</span>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-gray-100"
      >
        <Star
          className={`h-3.5 w-3.5 ${
            isFavorite ? "fill-amber-400 stroke-amber-500" : "stroke-gray-300"
          }`}
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}
