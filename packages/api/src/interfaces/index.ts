export type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
  IClaimRepository,
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
} from "./admin";

import type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
  IClaimRepository,
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
} from "./admin";

export interface GeneralRepositories {
  clubs: IClubRepository;
  scenarios: IScenarioRepository;
  consultations: IConsultationRepository;
  membershipTrades: IMembershipTradeRepository;
  claims: IClaimRepository;
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
}

export interface ServerRepositories {
  clubs: IClubRepository;
}
