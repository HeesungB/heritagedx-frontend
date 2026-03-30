"use client";

import { useMarketPriceSummary } from "@/hooks/useMarketPriceSummary";
import type { MembershipListing } from "@/types";

interface MarketPriceSummaryProps {
  clubId?: string;
}

function toManwon(price: number | null): string {
  if (price == null || price <= 0) return "—";
  return Math.round(price / 10000).toLocaleString();
}

function formatTimestamp(ts: string | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function ListingCard({ listing }: { listing: MembershipListing }) {
  const hasBuy = listing.buyRepresentativePrice != null && listing.buyRepresentativePrice > 0;
  const hasSell = listing.sellRepresentativePrice != null && listing.sellRepresentativePrice > 0;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-100 min-w-[280px] w-auto">
      <span className="text-[11px] text-gray-600 font-medium truncate min-w-[120px] shrink-0" title={listing.membershipName}>
        {listing.membershipName}
      </span>
      <div className="h-3 w-px bg-gray-200" />
      <div className="flex items-baseline gap-1 min-w-[72px]">
        <span className={`text-[10px] ${hasBuy ? "text-red-500" : "text-gray-300"}`}>매수</span>
        <span className={`text-xs tabular-nums ${hasBuy ? "font-semibold text-gray-800" : "text-gray-300"}`}>
          {toManwon(listing.buyRepresentativePrice)}
        </span>
      </div>
      <div className="flex items-baseline gap-1 min-w-[72px]">
        <span className={`text-[10px] ${hasSell ? "text-blue-500" : "text-gray-300"}`}>매도</span>
        <span className={`text-xs tabular-nums ${hasSell ? "font-semibold text-gray-800" : "text-gray-300"}`}>
          {toManwon(listing.sellRepresentativePrice)}
        </span>
      </div>
    </div>
  );
}

export default function MarketPriceSummary({ clubId }: MarketPriceSummaryProps) {
  const { listings, timestamp, isLoading, listingError } =
    useMarketPriceSummary(clubId);

  const hasData = listings.length > 0;

  return (
    <div className="mx-6 mt-2 mb-1 print:hidden">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-gray-400">매물 시세</span>
        {isLoading ? (
          <span className="text-[10px] text-gray-300">로딩 중...</span>
        ) : listingError ? (
          <span className="text-[10px] text-gray-300">불러올 수 없음</span>
        ) : !hasData ? (
          <span className="text-[10px] text-gray-300">매물 없음</span>
        ) : timestamp ? (
          <span className="text-[10px] text-gray-300">
            {formatTimestamp(timestamp)} 기준
          </span>
        ) : null}
      </div>
      {hasData && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {listings.map((l) => (
            <ListingCard key={l.membershipId} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
