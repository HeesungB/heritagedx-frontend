"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { OrganizationEntity } from "../entities/organization";

const TTL_MS = 12 * 60 * 60 * 1000;

interface OrgCacheEntry {
  data: OrganizationEntity;
  fetchedAt: number;
}

const cache = new Map<string, OrgCacheEntry>();

export function invalidateMyOrganizationCache(organizationId?: string): void {
  if (!organizationId) {
    cache.clear();
    return;
  }
  cache.delete(organizationId);
}

export function useMyOrganization(organizationId: string | undefined) {
  const { organizations: orgsRepo } = useAdminRepositories();
  const cached = organizationId ? cache.get(organizationId) : undefined;

  const [data, setData] = useState<OrganizationEntity | null>(cached?.data ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const refetch = async () => {
    if (!organizationId) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await orgsRepo.getOne(organizationId);
      if (response.success && response.data) {
        cache.set(organizationId, {
          data: response.data,
          fetchedAt: Date.now(),
        });
        setData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("조직 정보 로딩 실패"));
    } finally {
      setIsLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    if (!organizationId) {
      setData(null);
      return;
    }
    const c = cache.get(organizationId);
    if (c && Date.now() - c.fetchedAt < TTL_MS) {
      setData(c.data);
      setIsLoading(false);
      return;
    }
    refetch();
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
