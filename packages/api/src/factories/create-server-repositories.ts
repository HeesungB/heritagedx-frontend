import type { ServerRepositories } from "../interfaces";
import { ClubServerRepository } from "../repositories/server/club.server-repository.impl";
import { NoticeServerRepository } from "../repositories/server/notice.server-repository.impl";
import { MarketPriceServerRepository } from "../repositories/server/market-price.server-repository.impl";

interface ServerRepoConfig {
  baseUrl: string;
  /**
   * 모든 도메인에 동일 TTL 을 강제할 때만 사용. 미지정 시 각 server repository 의 도메인별 default TTL 이 적용됨.
   * (clubs 300s, notices 1800s, market-prices 3600s)
   */
  revalidate?: number;
}

export function createServerRepositories(
  config: ServerRepoConfig,
): ServerRepositories {
  return {
    clubs: new ClubServerRepository(config),
    notices: new NoticeServerRepository(config),
    marketPrices: new MarketPriceServerRepository(config),
  };
}
