import { useState, useEffect, useCallback } from "react";
import type { MembershipListing } from "@/types";

const API_BASE = "https://api.heritage-dx.com/api";

interface MarketPriceSummaryResult {
  listings: MembershipListing[];
  timestamp: string | null;
  isLoading: boolean;
  listingError: boolean;
}

export function useMarketPriceSummary(
  clubId?: string
): MarketPriceSummaryResult {
  const [listings, setListings] = useState<MembershipListing[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listingError, setListingError] = useState(false);

  const fetchListings = useCallback(async (id: string) => {
    setIsLoading(true);
    setListingError(false);
    try {
      const all: MembershipListing[] = [];
      let page = 1;
      let totalPages = 1;
      let ts: string | null = null;

      do {
        const params = new URLSearchParams({ clubId: id, limit: "100", page: String(page) });
        const response = await fetch(`${API_BASE}/membership-listings?${params}`);
        if (!response.ok) throw new Error(`API ${response.status}`);

        const res = await response.json();
        const items: MembershipListing[] = res.data?.listings ?? [];
        all.push(...items);
        totalPages = res.data?.pagination?.totalPages ?? 1;
        ts = res.timestamp ?? ts;
        page++;
      } while (page <= totalPages);

      setListings(all);
      setTimestamp(ts);
    } catch (err) {
      console.error("[매물시세] ERROR:", err);
      setListings([]);
      setTimestamp(null);
      setListingError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clubId) {
      fetchListings(clubId);
    } else {
      setListings([]);
      setTimestamp(null);
      setListingError(false);
    }
  }, [clubId, fetchListings]);

  return { listings, timestamp, isLoading, listingError };
}
