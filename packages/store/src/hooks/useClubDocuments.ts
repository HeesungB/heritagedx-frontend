"use client";

import { useState, useEffect } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import type { ClubDocument } from "@heritage-dx/types";

export function useClubDocuments(clubCode: string) {
  const { clubDocuments: clubDocumentsRepo } = useAdminRepositories();
  const [data, setData] = useState<ClubDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!clubCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await clubDocumentsRepo.getByClub(clubCode);
      if (response.success && response.data) {
        setData(response.data.documents ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("클럽 문서 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [clubCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
