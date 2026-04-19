"use client";

import { useState, useEffect } from "react";
import { useNoticeRepository } from "@heritage-dx/api";
import type { NoticeListParams } from "@heritage-dx/api";
import type { Notice, Pagination } from "@heritage-dx/types";

export type NoticesPagination = Pagination;

export function useNotices(params?: NoticeListParams) {
  const noticeRepo = useNoticeRepository();
  const [data, setData] = useState<Notice[]>([]);
  const [pagination, setPagination] = useState<NoticesPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await noticeRepo.list(params);
      if (response.success && response.data) {
        setData(response.data.notices ?? []);
        setPagination(response.data.pagination ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("공지사항 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [params?.page, params?.limit, params?.search, params?.order]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, pagination, isLoading, error, refetch };
}
