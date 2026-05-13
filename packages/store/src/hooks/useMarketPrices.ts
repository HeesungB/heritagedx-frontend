"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMarketPriceRepository } from "@heritage-dx/api";

export type MarketPricePeriod = "1w" | "1m" | "3m" | "1y";

export interface MarketPricePoint {
  date: string;
  marketPrice: number;
}

const TTL_MS = 60 * 60 * 1000;

interface MarketPriceCacheEntry {
  prices: MarketPricePoint[];
  fetchedAt: number;
}

const cache = new Map<string, MarketPriceCacheEntry>();

function cacheKey(membershipId: string, period: MarketPricePeriod): string {
  return `${membershipId}:${period}`;
}

export function invalidateMarketPricesCache(membershipId?: string): void {
  if (!membershipId) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${membershipId}:`)) cache.delete(key);
  }
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
  const key = cacheKey(membershipId, period);
  const cached = cache.get(key);
  const isFresh = cached && Date.now() - cached.fetchedAt < TTL_MS;

  const [prices, setPrices] = useState<MarketPricePoint[]>(cached?.prices ?? []);
  const [isLoading, setIsLoading] = useState(!isFresh);
  const [isError, setIsError] = useState(false);
  const inFlight = useRef(false);

  const fetchPrices = useCallback(
    async (mId: string, p: MarketPricePeriod, force = false) => {
      const k = cacheKey(mId, p);
      const c = cache.get(k);
      if (!force && c && Date.now() - c.fetchedAt < TTL_MS) {
        setPrices(c.prices);
        setIsLoading(false);
        setIsError(false);
        return;
      }
      if (inFlight.current) return;
      inFlight.current = true;
      setIsLoading(true);
      setIsError(false);
      try {
        const from = getFromDate(p);
        const to = formatToday();
        const data = await repo.listByMembership(mId, { from, to });
        cache.set(k, { prices: data.prices, fetchedAt: Date.now() });
        setPrices(data.prices);
      } catch {
        setIsError(true);
        setPrices([]);
      } finally {
        setIsLoading(false);
        inFlight.current = false;
      }
    },
    [repo],
  );

  useEffect(() => {
    fetchPrices(membershipId, period);
  }, [membershipId, period, fetchPrices]);

  return {
    prices,
    isLoading,
    isError,
    refetch: () => fetchPrices(membershipId, period, true),
  };
}
