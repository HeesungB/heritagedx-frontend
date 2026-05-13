import type { Pagination } from "./api";
import type { Document, DocumentsSummary } from "./document";

// 시나리오 Side/OwnerType 타입 (OpenAPI AdminScenarioDto enum)
export type ScenarioSide = "Seller" | "Buyer";
export type ScenarioOwnerType =
  | "Personal"
  | "Corporate"
  | "Family"
  | "Special"
  | "All";

// 시나리오
export interface Scenario {
  id?: string;
  scenarioCode?: string;
  code?: string;
  name: string;
  description?: string;
  side: ScenarioSide;
  ownerType: ScenarioOwnerType;
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily?: boolean;
  requiresTaxInvoice?: boolean;
  transferStructure?: string | null;
  requiredDocumentsCount?: number | null;
  displayOrder?: number;
  isActive?: boolean;
  conditions?: ScenarioConditions;
  documents?: Document[];
  createdAt?: string;
  updatedAt?: string;
}

// 시나리오 조건
export interface ScenarioConditions {
  side: ScenarioSide;
  ownerType: ScenarioOwnerType;
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily?: boolean;
  requiresTaxInvoice?: boolean;
}

// 시나리오 목록 응답
export interface ScenariosResponse {
  scenarios: Scenario[];
  pagination: Pagination;
}

// 시나리오별 서류 정보
export interface ScenarioWithDocuments {
  scenario: {
    scenarioCode: string;
    name: string;
    description?: string;
  };
  documentsLocal: Document[];
  summary: DocumentsSummary;
}

// 시나리오 옵션 아이템
export interface ScenarioOptionItem {
  id?: string;
  scenarioCode: string;
  name: string;
  side: ScenarioSide;
  ownerType: ScenarioOwnerType;
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily?: boolean;
  requiresTaxInvoice?: boolean;
  requiredDocumentsCount?: number;
}

// 골프장 시나리오 옵션
export interface ClubScenarioOptions {
  scenarios: ScenarioOptionItem[];
  availableFilters?: {
    sides?: { value: string; label: string; count: number }[];
    ownerTypes?: { value: string; label: string; count: number }[];
    hasProxyOptions?: { value: boolean; label: string; count: number }[];
    isCertificateLostOptions?: {
      value: boolean;
      label: string;
      count: number;
    }[];
  };
}

// 시나리오 서류 응답
export interface ScenarioDocumentsResponse {
  scenario: {
    scenarioCode: string;
    name: string;
    description?: string;
    side: ScenarioSide;
    ownerType: ScenarioOwnerType;
    hasProxy: boolean;
    isCertificateLost: boolean;
    isFamily?: boolean;
    requiresTaxInvoice?: boolean;
  };
  club?: {
    code: string;
    name: string;
  };
  documents: Document[];
  summary?: {
    total: number;
    required: number;
    optional: number;
  };
}

// 필터 옵션
export interface FilterOption {
  value: string | boolean | null;
  label: string;
  count: number;
}

export interface AvailableFilters {
  sides: FilterOption[];
  ownerTypes: FilterOption[];
  hasProxyOptions: FilterOption[];
  isCertificateLostOptions: FilterOption[];
  transferStructures?: FilterOption[];
  requiresTaxInvoiceOptions?: FilterOption[];
}

// 시나리오 옵션
export interface ScenarioOptions {
  availableFilters: AvailableFilters;
  scenarios: Scenario[];
  totalScenarios: number;
}

