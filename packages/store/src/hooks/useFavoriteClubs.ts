"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "heritage-dx:club-favorites";

export interface FavoriteClubItem {
  code: string;
  name: string;
  region?: string;
  holes?: string;
}

export type FavoriteClubMeta = Omit<FavoriteClubItem, "code">;

function legacyFallback(code: string): FavoriteClubItem {
  return { code, name: code };
}

function normalizeItem(raw: unknown): FavoriteClubItem | null {
  if (typeof raw === "string") {
    const code = raw.trim();
    if (!code) return null;
    return legacyFallback(code);
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const code = typeof r.code === "string" ? r.code.trim() : "";
    if (!code) return null;
    const name = typeof r.name === "string" && r.name.trim() ? r.name.trim() : code;
    const region = typeof r.region === "string" && r.region.trim() ? r.region.trim() : undefined;
    const holes = typeof r.holes === "string" && r.holes.trim() ? r.holes.trim() : undefined;
    return { code, name, region, holes };
  }
  return null;
}

function readItems(): FavoriteClubItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: FavoriteClubItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const item = normalizeItem(entry);
      if (!item || seen.has(item.code)) continue;
      seen.add(item.code);
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}

function writeItems(items: FavoriteClubItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (private mode quota, etc.) — ignore.
  }
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface UseFavoriteClubsResult {
  favorites: Set<string>;
  favoriteItems: FavoriteClubItem[];
  isFavorite: (code: string) => boolean;
  toggleFavorite: (code: string, meta?: FavoriteClubMeta) => void;
}

export function useFavoriteClubs(): UseFavoriteClubsResult {
  const [items, setItems] = useState<FavoriteClubItem[]>([]);

  useEffect(() => {
    const initial = readItems();
    setItems(initial);
    if (initial.length > 0) writeItems(initial);

    const unsub = subscribe(() => setItems(readItems()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readItems());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleFavorite = useCallback((code: string, meta?: FavoriteClubMeta) => {
    const prev = readItems();
    const exists = prev.some((it) => it.code === code);
    let next: FavoriteClubItem[];
    if (exists) {
      next = prev.filter((it) => it.code !== code);
    } else {
      const item: FavoriteClubItem = meta
        ? { code, name: meta.name, region: meta.region, holes: meta.holes }
        : legacyFallback(code);
      next = [item, ...prev];
    }
    writeItems(next);
    notify();
  }, []);

  const favorites = useMemo(() => new Set(items.map((it) => it.code)), [items]);
  const isFavorite = useCallback((code: string) => favorites.has(code), [favorites]);

  return { favorites, favoriteItems: items, isFavorite, toggleFavorite };
}
