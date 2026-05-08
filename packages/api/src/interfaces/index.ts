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
  IDocumentAdminRepository,
  IClubDocumentAdminRepository,
  IScenarioDocumentAdminRepository,
  IClubScenarioDocumentAdminRepository,
  IClubScenarioAdminRepository,
  IGlobalDocumentAdminRepository,
  ICustomerDocumentAdminRepository,
  IUserAdminRepository,
  IOrganizationAdminRepository,
  IMembershipAdminRepository,
  IKpiAdminRepository,
  IConsultationAdminRepository,
  IMembershipTradeAdminRepository,
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
  IScenarioDocumentAdminRepository,
  IClubScenarioDocumentAdminRepository,
  IClubScenarioAdminRepository,
  IGlobalDocumentAdminRepository,
  ICustomerDocumentAdminRepository,
  IUserAdminRepository,
  IOrganizationAdminRepository,
  IMembershipAdminRepository,
  IKpiAdminRepository,
  IConsultationAdminRepository,
  IMembershipTradeAdminRepository,
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
  scenarioDocuments: IScenarioDocumentAdminRepository;
  clubScenarioDocuments: IClubScenarioDocumentAdminRepository;
  clubScenarios: IClubScenarioAdminRepository;
  globalDocuments: IGlobalDocumentAdminRepository;
  customerDocuments: ICustomerDocumentAdminRepository;
  users: IUserAdminRepository;
  organizations: IOrganizationAdminRepository;
  memberships: IMembershipAdminRepository;
  kpi: IKpiAdminRepository;
  consultations: IConsultationAdminRepository;
  membershipTrades: IMembershipTradeAdminRepository;
}

export interface ServerRepositories {
  clubs: IClubRepository;
}
