"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKpi } from "./useKpi";
import {
  getDateRange,
  toConsultationDateField,
  type KpiFilters,
} from "../domain/kpi";
import type { KpiSummary } from "../domain/kpi";

const INITIAL_SUMMARY: KpiSummary = { tradeCount: 0, profit: 0, consultationCount: 0 };

export function useKpiSummary(filters: KpiFilters): {
  data: KpiSummary;
  isLoading: boolean;
  error: string | null;
} {
  const { fetchTrades, fetchConsultations } = useKpi();
  const reqId = useRef(0);
  const [data, setData] = useState<KpiSummary>(INITIAL_SUMMARY);
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
    const employeeParams = filters.employeeId ? { userId: filters.employeeId } : {};

    try {
      const [tradesRes, consultsRes] = await Promise.all([
        fetchTrades({
          startDate,
          endDate,
          ...employeeParams,
        }),
        fetchConsultations({
          startDate,
          endDate,
          dateField: toConsultationDateField(filters.dateField),
          ...employeeParams,
        }),
      ]);

      if (id !== reqId.current) return;

      if (!tradesRes?.success || !consultsRes?.success) {
        setData(INITIAL_SUMMARY);
        setError(
          tradesRes?.error ??
            consultsRes?.error ??
            "KPI 데이터를 불러오지 못했습니다.",
        );
        return;
      }

      setData({
        tradeCount: tradesRes.data?.totalCount ?? 0,
        profit: tradesRes.data?.totalNetProfit ?? 0,
        consultationCount: consultsRes.data?.totalCount ?? 0,
      });
    } catch (e) {
      if (id !== reqId.current) return;
      setError(
        e instanceof Error ? e.message : "KPI 데이터를 불러오지 못했습니다.",
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
