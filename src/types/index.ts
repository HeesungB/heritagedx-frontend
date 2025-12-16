export interface Club {
  code: string;
  name: string;
  region: string;
  contact: string;
}

export interface ClubsResponse {
  success: boolean;
  data: {
    clubs: Club[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: string;
}

export interface ClubContact {
  type: string;
  value: string;
  name?: string;
  department?: string;
}

export interface BankAccount {
  bank: string;
  account: string;
  holder: string;
}

export interface ClubDetail {
  id: string;
  code: string;
  name: string;
  region: string;
  address: string;
  transferFee: string;
  taxOfficial: string;
  memo: string;
  contacts: ClubContact[];
  bankAccounts: BankAccount[];
  submissionMethods?: string[];
  processingTime?: string;
  externalUrl?: string;
}

export interface ClubDetailResponse {
  success: boolean;
  data: ClubDetail;
  timestamp: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
  active?: boolean;
}

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
  transferStructures: FilterOption[];
}

export interface Scenario {
  id: string;
  scenarioCode: string;
  name: string;
  side: "Seller" | "Buyer";
  ownerType: "Personal" | "Corporate";
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily: boolean;
  transferStructure: string | null;
  requiredDocumentsCount: number | null;
  isActive: boolean;
}

export interface ScenarioOptionsResponse {
  success: boolean;
  data: {
    clubCode: string;
    clubName: string;
    availableFilters: AvailableFilters;
    scenarios: Scenario[];
    totalScenarios: number;
  };
  timestamp: string;
}

export interface TransactionFormData {
  side: string;
  ownerType: string;
  hasProxy: boolean | null;
  isCertificateLost: boolean | null;
  selectedScenarioId: string | null;
  scenarioCode?: string;
}

export interface Document {
  id: string;
  docCode: string;
  name: string;
  minCount: number;
  unit: string;
  isMandatory: boolean;
  notes: string;
  displayOrder: number;
  condition?: string;
  clubRequirement?: string;
}

export interface DocumentsScenario {
  scenarioCode: string;
  name: string;
  description: string;
}

export interface DocumentsClub {
  code: string;
  name: string;
  transferFee: string;
}

export interface DocumentsSummary {
  totalDocuments: number;
  mandatoryDocuments: number;
  optionalDocuments: number;
}

export interface DocumentsResponse {
  success: boolean;
  data: {
    scenario: DocumentsScenario;
    club: DocumentsClub;
    documents: Document[];
    summary: DocumentsSummary;
  };
  timestamp: string;
}
