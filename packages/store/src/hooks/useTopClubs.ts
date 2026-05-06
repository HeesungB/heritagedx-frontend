"use client";

import { useCallback, useMemo } from "react";
import { useFavoriteClubs, type FavoriteClubMeta } from "./useFavoriteClubs";
import { useRecentSearches } from "./useRecentSearches";

export interface TopClubLookupItem {
  code: string;
  name: string;
  region?: string;
  holes?: string;
}

export interface UseTopClubsResult {
  topClubCodes: string[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (code: string, meta?: FavoriteClubMeta) => void;
  trackSelection: (item: TopClubLookupItem) => void;
}

export function useTopClubs(allClubs: TopClubLookupItem[], max = 5): UseTopClubsResult {
  const { favoriteItems, isFavorite, toggleFavorite } = useFavoriteClubs();
  const { recents, push } = useRecentSearches("clubs");

  const topClubCodes = useMemo(() => {
    const allCodes = new Set(allClubs.map((c) => c.code));
    const seen = new Set<string>();
    const codes: string[] = [];

    // 1) 즐겨찾기를 먼저 채운다.
    for (const fav of favoriteItems) {
      if (codes.length >= max) break;
      if (!allCodes.has(fav.code) || seen.has(fav.code)) continue;
      codes.push(fav.code);
      seen.add(fav.code);
    }
    // 2) 남은 슬롯을 최근 선택으로 보충. "clubs" scope 내 항목은 모두 club 코드이므로
    //    kind 필드를 따지지 않는다 — HomeClient 가 region 을 kind 에 담아 push 해도 누락되지 않게.
    if (codes.length < max) {
      for (const r of recents) {
        if (codes.length >= max) break;
        if (!allCodes.has(r.value) || seen.has(r.value)) continue;
        codes.push(r.value);
        seen.add(r.value);
      }
    }
    return codes;
  }, [allClubs, favoriteItems, recents, max]);

  const trackSelection = useCallback(
    (item: TopClubLookupItem) => {
      if (!item.code || !item.name) return;
      push({ label: item.name, value: item.code, kind: "club" });
    },
    [push],
  );

  return { topClubCodes, isFavorite, toggleFavorite, trackSelection };
}
