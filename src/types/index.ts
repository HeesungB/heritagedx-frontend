export interface Club {
  id?: string;
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

export interface Membership {
  id: string;
  clubId: string;
  membershipType: string;
  // 비용 정보
  weekdayGreenFee?: Record<string, number>;
  weekendGreenFee?: Record<string, number>;
  caddyFee?: number;
  cartFee?: number;
  // 시세 정보
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;
  // 거래 정보
  minTransactionUnit?: string;
  transactionTendency?: string;
  recentTransactionType?: string;
  tradableTypeSummary?: string;
  registrationDifficulty?: string;
  additionalDocumentFrequency?: string;
  balanceRisk?: string;
  transactionRiskMemo?: string;
  // 가족회원
  hasFamilyMember: boolean;
  familyMemberCondition?: string;
  familyMemberWeekdayFee?: number;
  familyMemberWeekendFee?: number;
  // 준회원
  hasAssociateMember: boolean;
  associateMemberCondition?: string;
  associateMemberWeekdayFee?: number;
  associateMemberWeekendFee?: number;
  // 기명인
  registeredPersonCount?: number;
  // 위임
  canDelegate: boolean;
  delegationWeekdayRule?: string;
  delegationWeekendRule?: string;
  delegationRestriction?: string;
  // 분양 정보
  initialSalePrice?: string;
  initialSaleYear?: string;
  initialSaleMethod?: string;
  estimatedSalePrice?: string;
  estimatedPriceDate?: string;
  admissionAge?: number;
  // 메타
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
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
  // 골프장 기본 정보
  openingDate?: string;
  holes?: string;
  totalLength?: string;
  memberCount?: string;
  courseNames?: string[];
  courseComposition?: string;
  cityAccessibility?: string;
  // 등록/예약 정보
  registrationHours?: string;
  documentLink?: string;
  registrationProcedure?: string;
  reservationNotes?: string;
  weekendReservationDifficulty?: string;
  claimFrequency?: string;
  // 비용 정보 (숫자 또는 객체 형태 가능)
  weekdayGreenFee?: number | Record<string, number>;
  weekendGreenFee?: number | Record<string, number>;
  cartFee?: number | Record<string, number>;
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;
  // 거래 정보
  registrationDifficulty?: string;
  additionalDocumentFrequency?: string;
  transactionTendency?: string;
  tradableTypeSummary?: string;
  minTransactionUnit?: string;
  recentTransactionType?: string;
  balanceRisk?: string;
  transactionRiskMemo?: string;
  dealerMemo?: string;
  membershipInfo?: string;
  // 시나리오 정보
  scenariosCount?: number;
  scenarioOptions?: ScenarioOptions;
  scenarios?: ScenarioWithDocuments[];
  // 서류 정보
  documentsGlobal?: Document[];
  documentsCustomer?: Document[];
  // 회원권 정보
  memberships?: Membership[];
  // 타임스탬프
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioOptions {
  availableFilters: AvailableFilters;
  scenarios: Scenario[];
  totalScenarios: number;
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
  clubDocumentId?: string;
  docCode?: string;
  name: string;
  fileName?: string;
  fileDescription?: string;
  minCount: number;
  unit: string;
  isMandatory: boolean;
  notes: string;
  displayOrder: number;
  condition?: string;
  clubRequirement?: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
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

// 시나리오별 서류 정보 (detail API response 내 scenarios 배열)
export interface ScenarioWithDocuments {
  scenario: {
    scenarioCode: string;
    name: string;
    description?: string;
  };
  documentsLocal: Document[];
  summary: DocumentsSummary;
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
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily: boolean;
  requiresTaxInvoice: boolean;
}
