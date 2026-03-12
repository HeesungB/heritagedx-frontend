import type { Pagination } from "./api";
import type { Membership } from "./membership";
import type { ScenarioWithDocuments } from "./scenario";
import type { GlobalDocument, CustomerDocument } from "./document";

// 연락처
export interface ClubContact {
  id: string;
  phoneNumber?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  department?: string;
  isPrimary?: boolean;
}

// 계좌 정보
export interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 골프장
export interface Club {
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
  // 명의개서 비용
  registrationFee?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  // 비용 정보
  weekdayGreenFee?: number | Record<string, number>;
  weekendGreenFee?: number | Record<string, number>;
  caddyFee?: number;
  cartFee?: number;
  // 시세 정보
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;
  // 거래 정보
  transactionTendency?: string;
  tradableTypeSummary?: string;
  minTransactionUnit?: string;
  recentTransactionType?: string;
  balanceRisk?: number | string;
  transactionRiskMemo?: string;
  registrationDifficulty?: number | string;
  additionalDocumentFrequency?: number | string;
  // 접수 정보
  submissionMethods?: string[];
  processingTime?: string;
  externalUrl?: string;
  website?: string;
  operationTypes?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

// 골프장 목록 응답
export interface ClubsResponse {
  clubs: Club[];
  pagination: Pagination;
}

// 골프장 상세 응답
export interface ClubDetail {
  id: string;
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
  // 명의개서 비용
  registrationFee?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  // 비용 정보
  weekdayGreenFee?: number | Record<string, number>;
  weekendGreenFee?: number | Record<string, number>;
  caddyFee?: number;
  cartFee?: number;
  // 시세 정보
  recentMarketPrice?: string;
  recentPriceUpdateDate?: string;
  avgMarketPrice3y?: string;
  dealerPriceRange?: string;
  // 거래 정보
  transactionTendency?: string;
  tradableTypeSummary?: string;
  minTransactionUnit?: string;
  recentTransactionType?: string;
  balanceRisk?: number | string;
  transactionRiskMemo?: string;
  registrationDifficulty?: number | string;
  additionalDocumentFrequency?: number | string;
  // 접수 정보
  submissionMethods?: string[];
  processingTime?: string;
  externalUrl?: string;
  website?: string;
  // 시나리오 및 서류
  scenariosCount?: number;
  scenarios?: ScenarioWithDocuments[];
  documentsGlobal?: GlobalDocument[];
  documentsCustomer?: CustomerDocument[];
  // 회원권 정보
  memberships?: Membership[];
  // 연락처 및 계좌 정보
  contacts?: ClubContact[];
  bankAccounts?: BankAccount[];
  // 타임스탬프
  createdAt?: string;
  updatedAt?: string;
}

// 골프장 상세 API 응답
export interface ClubDetailResponse {
  success: boolean;
  data: ClubDetail;
  timestamp?: string;
}
