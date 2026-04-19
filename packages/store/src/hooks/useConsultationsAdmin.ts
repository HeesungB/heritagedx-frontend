"use client";

import { useStore } from "zustand";
import type { ConsultationAdminStore } from "../stores/consultation-admin.store";

export function useConsultationsAdmin(store: ConsultationAdminStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
  const approvalAction = useStore(store, (s) => s.approvalAction);
  const requestApproval = useStore(store, (s) => s.requestApproval);
  const approveFirst = useStore(store, (s) => s.approveFirst);
  const hold = useStore(store, (s) => s.hold);
  const reject = useStore(store, (s) => s.reject);
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
    approvalAction,
    requestApproval,
    approveFirst,
    hold,
    reject,
    reopen,
    hydrate,
  };
}
