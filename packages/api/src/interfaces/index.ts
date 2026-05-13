export type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
  IClaimRepository,
  IMarketPriceRepository,
  INoticeRepository,
  NoticeListParams,
  ICustomerRepository,
  CustomerListParams,
  ISettlementRepository,
} from "./general";

export type {
  IClubAdminRepository,
  IScenarioAdminRepository,
  AdminScenarioListParams,
  IDocumentAdminRepository,
  IClubDocumentAdminRepository,
  IClubScenarioDocumentAdminRepository,
  IGlobalDocumentAdminRepository,
  ICustomerDocumentAdminRepository,
  IUserAdminRepository,
  IOrganizationAdminRepository,
  IMembershipAdminRepository,
  IKpiAdminRepository,
  IConsultationAdminRepository,
  IMembershipTradeAdminRepository,
  ISettlementAdminRepository,
  AdminSettlementListParams,
} from "./admin";

import type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
  IClaimRepository,
  IMarketPriceRepository,
  INoticeRepository,
  ICustomerRepository,
  ISettlementRepository,
} from "./general";

import type {
  IClubAdminRepository,
  IScenarioAdminRepository,
  IDocumentAdminRepository,
  IClubDocumentAdminRepository,
  IClubScenarioDocumentAdminRepository,
  IGlobalDocumentAdminRepository,
  ICustomerDocumentAdminRepository,
  IUserAdminRepository,
  IOrganizationAdminRepository,
  IMembershipAdminRepository,
  IKpiAdminRepository,
  IConsultationAdminRepository,
  IMembershipTradeAdminRepository,
  ISettlementAdminRepository,
} from "./admin";

export interface GeneralRepositories {
  clubs: IClubRepository;
  scenarios: IScenarioRepository;
  consultations: IConsultationRepository;
  membershipTrades: IMembershipTradeRepository;
  claims: IClaimRepository;
  marketPrices: IMarketPriceRepository;
  notices: INoticeRepository;
  customers: ICustomerRepository;
  settlements: ISettlementRepository;
}

export interface AdminRepositories {
  clubs: IClubAdminRepository;
  scenarios: IScenarioAdminRepository;
  documents: IDocumentAdminRepository;
  clubDocuments: IClubDocumentAdminRepository;
  clubScenarioDocuments: IClubScenarioDocumentAdminRepository;
  globalDocuments: IGlobalDocumentAdminRepository;
  customerDocuments: ICustomerDocumentAdminRepository;
  users: IUserAdminRepository;
  organizations: IOrganizationAdminRepository;
  memberships: IMembershipAdminRepository;
  kpi: IKpiAdminRepository;
  consultations: IConsultationAdminRepository;
  membershipTrades: IMembershipTradeAdminRepository;
  settlements: ISettlementAdminRepository;
}

export interface ServerRepositories {
  clubs: IClubRepository;
  notices: INoticeRepository;
  marketPrices: IMarketPriceRepository;
}
