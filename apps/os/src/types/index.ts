// Entity types from store (replaces ~300 lines of custom DTO types)
export type {
  ClubEntity as Club,
  ClubDetailEntity as ClubDetail,
  ClubContactEntity as ClubContact,
  BankAccountEntity as BankAccount,
  MembershipEntity as Membership,
  MembershipDocumentEntity as MembershipDocument,
  GlobalDocumentEntity as GlobalDocument,
  CustomerDocumentEntity as CustomerDocument,
  DocumentEntity as Document,
  DocumentsSummaryEntity as DocumentsSummary,
  ScenarioWithDocsEntity as ScenarioWithDocuments,
  TradeMemoEntity as MembershipTrade,
  TradeRecordEntity as MembershipTradeRecord,
  PaginationState,
  FetchStatus,
} from "@heritage-dx/store";

// Scenario/filter types (from shared DTO — used by scenario components, no entity needed)
export type {
  AvailableFilters,
  FilterOption,
  Scenario,
  ScenarioOptions,
} from "@heritage-dx/types";

// Local import for use within this file
import type { AvailableFilters } from "@heritage-dx/types";

// OS-specific types (no entity equivalent)

export interface Step {
  number: number;
  title: string;
  description: string;
  active?: boolean;
}

export interface TransactionFormData {
  side: string;
  ownerType: string;
  hasProxy: boolean | null;
  isCertificateLost: boolean | null;
  selectedScenarioId: string | null;
  scenarioCode?: string;
}

export interface TransactionOptions {
  side: "Buyer" | "Seller" | "";
  ownerType: "Personal" | "Corporate" | "";
  hasProxy: boolean;
  isCertificateLost: boolean;
  isFamily: boolean;
  requiresTaxInvoice: boolean;
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

export interface DocumentsResponse {
  success: boolean;
  data: {
    scenario: DocumentsScenario;
    club: DocumentsClub;
    documents: import("@heritage-dx/store").DocumentEntity[];
    summary: import("@heritage-dx/store").DocumentsSummaryEntity;
  };
  timestamp: string;
}

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

export interface ScenarioOptionsResponse {
  success: boolean;
  data: {
    clubCode: string;
    clubName: string;
    availableFilters: AvailableFilters;
    scenarios: import("@heritage-dx/types").Scenario[];
    totalScenarios: number;
  };
  timestamp: string;
}

// Trade form types (flat form state — separate from entity types)
export interface MembershipTradeForm {
  clubId: string;
  clubName: string;
  membershipType: string;
  tradeType: string;
  customerName: string;
  contact: string;
  offerPrice: number;
  offerPriceNote: string;
  desiredPrice: number;
  desiredPriceNote: string;
  notes: string;
  registrationDate: string;
  tradeDate: string;
  remarks: string;
  isDone: boolean;
}

export interface MembershipTradeRecordForm {
  clubName: string;
  customerName: string;
  contact: string;
  tradeType: "매수" | "매도";
  membershipName: string;
  contractDate: string;
  amount: number;
  tradingPartner: string;
  tradeAmount: number;
  commission: number;
  marketProfit: number;
  expense: number;
  description: string;
  contractFee: number;
  balanceDate: string;
  balanceCompleted: boolean;
  manager: string;
  taxTransfer: boolean;
  taxAcquisition: boolean;
  invoiceSales: number;
  invoicePurchase: number;
  remarks: string;
  actualTransactionDate: string;
}

// Listing price types
export type { MembershipListing } from "./exchange-price";

// Notice types
export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeForm {
  title: string;
  content: string;
}

export interface NoticesResponse {
  success: boolean;
  data: {
    notices: Notice[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  timestamp: string;
}
