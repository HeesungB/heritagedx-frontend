"use client";

import { useCallback } from "react";
import { invalidateNoticesCache } from "./useNotices";
import { invalidateMarketPricesCache } from "./useMarketPrices";
import { invalidateScenarioOptionsCache } from "./useScenarioOptions";
import { invalidateUsersCache } from "./useUsers";
import { invalidateMyOrganizationCache } from "./useMyOrganization";

const REVALIDATE_ENDPOINT = "/api/admin/revalidate";

export type CacheTag =
  | "clubs"
  | "scenarios"
  | "notices"
  | "market-prices"
  | "organizations"
  | "users"
  | `clubs:${string}`
  | `scenario:${string}`
  | `market-prices:${string}`
  | `memberships:${string}`;

interface InvalidateOptions {
  /**
   * 메모리(클라이언트) 캐시만 무효화하고 서버 revalidateTag 는 호출하지 않을지 여부.
   * 다른 BO 인스턴스/세션의 stale 캐시가 신경 쓰이지 않을 때만 사용.
   */
  skipServer?: boolean;
}

function memoryInvalidate(tag: string): void {
  if (tag === "notices") {
    invalidateNoticesCache();
    return;
  }
  if (tag === "market-prices" || tag.startsWith("market-prices:")) {
    const id = tag.startsWith("market-prices:") ? tag.slice("market-prices:".length) : undefined;
    invalidateMarketPricesCache(id);
    return;
  }
  if (tag === "scenarios" || tag.startsWith("scenario:")) {
    const code = tag.startsWith("scenario:") ? tag.slice("scenario:".length) : undefined;
    invalidateScenarioOptionsCache(code);
    return;
  }
  if (tag === "users") {
    invalidateUsersCache();
    return;
  }
  if (tag === "organizations") {
    invalidateMyOrganizationCache();
    return;
  }
  // `clubs` 와 `clubs:<code>` 는 zustand club store 가 보유 — 호출처에서 store 의 invalidate 를 직접 사용.
}

async function callServer(tags: string[]): Promise<void> {
  try {
    await fetch(REVALIDATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
      credentials: "include",
    });
  } catch {
    // revalidate 호출 실패는 캐시 자연 만료에 의존 — UX 차단 금지
  }
}

export function useInvalidate() {
  return useCallback(
    async (tags: CacheTag | CacheTag[], options?: InvalidateOptions) => {
      const list = Array.isArray(tags) ? tags : [tags];
      for (const t of list) memoryInvalidate(t);
      if (!options?.skipServer) {
        await callServer(list);
      }
    },
    [],
  );
}
