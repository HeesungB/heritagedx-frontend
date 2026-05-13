"use client";

import { useState, useEffect, useRef } from "react";
import { useScenarioRepository } from "@heritage-dx/api";
import type { AvailableFilters } from "@heritage-dx/types";
import type { ScenarioEntity } from "../entities/scenario";

export interface ScenarioOptionsData {
  availableFilters: AvailableFilters | null;
  scenarios: ScenarioEntity[];
}

const TTL_MS = 60 * 60 * 1000;

interface ScenarioOptionsCacheEntry {
  data: ScenarioOptionsData;
  fetchedAt: number;
}

const cache = new Map<string, ScenarioOptionsCacheEntry>();

export function invalidateScenarioOptionsCache(clubCode?: string): void {
  if (!clubCode) {
    cache.clear();
    return;
  }
  cache.delete(clubCode);
}

const EMPTY: ScenarioOptionsData = {
  availableFilters: null,
  scenarios: [],
};

export function useScenarioOptions(clubCode: string) {
  const scenarioRepo = useScenarioRepository();
  const cached = cache.get(clubCode);
  const isFresh = cached && Date.now() - cached.fetchedAt < TTL_MS;

  const [data, setData] = useState<ScenarioOptionsData>(cached?.data ?? EMPTY);
  const [isLoading, setIsLoading] = useState(Boolean(clubCode) && !isFresh);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const refetch = async () => {
    if (!clubCode) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenarioRepo.getOptions(clubCode);
      if (response.success && response.data) {
        const next: ScenarioOptionsData = {
          availableFilters: response.data.availableFilters,
          scenarios: response.data.scenarios,
        };
        cache.set(clubCode, { data: next, fetchedAt: Date.now() });
        setData(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("시나리오 옵션 로딩 실패"));
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    if (!clubCode) return;
    const c = cache.get(clubCode);
    if (c && Date.now() - c.fetchedAt < TTL_MS) {
      setData(c.data);
      setIsLoading(false);
      return;
    }
    refetch();
  }, [clubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
