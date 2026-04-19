"use client";

import { useState, useEffect } from "react";
import { useAdminRepositories } from "@heritage-dx/api";
import { mapGlobalDocumentDtoToEntity } from "../mappers/document.mapper";
import type { GlobalDocumentEntity } from "../entities/document";

export function useGlobalDocuments() {
  const { globalDocuments: globalDocumentsRepo } = useAdminRepositories();
  const [data, setData] = useState<GlobalDocumentEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await globalDocumentsRepo.getAll();
      if (response.success && response.data) {
        const docs = response.data.documents ?? (response.data as unknown as GlobalDocumentEntity[]);
        const items = Array.isArray(docs) ? docs : [];
        setData(items.map(mapGlobalDocumentDtoToEntity));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("전역 문서 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
