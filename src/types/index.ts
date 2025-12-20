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
  id: string;
  phoneNumber?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  department?: string;
  isPrimary: boolean;
}

export interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
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
  requiresTaxInvoiceOptions: FilterOption[];
}

export interface Scenario {
  id: string;
  scenarioCode: string;
  name: string;
  side: "Seller" | "Buyer";
  ownerType: "Personal" | "Corporate" | "Family" | "Special" | "All";
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily: boolean;
  transferStructure: string | null;
  requiresTaxInvoice: boolean;
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

// 시나리오 매칭 API 타입
export interface ScenarioMatchRequest {
  clubCode: string;
  side: "Buyer" | "Seller";
  ownerType: "Personal" | "Corporate" | "Family" | "Special" | "All";
  hasProxy?: boolean;
  isCertificateLost?: boolean;
  transferStructure?: "Withdraw" | "Abandon" | null;
  isFamily?: boolean;
}

export interface ScenarioMatchResponse {
  success: boolean;
  data: {
    matched: boolean;
    scenario: {
      id: string;
      scenarioCode: string;
      name: string;
      description: string | null;
      side: "Buyer" | "Seller";
      ownerType: "Personal" | "Corporate" | "Family" | "Special" | "All";
      hasProxy: boolean;
      isCertificateLost: boolean;
      transferStructure: string | null;
      isFamily: boolean;
      requiresTaxInvoice: boolean;
      displayOrder: number;
    };
    matchedConditions: {
      side: string;
      ownerType: string;
      hasProxy: boolean;
      isCertificateLost: boolean;
      transferStructure: string | null;
      isFamily: boolean;
    };
    clubInfo: {
      code: string;
      name: string;
    };
  };
  timestamp: string;
}

// 트랜잭션 옵션 타입
export interface TransactionOptions {
  side: "Buyer" | "Seller" | "";
  ownerType: "Personal" | "Corporate" | "";
}
