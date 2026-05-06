"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "heritage-dx:consultation-favorites";

export interface FavoriteConsultationItem {
  id: string;
  label: string;
  subLabel?: string;
  href: string;
}

export type FavoriteConsultationMeta = Omit<FavoriteConsultationItem, "id">;

function legacyFallback(id: string): FavoriteConsultationItem {
  return {
    id,
    label: "이름 미상 고객님 상담",
    href: `/trades?expand=${encodeURIComponent(id)}`,
  };
}

function normalizeItem(raw: unknown): FavoriteConsultationItem | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    if (!id) return null;
    return legacyFallback(id);
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    if (!id) return null;
    const label = typeof r.label === "string" && r.label.trim() ? r.label.trim() : legacyFallback(id).label;
    const subLabel = typeof r.subLabel === "string" && r.subLabel.trim() ? r.subLabel.trim() : undefined;
    const href = typeof r.href === "string" && r.href.trim() ? r.href.trim() : legacyFallback(id).href;
    return { id, label, subLabel, href };
  }
  return null;
}

function readItems(): FavoriteConsultationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: FavoriteConsultationItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      const item = normalizeItem(entry);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}

function writeItems(items: FavoriteConsultationItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be unavailable (private mode quota, etc.) — ignore.
  }
}

// 같은 탭 내에서 toggleFavorite 가 다른 컴포넌트(예: Sidebar)에 즉시 반영되도록
// 모듈 수준 listener Set 을 둔다. localStorage 의 `storage` 이벤트는 cross-tab 만
// 동작하므로 별도 통지가 필요.
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

export interface UseFavoriteConsultationsResult {
  favorites: Set<string>;
  favoriteItems: FavoriteConsultationItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, meta?: FavoriteConsultationMeta) => void;
}

export function useFavoriteConsultations(): UseFavoriteConsultationsResult {
  const [items, setItems] = useState<FavoriteConsultationItem[]>([]);

  // hydrate after mount to keep SSR output stable
  useEffect(() => {
    const initial = readItems();
    setItems(initial);
    // Re-persist if normalization upgraded legacy string entries so the next
    // read is fast and shape-consistent.
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

  const toggleFavorite = useCallback((id: string, meta?: FavoriteConsultationMeta) => {
    const prev = readItems();
    const exists = prev.some((it) => it.id === id);
    let next: FavoriteConsultationItem[];
    if (exists) {
      next = prev.filter((it) => it.id !== id);
    } else {
      const item: FavoriteConsultationItem = meta
        ? { id, label: meta.label, subLabel: meta.subLabel, href: meta.href }
        : legacyFallback(id);
      next = [item, ...prev];
    }
    writeItems(next);
    notify();
  }, []);

  const favorites = useMemo(() => new Set(items.map((it) => it.id)), [items]);
  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, favoriteItems: items, isFavorite, toggleFavorite };
}
