"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import type { ClubStore } from "../stores/club.store";

export function useClubs(store: ClubStore) {
  const clubs = useStore(store, (s) => s.clubs);
  const totalCount = useStore(store, (s) => s.totalCount);
  const status = useStore(store, (s) => s.listStatus);
  const fetchAllClubs = useStore(store, (s) => s.fetchAllClubs);

  useEffect(() => {
    if (status === "idle") {
      fetchAllClubs();
    }
  }, [status, fetchAllClubs]);

  return {
    clubs,
    totalCount,
    isLoading: status === "loading",
    isRefreshing: status === "refreshing",
    refresh: fetchAllClubs,
  };
}
