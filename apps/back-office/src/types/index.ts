// Entity types from store (normalized, grouped domain types)
export type {
  ClubEntity,
  ClubDetailEntity,
  ClubContactEntity,
  BankAccountEntity,
  ConsultationEntity,
  MembershipTradeEntity,
  MembershipEntity,
  DocumentEntity,
  GlobalDocumentEntity,
  CustomerDocumentEntity,
  ScenarioEntity,
  OrganizationEntity,
  UserRole,
  UserEntity,
  AdminUserEntity,
  EmployeeEntity,
  ClubDocumentEntity,
  ClubScenarioDocumentEntity,
  PaginationState,
  FetchStatus,
} from "@heritage-dx/store";

// Back-office specific types — imports for local interface definitions
import type { AdminUserEntity } from "@heritage-dx/store";
import type {
  Pagination,
  ClubScenarioOptions,
  ScenarioWithDocuments,
  GlobalDocument as _GlobalDocument,
  Membership as _Membership,
  CustomerDocument as _CustomerDocument,
  ClubContact as _ClubContact,
  BankAccount as _BankAccount,
} from "@heritage-dx/types";

// 사용자 목록 응답
export interface UsersResponse {
  users: AdminUserEntity[];
  pagination: Pagination;
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
  scenarioOptions?: ClubScenarioOptions;
  scenarios?: ScenarioWithDocuments[];
  documentsGlobal?: _GlobalDocument[];
  documentsCustomer?: _CustomerDocument[];
  memberships?: _Membership[];
  contacts?: _ClubContact[];
  bankAccounts?: _BankAccount[];
}
