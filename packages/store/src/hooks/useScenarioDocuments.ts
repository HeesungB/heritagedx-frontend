"use client";

import { useState, useEffect } from "react";
import { useScenarioRepository } from "@heritage-dx/api";
import { mapDocumentDtoToEntity } from "../mappers/document.mapper";
import type { DocumentEntity } from "../entities/document";
import type { DocumentsSummaryEntity } from "../entities/scenario";

export interface ScenarioDocumentsData {
  documents: DocumentEntity[];
  scenario: { scenarioCode: string; name: string; description: string } | null;
  club: { code: string; name: string; transferFee: string } | null;
  summary: DocumentsSummaryEntity | null;
}

export function useScenarioDocuments(
  scenarioCode: string,
  clubCode: string,
  ownerType: string,
) {
  const scenarioRepo = useScenarioRepository();
  const [data, setData] = useState<ScenarioDocumentsData>({
    documents: [],
    scenario: null,
    club: null,
    summary: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    if (!clubCode || !scenarioCode || !ownerType) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenarioRepo.getDocuments(scenarioCode, clubCode, ownerType);
      if (response.success && response.data) {
        setData({
          documents: (response.data.documents || []).map(mapDocumentDtoToEntity),
          scenario: response.data.scenario
            ? {
                scenarioCode: response.data.scenario.scenarioCode,
                name: response.data.scenario.name,
                description: response.data.scenario.description ?? "",
              }
            : null,
          club: response.data.club
            ? { code: response.data.club.code, name: response.data.club.name, transferFee: "" }
            : null,
          summary: response.data.summary
            ? {
                totalDocuments: response.data.summary.total,
                mandatoryDocuments: (response.data.summary as unknown as { required?: number }).required ?? 0,
                optionalDocuments: response.data.summary.optional ?? 0,
              }
            : null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("서류 목록 로딩 실패"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [scenarioCode, clubCode, ownerType]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, refetch };
}
