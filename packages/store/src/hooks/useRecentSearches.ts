"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "heritage-dx:recent-searches:";
const DEFAULT_MAX = 8;

function storageKey(scope: string) {
  return `${STORAGE_PREFIX}${scope}`;
}

export interface RecentSearchItem {
  label: string;
  value: string;
  kind?: string;
}

function normalizeItem(raw: unknown): RecentSearchItem | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return { label: trimmed, value: trimmed };
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const label = typeof r.label === "string" ? r.label.trim() : "";
    const value = typeof r.value === "string" ? r.value.trim() : "";
    if (!label || !value) return null;
    const kind = typeof r.kind === "string" ? r.kind : undefined;
    return { label, value, kind };
  }
  return null;
}

function readList(scope: string): RecentSearchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeItem).filter((v): v is RecentSearchItem => v !== null);
  } catch {
    return [];
  }
}

function writeList(scope: string, list: RecentSearchItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(scope), JSON.stringify(list));
  } catch {
    // ignore
  }
}

export interface UseRecentSearchesResult {
  recents: RecentSearchItem[];
  push: (item: RecentSearchItem) => void;
  remove: (value: string) => void;
  clear: () => void;
}

export function useRecentSearches(scope: string, max = DEFAULT_MAX): UseRecentSearchesResult {
  const [recents, setRecents] = useState<RecentSearchItem[]>([]);

  useEffect(() => {
    setRecents(readList(scope));
  }, [scope]);

  const push = useCallback(
    (item: RecentSearchItem) => {
      const label = item.label.trim();
      const value = item.value.trim();
      if (!label || !value) return;
      const next: RecentSearchItem = { label, value, kind: item.kind };
      setRecents((prev) => {
        const merged = [next, ...prev.filter((t) => t.value !== value)].slice(0, max);
        writeList(scope, merged);
        return merged;
      });
    },
    [scope, max],
  );

  const remove = useCallback(
    (value: string) => {
      setRecents((prev) => {
        const next = prev.filter((t) => t.value !== value);
        writeList(scope, next);
        return next;
      });
    },
    [scope],
  );

  const clear = useCallback(() => {
    setRecents([]);
    writeList(scope, []);
  }, [scope]);

  return { recents, push, remove, clear };
}
