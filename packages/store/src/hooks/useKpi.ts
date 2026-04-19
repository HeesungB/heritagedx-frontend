"use client";

import { useMemo } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { KpiTradesParams, KpiConsultationsParams } from "@heritage-dx/types";

export function useKpi() {
  const { kpi: kpiRepo } = useAdminRepositories();

  return useMemo(
    () => ({
      fetchTrades: (params: KpiTradesParams) => kpiRepo.getTrades(params),
      fetchConsultations: (params: KpiConsultationsParams) =>
        kpiRepo.getConsultations(params),
      fetchEmployees: () => kpiRepo.getEmployees(),
    }),
    [kpiRepo],
  );
}
