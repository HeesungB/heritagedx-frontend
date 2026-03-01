"use client";

import { useEffect, useCallback } from "react";
import { useStore } from "zustand";
import type { ClubStore } from "../stores/club.store";
import type { ClubDetailEntity } from "../entities/club";

export function useClubDetail(store: ClubStore, code: string | null) {
  const detailCache = useStore(store, (s) => s.detailCache);
  const detailStatus = useStore(store, (s) => s.detailStatus);
  const fetchClubDetail = useStore(store, (s) => s.fetchClubDetail);
  const invalidateDetail = useStore(store, (s) => s.invalidateDetail);

  useEffect(() => {
    if (code) {
      fetchClubDetail(code);
    }
  }, [code, fetchClubDetail]);

  const detail: ClubDetailEntity | null = code ? (detailCache.get(code) ?? null) : null;

  const invalidate = useCallback(() => {
    if (code) invalidateDetail(code);
  }, [code, invalidateDetail]);

  return {
    detail,
    isLoading: detailStatus === "loading",
    isRefreshing: detailStatus === "refreshing",
    invalidate,
  };
}
