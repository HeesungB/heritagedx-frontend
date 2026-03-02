import type { ApiClient } from "@heritage-dx/api-client";
import type { GeneralRepositories } from "../interfaces";
import { ClubRepository } from "../repositories/general/club.repository.impl";
import { ScenarioRepository } from "../repositories/general/scenario.repository.impl";
import { ConsultationRepository } from "../repositories/general/consultation.repository.impl";
import { MembershipTradeRepository } from "../repositories/general/membership-trade.repository.impl";
import { ClaimRepository } from "../repositories/general/claim.repository.impl";

export function createGeneralRepositories(
  apiClient: ApiClient,
): GeneralRepositories {
  return {
    clubs: new ClubRepository(apiClient),
    scenarios: new ScenarioRepository(apiClient),
    consultations: new ConsultationRepository(apiClient),
    membershipTrades: new MembershipTradeRepository(apiClient),
    claims: new ClaimRepository(apiClient),
  };
}
