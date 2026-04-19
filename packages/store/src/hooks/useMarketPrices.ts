"use client";

import { useState, useEffect, useCallback } from "react";
import { useMarketPriceRepository } from "@heritage-dx/api";

export type MarketPricePeriod = "1w" | "1m" | "3m" | "1y";

export interface MarketPricePoint {
  date: string;
  marketPrice: number;
}

function getFromDate(period: MarketPricePeriod): string {
  const now = new Date();
  switch (period) {
    case "1w":
      now.setDate(now.getDate() - 7);
      break;
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      now.setMonth(now.getMonth() - 3);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString().split("T")[0];
}

function formatToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function useMarketPrices(
  membershipId: string,
  period: MarketPricePeriod,
) {
  const repo = useMarketPriceRepository();
  const [prices, setPrices] = useState<MarketPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetch = useCallback(
    async (mId: string, p: MarketPricePeriod) => {
      setIsLoading(true);
      setIsError(false);
      try {
        const from = getFromDate(p);
        const to = formatToday();
        const data = await repo.listByMembership(mId, { from, to });
        setPrices(data.prices);
      } catch {
        setIsError(true);
        setPrices([]);
      } finally {
        setIsLoading(false);
      }
    },
    [repo],
  );

  useEffect(() => {
    fetch(membershipId, period);
  }, [membershipId, period, fetch]);

  return { prices, isLoading, isError, refetch: () => fetch(membershipId, period) };
}
