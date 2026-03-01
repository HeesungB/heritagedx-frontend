import type { Pagination } from "./api";

// 서류 (시나리오별 서류)
export interface Document {
  id?: string;
  clubDocumentId?: string;
  docCode?: string;
  code?: string;
  cleanName?: string;
  name?: string;
  fileName?: string;
  fileDescription?: string;
  description?: string;
  required?: boolean;
  minCount?: number;
  unit?: string;
  isMandatory?: boolean;
  notes?: string | string[];
  displayOrder?: number;
  condition?: string;
  clubRequirement?: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 서류 목록 응답
export interface DocumentsResponse {
  documents: Document[];
  pagination: Pagination;
}

// 골프장 서류 (골프장에 등록된 서류)
export interface ClubDocument {
  id: string;
  clubId: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  storageKey?: string;
  docCode?: string;
  code?: string;
  cleanName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 골프장 서류 목록 응답
export interface ClubDocumentsResponse {
  documents: ClubDocument[];
  pagination: Pagination;
}

// 공용 서류 (Global Document)
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

// 공용 서류 목록 응답
export interface GlobalDocumentsResponse {
  documents: GlobalDocument[];
  pagination: Pagination;
}

// 고객 구비서류 (Customer Document)
export interface CustomerDocument {
  id: string;
  clubId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 고객 구비서류 목록 응답
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

// 골프장-시나리오에 연결된 서류
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

// 시나리오 서류 연결
export interface ScenarioDocumentLink {
  id?: string;
  scenarioCode: string;
  docCode: string;
  document?: Document;
  required?: boolean;
  displayOrder?: number;
}
