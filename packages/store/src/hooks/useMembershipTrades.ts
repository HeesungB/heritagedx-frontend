"use client";

import { useStore } from "zustand";
import type { MembershipTradeStore } from "../stores/membership-trade.store";

export function useMembershipTrades(store: MembershipTradeStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
  const requestFinalReview = useStore(store, (s) => s.requestFinalReview);
  const reopen = useStore(store, (s) => s.reopen);
  const hydrate = useStore(store, (s) => s.hydrate);

  return {
    items,
    pagination,
    isLoading: status === "loading",
    isRefreshing: status === "refreshing",
    status,
    fetch,
    create,
    update,
    remove,
    requestFinalReview,
    reopen,
    hydrate,
  };
}
