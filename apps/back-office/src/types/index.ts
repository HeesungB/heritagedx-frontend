// Entity types from store (normalized, grouped domain types)
export type {
  ClubEntity,
  ClubDetailEntity,
  TradeMemoEntity,
  TradeRecordEntity,
  MembershipEntity,
  DocumentEntity,
  PaginationState,
  FetchStatus,
} from "@heritage-dx/store";

// Re-export shared types from @heritage-dx/types
export type {
  // API
  ApiResponse,
  Pagination,
  SearchParams,
  // Club
  Club,
  ClubContact,
  BankAccount,
  ClubsResponse,
  ClubDetail,
  // Membership
  Membership,
  // Document
  Document,
  DocumentsResponse,
  ClubDocument,
  ClubDocumentsResponse,
  GlobalDocument,
  GlobalDocumentsResponse,
  CustomerDocument,
  CustomerDocumentsResponse,
  ClubScenarioDocument,
  ScenarioDocumentLink,
  // Scenario
  Scenario,
  ScenarioSide,
  ScenarioOwnerType,
  ScenarioConditions,
  ScenariosResponse,
  ScenarioWithDocuments,
  ScenarioOptionItem,
  ClubScenarioOptions,
  ScenarioDocumentsResponse,
  ClubScenarioLink,
  ClubScenariosResponse,
  // Trade
  TradeMemo,
  TradeMemosResponse,
  TradeMemoInput,
  TradeRecord,
  TradeRecordsResponse,
  TradeRecordInput,
  // User
  User,
  UserRole,
  AdminUser,
  UserCreateInput,
  UserUpdateInput,
  LoginResponse,
  // Organization
  Organization,
  // KPI
  KpiTradesResponse,
  KpiTradesParams,
  KpiConsultationsResponse,
  KpiConsultationsParams,
  Employee,
} from "@heritage-dx/types";

// Back-office aliases
export type { ClubContact as Contact } from "@heritage-dx/types";

// Back-office specific types
import type {
  AdminUser as _AdminUser,
  Pagination as _Pagination,
  Membership as _Membership,
  ClubContact as _ClubContact,
  BankAccount as _BankAccount,
  ClubScenarioOptions as _ClubScenarioOptions,
  ScenarioWithDocuments as _ScenarioWithDocuments,
  GlobalDocument as _GlobalDocument,
  CustomerDocument as _CustomerDocument,
} from "@heritage-dx/types";

// 사용자 목록 응답
export interface UsersResponse {
  users: _AdminUser[];
  pagination: _Pagination;
}

// 골프장 상세 응답 (back-office 전용 - 시나리오 옵션 포함)
export interface ClubDetailResponse {
  id?: string;
  code: string;
  name: string;
  companyName?: string;
  region?: string;
  contact?: string;
  address?: string;
  transferFee?: string;
  taxOfficialRaw?: string;
  taxOfficial?: string;
  memo?: string;
  registrationHours?: string;
  documentLink?: string;
  registrationProcedure?: string;
  dealerMemo?: string;
  membershipInfo?: string;
  openingDate?: string;
  holes?: string;
  totalLength?: string;
  memberCount?: number | string;
  cityAccessibility?: string;
  courseNames?: string[];
  courseComposition?: string;
  introduction?: string;
  facilities?: string;
  reservationNotes?: string;
  weekendReservationDifficulty?: number | string;
  claimFrequency?: number | string;
  registrationFee?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  weekdayGreenFee?: number | Record<string, number>;
  weekendGreenFee?: number | Record<string, number>;
  caddyFee?: number;
  cartFee?: number;
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;
  transactionTendency?: string;
  tradableTypeSummary?: string;
  minTransactionUnit?: string;
  recentTransactionType?: string;
  balanceRisk?: number | string;
  transactionRiskMemo?: string;
  registrationDifficulty?: number | string;
  additionalDocumentFrequency?: number | string;
  submissionMethods?: string[];
  processingTime?: string;
  externalUrl?: string;
  website?: string;
  scenariosCount?: number;
  scenarioOptions?: _ClubScenarioOptions;
  scenarios?: _ScenarioWithDocuments[];
  documentsGlobal?: _GlobalDocument[];
  documentsCustomer?: _CustomerDocument[];
  memberships?: _Membership[];
  contacts?: _ClubContact[];
  bankAccounts?: _BankAccount[];
}
