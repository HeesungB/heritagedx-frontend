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

// 같은 탭 내에서 push/remove/clear 가 다른 컴포넌트(예: Sidebar)에 즉시
// 반영되도록 scope별 listener Set 을 모듈 수준에 둔다. localStorage 의
// `storage` 이벤트는 cross-tab 만 동작하므로 별도 통지가 필요.
const listenersByScope = new Map<string, Set<() => void>>();

function notify(scope: string) {
  const set = listenersByScope.get(scope);
  if (!set) return;
  set.forEach((fn) => fn());
}

function subscribe(scope: string, listener: () => void) {
  let set = listenersByScope.get(scope);
  if (!set) {
    set = new Set();
    listenersByScope.set(scope, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listenersByScope.delete(scope);
  };
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
    const unsub = subscribe(scope, () => setRecents(readList(scope)));
    // 다른 탭에서의 변경도 반영
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(scope)) setRecents(readList(scope));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [scope]);

  const push = useCallback(
    (item: RecentSearchItem) => {
      const label = item.label.trim();
      const value = item.value.trim();
      if (!label || !value) return;
      const next: RecentSearchItem = { label, value, kind: item.kind };
      const prev = readList(scope);
      const merged = [next, ...prev.filter((t) => t.value !== value)].slice(0, max);
      writeList(scope, merged);
      notify(scope);
    },
    [scope, max],
  );

  const remove = useCallback(
    (value: string) => {
      const prev = readList(scope);
      const next = prev.filter((t) => t.value !== value);
      writeList(scope, next);
      notify(scope);
    },
    [scope],
  );

  const clear = useCallback(() => {
    writeList(scope, []);
    notify(scope);
  }, [scope]);

  return { recents, push, remove, clear };
}
