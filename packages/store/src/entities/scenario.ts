import type { DocumentEntity } from "./document";

export interface DocumentsSummaryEntity {
  totalDocuments: number;
  mandatoryDocuments: number;
  optionalDocuments: number;
}

export interface ScenarioWithDocsEntity {
  scenario: {
    scenarioCode: string;
    name: string;
    description: string | null;
  };
  documentsLocal: DocumentEntity[];
  summary: DocumentsSummaryEntity;
}
