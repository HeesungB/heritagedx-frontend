import type { ApiClient } from "@heritage-dx/api-client";
import type { GeneralRepositories } from "../interfaces";
import { ClubRepository } from "../repositories/general/club.repository.impl";
import { ScenarioRepository } from "../repositories/general/scenario.repository.impl";
import { ConsultationRepository } from "../repositories/general/consultation.repository.impl";
import { MembershipTradeRepository } from "../repositories/general/membership-trade.repository.impl";
import { ClaimRepository } from "../repositories/general/claim.repository.impl";
import { MarketPriceRepository } from "../repositories/general/market-price.repository.impl";
import { NoticeRepository } from "../repositories/general/notice.repository.impl";
import { CustomerRepository } from "../repositories/general/customer.repository.impl";
import { SettlementRepository } from "../repositories/general/settlement.repository.impl";

export function createGeneralRepositories(
  apiClient: ApiClient,
): GeneralRepositories {
  return {
    clubs: new ClubRepository(apiClient),
    scenarios: new ScenarioRepository(apiClient),
    consultations: new ConsultationRepository(apiClient),
    membershipTrades: new MembershipTradeRepository(apiClient),
    claims: new ClaimRepository(apiClient),
    marketPrices: new MarketPriceRepository(apiClient),
    notices: new NoticeRepository(apiClient),
    customers: new CustomerRepository(apiClient),
    settlements: new SettlementRepository(apiClient),
  };
}
