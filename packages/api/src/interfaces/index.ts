export type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
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
} from "./admin";

import type {
  IClubRepository,
  IScenarioRepository,
  IConsultationRepository,
  IMembershipTradeRepository,
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
} from "./admin";

export interface GeneralRepositories {
  clubs: IClubRepository;
  scenarios: IScenarioRepository;
  consultations: IConsultationRepository;
  membershipTrades: IMembershipTradeRepository;
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
}

export interface ServerRepositories {
  clubs: IClubRepository;
}
