"use client";

import { useStore } from "zustand";
import type { CustomerStore } from "../stores/customer.store";

export function useCustomers(store: CustomerStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
  const searchByQuery = useStore(store, (s) => s.searchByQuery);
  const getOne = useStore(store, (s) => s.getOne);
  const getHistorySummary = useStore(store, (s) => s.getHistorySummary);
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
    searchByQuery,
    getOne,
    getHistorySummary,
    hydrate,
  };
}
