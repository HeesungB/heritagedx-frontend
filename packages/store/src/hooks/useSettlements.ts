"use client";

import { useStore } from "zustand";
import type { SettlementStore } from "../stores/settlement.store";

export function useSettlements(store: SettlementStore) {
  const byConsultation = useStore(store, (s) => s.byConsultation);
  const createDraft = useStore(store, (s) => s.createDraft);
  const create = useStore(store, (s) => s.create);
  const fetchOne = useStore(store, (s) => s.fetchOne);
  const update = useStore(store, (s) => s.update);
  const markDocumentGenerated = useStore(
    store,
    (s) => s.markDocumentGenerated,
  );
  const remove = useStore(store, (s) => s.remove);

  return {
    byConsultation,
    createDraft,
    create,
    fetchOne,
    update,
    markDocumentGenerated,
    remove,
  };
}
