"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { ListParams } from "@heritage-dx/api";
import type { AdminUserEntity } from "../entities/user";

const TTL_MS = 12 * 60 * 60 * 1000;

interface UsersCacheEntry {
  data: AdminUserEntity[];
  fetchedAt: number;
}

const cache = new Map<string, UsersCacheEntry>();

export function invalidateUsersCache(): void {
  cache.clear();
}

function cacheKey(params?: ListParams): string {
  return JSON.stringify({
    page: params?.page ?? null,
    limit: params?.limit ?? null,
  });
}

export function useUsers(params?: ListParams) {
  const { users: usersRepo } = useAdminRepositories();
  const key = cacheKey(params);
  const cached = cache.get(key);
  const isFresh = cached && Date.now() - cached.fetchedAt < TTL_MS;

  const [data, setData] = useState<AdminUserEntity[]>(cached?.data ?? []);
  const [isLoading, setIsLoading] = useState(!isFresh);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const refetch = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersRepo.getAll(params);
      if (response.success && response.data) {
        const next = response.data.users ?? [];
        cache.set(key, { data: next, fetchedAt: Date.now() });
        setData(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("사용자 목록 로딩 실패"));
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const c = cache.get(key);
    if (c && Date.now() - c.fetchedAt < TTL_MS) {
      setData(c.data);
      setIsLoading(false);
      return;
    }
    refetch();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
