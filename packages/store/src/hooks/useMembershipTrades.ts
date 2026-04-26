"use client";

import { useStore } from "zustand";
import type { MembershipTradeStore } from "../stores/membership-trade.store";

// 공개 거래 hook은 read-only.
// 거래 생성/수정/삭제/액션은 모두 admin 경로로만 가능하다.
export function useMembershipTrades(store: MembershipTradeStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const hydrate = useStore(store, (s) => s.hydrate);

  return {
    items,
    pagination,
    isLoading: status === "loading",
    isRefreshing: status === "refreshing",
    status,
    fetch,
    hydrate,
  };
}
