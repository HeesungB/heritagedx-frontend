import type { ApiClient } from "@heritage-dx/api-client";
import type { IMarketPriceRepository } from "../../interfaces/general/market-price.repository";

export class MarketPriceRepository implements IMarketPriceRepository {
  constructor(private api: ApiClient) {}

  async listByMembership(
    membershipId: string,
    params: { from: string; to: string },
  ): Promise<{ prices: Array<{ date: string; marketPrice: number }> }> {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    const res = await this.api.get<{
      prices: Array<{ date: string; marketPrice: number }>;
    }>(`/clubs/memberships/${membershipId}/market-prices?${query}`);

    if (!res.success || !res.data) {
      throw new Error(res.error || "시세 데이터 조회 실패");
    }
    return res.data;
  }
}
