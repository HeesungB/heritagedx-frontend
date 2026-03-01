"use client";

import { useStore } from "zustand";
import type { TradeRecordStore } from "../stores/trade-record.store";

export function useTradeRecords(store: TradeRecordStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
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
    hydrate,
  };
}
