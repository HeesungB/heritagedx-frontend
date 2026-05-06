"use client";

import { useStore } from "zustand";
import type { ConsultationStore } from "../stores/consultation.store";

export function useConsultations(store: ConsultationStore) {
  const items = useStore(store, (s) => s.items);
  const pagination = useStore(store, (s) => s.pagination);
  const status = useStore(store, (s) => s.status);
  const fetch = useStore(store, (s) => s.fetch);
  const create = useStore(store, (s) => s.create);
  const update = useStore(store, (s) => s.update);
  const remove = useStore(store, (s) => s.remove);
  const toggleDone = useStore(store, (s) => s.toggleDone);
  const addNote = useStore(store, (s) => s.addNote);
  const updateNote = useStore(store, (s) => s.updateNote);
  const deleteNote = useStore(store, (s) => s.deleteNote);
  const requestApproval = useStore(store, (s) => s.requestApproval);
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
    toggleDone,
    addNote,
    updateNote,
    deleteNote,
    requestApproval,
    hydrate,
  };
}
