export interface IMarketPriceRepository {
  listByMembership(
    membershipId: string,
    params: { from: string; to: string },
  ): Promise<{ prices: Array<{ date: string; marketPrice: number }> }>;
}
