import type { Pagination } from "./api";

// 시나리오 서류 항목 (OpenAPI DocumentItemDto)
// — scenarios/{id}/documents 결과 배열에 포함되는 형태
export interface Document {
  id: string;
  clubDocumentId?: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  minCount?: number;
  unit?: string;
  isMandatory?: boolean;
  notes?: string | string[] | null;
  displayOrder?: number;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
}

// 서류 목록 응답
export interface DocumentsResponse {
  documents: Document[];
  pagination: Pagination;
}

// 골프장 서류 (OpenAPI AdminDocumentDto)
export interface ClubDocument {
  id: string;
  clubId: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  storageKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubDocumentsResponse {
  documents: ClubDocument[];
  pagination: Pagination;
}

// 공용 서류 (OpenAPI AdminGlobalDocumentDto)
export interface GlobalDocument {
  id: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  storageKey?: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalDocumentsResponse {
  documents: GlobalDocument[];
  pagination: Pagination;
}

// 고객 구비서류 (OpenAPI AdminCustomerDocumentDto) — clubId required
export interface CustomerDocument {
  id: string;
  clubId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerDocumentsResponse {
  documents: CustomerDocument[];
  pagination: Pagination;
}

// 서류 요약
export interface DocumentsSummary {
  totalDocuments: number;
  mandatoryDocuments: number;
  optionalDocuments: number;
}

// 골프장-시나리오에 연결된 서류 (OpenAPI AdminClubScenarioDocumentDto)
export interface ClubScenarioDocument {
  id: string;
  clubId: string;
  scenarioId: string;
  clubDocumentId: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  minCount?: number;
  unit?: string;
  isMandatory?: boolean;
  notes?: string;
  displayOrder?: number;
  ownerTypes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 시나리오 서류 연결 (클라이언트 파생)
export interface ScenarioDocumentLink {
  id?: string;
  scenarioCode: string;
  clubDocumentId: string;
  document?: Document;
  required?: boolean;
  displayOrder?: number;
}
