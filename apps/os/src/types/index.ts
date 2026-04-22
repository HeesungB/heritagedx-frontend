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
  ConsultationEntity as MembershipTrade,
  MembershipTradeEntity as MembershipTradeRecord,
  PaginationState,
  FetchStatus,
} from "@heritage-dx/store";


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

// Trade form types (flat form state — separate from entity types)
export interface MembershipTradeForm {
  clubId: string;
  clubName: string;
  membershipId: string | null;
  membershipType: string;
  tradeType: "매도" | "매수";
  customerId: string | null;
  customerName: string;
  contact: string;
  offerPrice: number;
  offerPriceNote: string;
  desiredPrice: number;
  desiredPriceNote: string;
  depositAmount: number;
  accountNumber: string;
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
  depositAmount: number;
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
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: string;
}
