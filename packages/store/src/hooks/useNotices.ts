"use client";

import { useState, useEffect, useRef } from "react";
import { useNoticeRepository } from "@heritage-dx/api";
import type { NoticeListParams } from "@heritage-dx/api";
import type { Notice, Pagination } from "@heritage-dx/types";

export type NoticesPagination = Pagination;

const TTL_MS = 30 * 60 * 1000;

interface NoticeCacheEntry {
  data: Notice[];
  pagination: NoticesPagination | null;
  fetchedAt: number;
}

const cache = new Map<string, NoticeCacheEntry>();

function cacheKey(params?: NoticeListParams): string {
  return JSON.stringify({
    page: params?.page ?? 1,
    limit: params?.limit ?? null,
    search: params?.search ?? "",
    order: params?.order ?? "DESC",
  });
}

export function invalidateNoticesCache(): void {
  cache.clear();
}

export function useNotices(params?: NoticeListParams) {
  const noticeRepo = useNoticeRepository();
  const key = cacheKey(params);
  const cached = cache.get(key);
  const isFresh = cached && Date.now() - cached.fetchedAt < TTL_MS;

  const [data, setData] = useState<Notice[]>(cached?.data ?? []);
  const [pagination, setPagination] = useState<NoticesPagination | null>(
    cached?.pagination ?? null,
  );
  const [isLoading, setIsLoading] = useState(!isFresh);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const refetch = async (force = true) => {
    if (inFlight.current) return;
    if (!force) {
      const c = cache.get(key);
      if (c && Date.now() - c.fetchedAt < TTL_MS) {
        setData(c.data);
        setPagination(c.pagination);
        setIsLoading(false);
        return;
      }
    }
    inFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await noticeRepo.list(params);
      if (response.success && response.data) {
        const next: NoticeCacheEntry = {
          data: response.data.notices ?? [],
          pagination: response.data.pagination ?? null,
          fetchedAt: Date.now(),
        };
        cache.set(key, next);
        setData(next.data);
        setPagination(next.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("공지사항 로딩 실패"));
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const c = cache.get(key);
    if (c && Date.now() - c.fetchedAt < TTL_MS) {
      setData(c.data);
      setPagination(c.pagination);
      setIsLoading(false);
      return;
    }
    refetch(true);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, pagination, isLoading, error, refetch: () => refetch(true) };
}
