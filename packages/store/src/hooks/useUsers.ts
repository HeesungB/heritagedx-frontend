"use client";

import { useState, useEffect } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { ListParams } from "@heritage-dx/api";
import type { AdminUserEntity } from "../entities/user";

export function useUsers(params?: ListParams) {
  const { users: usersRepo } = useAdminRepositories();
  const [data, setData] = useState<AdminUserEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersRepo.getAll(params);
      if (response.success && response.data) {
        setData(response.data.users ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("사용자 목록 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
