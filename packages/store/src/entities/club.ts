import type { MembershipEntity } from "./membership";
import type { ScenarioWithDocsEntity } from "./scenario";
import type { GlobalDocumentEntity, CustomerDocumentEntity } from "./document";

export interface ClubContactEntity {
  id: string;
  phoneNumber: string | null;
  fax: string | null;
  email: string | null;
  contactPerson: string | null;
  department: string | null;
  isPrimary: boolean;
}

export interface BankAccountEntity {
  id: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
}

/** 목록용 경량 엔티티 — @heritage-dx/types Club과 구조적 호환 */
export interface ClubEntity {
  code: string;
  name: string;
  region: string;
  contact: string;
  holes?: string;
  operationTypes: string[];
  recentMarketPrice?: string;
}

/** 상세 엔티티 — 서브 객체 그룹핑 */
export interface ClubDetailEntity {
  id: string;
  code: string;
  name: string;
  companyName: string | null;
  region: string;
  address: string;
  memo: string | null;
  updatedAt: string | null;

  basicInfo: {
    openingDate: string | null;
    holes: string | null;
    totalLength: string | null;
    memberCount: number | null;
    courseNames: string[];
    courseComposition: string | null;
    cityAccessibility: string | null;
    introduction: string | null;
    facilities: string | null;
  };

  costs: {
    registrationFee: string | null;
    stampDuty: string | null;
    agencyFee: string | null;
    otherCosts: string | null;
    taxOfficial: string | null;
    weekdayGreenFee: Record<string, number>;
    weekendGreenFee: Record<string, number>;
    caddyFee: number | null;
    cartFee: number | null;
  };

  marketInfo: {
    recentMarketPrice: string | null;
    recentPriceUpdateDate: string | null;
    avgMarketPrice3y: string | null;
    dealerPriceRange: string | null;
    transactionTendency: string | null;
    tradableTypeSummary: string | null;
    minTransactionUnit: string | null;
    recentTransactionType: string | null;
    balanceRisk: number | null;
    registrationDifficulty: number | null;
    dealerMemo: string | null;
    membershipInfo: string | null;
  };

  registration: {
    registrationHours: string | null;
    registrationProcedure: string | null;
    documentLink: string | null;
    submissionMethods: string[];
    processingTime: string | null;
    externalUrl: string | null;
    reservationNotes: string | null;
  };

  contacts: ClubContactEntity[];
  bankAccounts: BankAccountEntity[];
  memberships: MembershipEntity[];
  scenarios: ScenarioWithDocsEntity[];
  documentsGlobal: GlobalDocumentEntity[];
  documentsCustomer: CustomerDocumentEntity[];
}
