"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKpi } from "./useKpi";
import {
  getDateRange,
  getTimeBuckets,
  toConsultationDateField,
  type KpiFilters,
} from "../domain/kpi";
import type { TrendDataPoint } from "../domain/kpi";

const BUCKET_CONCURRENCY = 3;

export function useKpiSeries(filters: KpiFilters): {
  data: TrendDataPoint[];
  isLoading: boolean;
  error: string | null;
} {
  const { fetchTrades, fetchConsultations } = useKpi();
  const reqId = useRef(0);
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setIsLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(
      filters.preset,
      filters.customStart,
      filters.customEnd,
    );
    const buckets = getTimeBuckets(filters.preset, startDate, endDate);
    const employeeParams = filters.employeeId ? { userId: filters.employeeId } : {};

    // 빈 버킷으로 먼저 렌더 → 결과 도착 시 해당 인덱스만 덮어씀
    setData(
      buckets.map((b) => ({
        label: b.label,
        tradeCount: 0,
        consultationCount: 0,
        profit: 0,
      })),
    );

    let firstError: string | null = null;
    let firstResolved = false;
    let cursor = 0;

    const fetchBucket = async (index: number) => {
      const b = buckets[index];
      const [tradesRes, consultsRes] = await Promise.all([
        fetchTrades({
          startDate: b.startDate,
          endDate: b.endDate,
          dateField: filters.dateField,
          ...employeeParams,
        }),
        fetchConsultations({
          startDate: b.startDate,
          endDate: b.endDate,
          dateField: toConsultationDateField(filters.dateField),
          ...employeeParams,
        }),
      ]);
      if (id !== reqId.current) return;
      if (!tradesRes?.success && !firstError)
        firstError = tradesRes?.error ?? null;
      if (!consultsRes?.success && !firstError)
        firstError = consultsRes?.error ?? null;

      setData((prev) => {
        const next = [...prev];
        next[index] = {
          label: b.label,
          tradeCount: tradesRes?.data?.totalCount ?? 0,
          consultationCount: consultsRes?.data?.totalCount ?? 0,
          profit: tradesRes?.data?.totalNetProfit ?? 0,
        };
        return next;
      });

      if (!firstResolved) {
        firstResolved = true;
        setIsLoading(false);
      }
    };

    const worker = async () => {
      while (cursor < buckets.length) {
        const i = cursor++;
        await fetchBucket(i);
        if (id !== reqId.current) return;
      }
    };

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(BUCKET_CONCURRENCY, buckets.length) },
          () => worker(),
        ),
      );
      if (id !== reqId.current) return;
      if (firstError) setError(firstError);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(
        e instanceof Error ? e.message : "KPI 추이를 불러오지 못했습니다.",
      );
    } finally {
      if (id === reqId.current) setIsLoading(false);
    }
  }, [fetchTrades, fetchConsultations, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error };
}
