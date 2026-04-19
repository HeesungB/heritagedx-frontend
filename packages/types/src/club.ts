import type { Membership } from "./membership";
import type { ScenarioWithDocuments } from "./scenario";
import type { GlobalDocument, CustomerDocument } from "./document";
import type { Pagination } from "./api";

// 연락처 (OpenAPI ClubContactDto)
export interface ClubContact {
  id: string;
  phoneNumber?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  department?: string;
  isPrimary: boolean;
}

// 계좌 정보 (OpenAPI ClubBankAccountDto)
export interface BankAccount {
  id: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

// 골프장 목록 아이템 (OpenAPI ClubListItemDto)
export interface Club {
  id: string;
  code: string;
  name: string;
  companyName?: string;
  region?: string;
  operationType?: string;
  operationTypes?: string[] | null;
  holes?: string;
}

// 골프장 목록 응답
export interface ClubsResponse {
  clubs: Club[];
  pagination: Pagination;
}

// 골프장 상세 (OpenAPI ClubDetailDataDto)
export interface ClubDetail {
  id: string;
  code: string;
  name: string;
  companyName?: string;
  region?: string;
  address?: string;
  coordinates?: string;
  registrationFee?: string;
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
  memberCount?: string;
  cityAccessibility?: string;
  courseNames?: string[];
  courseComposition?: string;
  claimFrequency?: number;
  introduction?: string;
  website?: string;
  admissionAge?: number;
  operationType?: string;
  operationTypes?: string[] | null;
  facilities?: string;
  stampDuty?: string;
  agencyFee?: string;
  otherCosts?: string;
  caddyFee?: number;
  cartFee?: number;
  // 관계 컬렉션 (스펙 required)
  contacts: ClubContact[];
  bankAccounts: BankAccount[];
  memberships: Membership[];
  scenarios: ScenarioWithDocuments[];
  documentsGlobal: GlobalDocument[];
  documentsCustomer: CustomerDocument[];
  createdAt: string;
  updatedAt: string;
}

// 골프장 상세 API 응답 (ClubDetailResponseDto)
export interface ClubDetailResponse {
  success: boolean;
  data: ClubDetail;
  timestamp?: string;
}
