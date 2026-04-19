"use client";

import { useState, useEffect } from "react";
import { useScenarioRepository } from "@heritage-dx/api";
import type { AvailableFilters } from "@heritage-dx/types";
import type { ScenarioEntity } from "../entities/scenario";

export interface ScenarioOptionsData {
  availableFilters: AvailableFilters | null;
  scenarios: ScenarioEntity[];
}

export function useScenarioOptions(clubCode: string) {
  const scenarioRepo = useScenarioRepository();
  const [data, setData] = useState<ScenarioOptionsData>({
    availableFilters: null,
    scenarios: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!clubCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenarioRepo.getOptions(clubCode);
      if (response.success && response.data) {
        setData({
          availableFilters: response.data.availableFilters,
          scenarios: response.data.scenarios,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("시나리오 옵션 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [clubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
