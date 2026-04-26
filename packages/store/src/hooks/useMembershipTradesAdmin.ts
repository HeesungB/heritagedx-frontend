"use client";

import { useStore } from "zustand";
import type { MembershipTradeAdminStore } from "../stores/membership-trade-admin.store";

export function useMembershipTradesAdmin(store: MembershipTradeAdminStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
  const workflowAction = useStore(store, (s) => s.workflowAction);
  const advanceToTaxFiling = useStore(store, (s) => s.advanceToTaxFiling);
  const advanceToCompleted = useStore(store, (s) => s.advanceToCompleted);
  const reject = useStore(store, (s) => s.reject);
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
    workflowAction,
    advanceToTaxFiling,
    advanceToCompleted,
    reject,
    hydrate,
  };
}
