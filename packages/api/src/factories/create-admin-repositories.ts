import type { ApiClient } from "@heritage-dx/api-client";
import type { AdminRepositories } from "../interfaces";
import { ClubAdminRepository } from "../repositories/admin/club-admin.repository.impl";
import { ScenarioAdminRepository } from "../repositories/admin/scenario-admin.repository.impl";
import { DocumentAdminRepository } from "../repositories/admin/document-admin.repository.impl";
import { ClubDocumentAdminRepository } from "../repositories/admin/club-document-admin.repository.impl";
import { ClubScenarioDocumentAdminRepository } from "../repositories/admin/club-scenario-document-admin.repository.impl";
import { GlobalDocumentAdminRepository } from "../repositories/admin/global-document-admin.repository.impl";
import { CustomerDocumentAdminRepository } from "../repositories/admin/customer-document-admin.repository.impl";
import { UserAdminRepository } from "../repositories/admin/user-admin.repository.impl";
import { OrganizationAdminRepository } from "../repositories/admin/organization-admin.repository.impl";
import { MembershipAdminRepository } from "../repositories/admin/membership-admin.repository.impl";
import { KpiAdminRepository } from "../repositories/admin/kpi-admin.repository.impl";
import { ConsultationAdminRepository } from "../repositories/admin/consultation-admin.repository.impl";
import { MembershipTradeAdminRepository } from "../repositories/admin/membership-trade-admin.repository.impl";
import { SettlementAdminRepository } from "../repositories/admin/settlement-admin.repository.impl";

export function createAdminRepositories(
  apiClient: ApiClient,
  baseUrl: string,
): AdminRepositories {
  return {
    clubs: new ClubAdminRepository(apiClient),
    scenarios: new ScenarioAdminRepository(apiClient),
    documents: new DocumentAdminRepository(apiClient),
    clubDocuments: new ClubDocumentAdminRepository(apiClient),
    clubScenarioDocuments: new ClubScenarioDocumentAdminRepository(apiClient),
    globalDocuments: new GlobalDocumentAdminRepository(apiClient, baseUrl),
    customerDocuments: new CustomerDocumentAdminRepository(apiClient),
    users: new UserAdminRepository(apiClient),
    organizations: new OrganizationAdminRepository(apiClient),
    memberships: new MembershipAdminRepository(apiClient),
    kpi: new KpiAdminRepository(apiClient),
    consultations: new ConsultationAdminRepository(apiClient),
    membershipTrades: new MembershipTradeAdminRepository(apiClient),
    settlements: new SettlementAdminRepository(apiClient),
  };
}
