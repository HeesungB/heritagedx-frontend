"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useKpi } from "./useKpi";
import {
  getDateRange,
  toConsultationDateField,
  type KpiFilters,
} from "../domain/kpi";
import type { EmployeeKpiData } from "../domain/kpi";
import type { EmployeeEntity } from "../entities";

const EMPLOYEE_CONCURRENCY = 3;

export function useKpiByEmployee(
  filters: KpiFilters,
  employees: EmployeeEntity[],
): {
  data: EmployeeKpiData[];
  isLoading: boolean;
  error: string | null;
} {
  const { fetchTrades, fetchConsultations } = useKpi();
  const reqId = useRef(0);
  const [data, setData] = useState<EmployeeKpiData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!employees.length) return; // employees 로드 전 대기 — isLoading 유지
    const id = ++reqId.current;
    setIsLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(
      filters.preset,
      filters.customStart,
      filters.customEnd,
    );

    // 빈 직원 slot으로 먼저 렌더 → 결과 도착 시 해당 index만 덮어씀
    setData(
      employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        tradeCount: 0,
        consultationCount: 0,
        profit: 0,
      })),
    );

    let firstError: string | null = null;
    let firstResolved = false;
    let cursor = 0;

    const fetchEmployee = async (index: number) => {
      const emp = employees[index];
      const [tradesRes, consultsRes] = await Promise.all([
        fetchTrades({
          startDate,
          endDate,
          dateField: filters.dateField,
          userId: emp.id,
        }),
        fetchConsultations({
          startDate,
          endDate,
          dateField: toConsultationDateField(filters.dateField),
          userId: emp.id,
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
          id: emp.id,
          name: emp.name,
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
      while (cursor < employees.length) {
        const i = cursor++;
        await fetchEmployee(i);
        if (id !== reqId.current) return;
      }
    };

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(EMPLOYEE_CONCURRENCY, employees.length) },
          () => worker(),
        ),
      );
      if (id !== reqId.current) return;
      if (firstError) setError(firstError);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(
        e instanceof Error ? e.message : "담당자별 KPI를 불러오지 못했습니다.",
      );
    } finally {
      if (id === reqId.current) setIsLoading(false);
    }
  }, [fetchTrades, fetchConsultations, filters, employees]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error };
}
