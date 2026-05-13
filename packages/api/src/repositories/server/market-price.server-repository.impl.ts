import type { IMarketPriceRepository } from "../../interfaces/general/market-price.repository";

interface ServerRepoConfig {
  baseUrl: string;
  revalidate?: number;
}

const DEFAULT_TTL = 3600;
const CACHE_TAG = "market-prices";

export class MarketPriceServerRepository implements IMarketPriceRepository {
  constructor(private config: ServerRepoConfig) {}

  async listByMembership(
    membershipId: string,
    params: { from: string; to: string },
  ): Promise<{ prices: Array<{ date: string; marketPrice: number }> }> {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    const res = await fetch(
      `${this.config.baseUrl}/clubs/memberships/${membershipId}/market-prices?${query}`,
      {
        next: {
          revalidate: this.config.revalidate ?? DEFAULT_TTL,
          tags: [CACHE_TAG, `market-prices:${membershipId}`],
        },
      },
    );

    if (!res.ok) {
      throw new Error("시세 데이터 조회 실패");
    }

    const data = await res.json();
    const payload = data.data || data;
    return { prices: payload.prices ?? [] };
  }
}
