"use client";

import { formatProfitShort } from "@heritage-dx/utils";
import type { MembershipTradeEntity } from "@heritage-dx/store";

interface RecentTradesListProps {
  items: MembershipTradeEntity[];
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function tradeTitle(t: MembershipTradeEntity): string {
  const club = t.clubName ?? "";
  const membership = t.trade.membershipName ?? "";
  return [club, membership].filter(Boolean).join(" ") || "회원권 거래";
}

function tradeParty(t: MembershipTradeEntity): string {
  const me = t.customer.name ?? "";
  const counter = t.trade.tradingPartner ?? "";
  if (t.tradeType === "매도") {
    return `${me || "—"} → ${counter || "—"}`;
  }
  return `${counter || "—"} → ${me || "—"}`;
}

export default function RecentTradesList({ items }: RecentTradesListProps) {
  if (items.length === 0) {
    return <p className="text-xs text-neutral-400 py-2">최근 거래가 없습니다.</p>;
  }

  return (
    <div>
      {items.map((t, idx) => (
        <div
          key={t.id}
          className={`grid grid-cols-[46px_1fr_auto] items-baseline gap-2.5 py-[7px] ${
            idx === 0 ? "" : "border-t border-neutral-50"
          }`}
        >
          <span className="text-[11.5px] text-neutral-400 font-mono font-medium">
            {shortDate(t.trade.contractDate ?? t.createdAt)}
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-neutral-900 overflow-hidden text-ellipsis whitespace-nowrap">
              {tradeTitle(t)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {tradeParty(t)}
            </div>
          </div>
          <span className="text-xs font-semibold text-neutral-900 font-sans">
            {t.trade.tradeAmount ? formatProfitShort(t.trade.tradeAmount) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
