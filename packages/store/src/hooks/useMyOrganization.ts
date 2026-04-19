"use client";

import { useState, useEffect } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { OrganizationEntity } from "../entities/organization";

export function useMyOrganization(organizationId: string | undefined) {
  const { organizations: orgsRepo } = useAdminRepositories();
  const [data, setData] = useState<OrganizationEntity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await orgsRepo.getOne(organizationId);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("조직 정보 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
