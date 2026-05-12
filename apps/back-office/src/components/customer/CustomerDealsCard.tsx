"use client";

import type { CustomerHistorySummaryEntity } from "@heritage-dx/store";
import CustomerCardShell from "./CustomerCardShell";
import {
  classifyTradeStatus,
  TRADE_STATUS_COLOR as STATUS_COLOR,
  TRADE_STATUS_LABEL as STATUS_LABEL,
  type TradeStatusKey as StatusKey,
} from "./trade-status";

interface CustomerDealsCardProps {
  summary: CustomerHistorySummaryEntity | null;
}

export default function CustomerDealsCard({ summary }: CustomerDealsCardProps) {
  const totalCount = summary?.summary.membershipTradeCount ?? 0;
  const trades = summary?.recentMembershipTrades ?? [];

  const sideCounts = trades.reduce(
    (acc, t) => {
      if (t.tradeType === "매수") acc.buy += 1;
      else acc.sell += 1;
      return acc;
    },
    { buy: 0, sell: 0 },
  );

  const statusCounts = trades.reduce(
    (acc, t) => {
      acc[classifyTradeStatus(t.workflowStatus)] += 1;
      return acc;
    },
    { done: 0, active: 0, pending: 0, canceled: 0 } as Record<StatusKey, number>,
  );

  const statusTotal = Math.max(
    statusCounts.done + statusCounts.active + statusCounts.pending + statusCounts.canceled,
    1,
  );

  return (
    <CustomerCardShell
      title="거래 건수"
      titleMeta={`· 최근 ${trades.length}건 / 누적 ${totalCount}건`}
    >
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <SideCell label="매수" value={sideCounts.buy} variant="buy" />
        <SideCell label="매도" value={sideCounts.sell} variant="sell" />
      </div>

      <div className="pt-3.5 border-t border-neutral-50">
        <div className="text-[11.5px] font-semibold text-neutral-600 tracking-[-0.005em] mb-2.5">
          상태별 분포 <span className="text-neutral-400 font-normal">· 최근 거래 기준</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-[#F1F0EC] mb-3">
          {(["done", "active", "pending", "canceled"] as StatusKey[]).map((key) => {
            const pct = (statusCounts[key] / statusTotal) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                style={{ width: `${pct}%`, background: STATUS_COLOR[key] }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5">
          {(["done", "active", "pending", "canceled"] as StatusKey[]).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between text-[11.5px]"
            >
              <span className="inline-flex items-center gap-1.5 text-neutral-600 tracking-[-0.005em]">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ background: STATUS_COLOR[key] }}
                />
                {STATUS_LABEL[key]}
              </span>
              <span className="font-mono text-neutral-900 font-medium">
                {statusCounts[key]}건
              </span>
            </div>
          ))}
        </div>
      </div>

      {trades.length > 0 && (
        <div className="pt-3.5 mt-3.5 border-t border-neutral-50">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-[11.5px] font-semibold text-neutral-600 tracking-[-0.005em]">
              최근 거래 내역
            </span>
            <span className="text-[11px] text-neutral-400 font-mono tracking-[0.02em]">
              최근 {trades.length}건 · 누적 {totalCount}건
            </span>
          </div>
          <div className="border border-neutral-100 rounded-[10px] overflow-hidden">
            {trades.map((t, idx) => {
              const statusKey = classifyTradeStatus(t.workflowStatus);
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-[96px_minmax(0,1fr)_56px_minmax(0,130px)_70px] items-center gap-3 px-3.5 py-3 text-[12.5px] tracking-[-0.005em] transition-colors hover:bg-[#FAFAF9] ${
                    idx > 0 ? "border-t border-neutral-50" : ""
                  }`}
                >
                  <span className="font-mono text-neutral-500 text-[11.5px]">
                    {t.contractDate ?? "—"}
                  </span>
                  <span className="text-neutral-900 font-semibold whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                    {t.clubName}
                    <span className="text-neutral-400 font-normal ml-1.5 text-[11.5px]">
                      {t.membershipName}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center justify-center h-5 px-[7px] rounded text-[10.5px] font-semibold tracking-[0.02em] font-mono ${
                      t.tradeType === "매수"
                        ? "bg-[#EAF1FE] text-[#2E54A8]"
                        : "bg-[#FCEAE2] text-[#B85A3E]"
                    }`}
                  >
                    {t.tradeType}
                  </span>
                  <span className="font-mono text-neutral-500 text-right tabular-nums">
                    —
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 tracking-[-0.005em] justify-self-end whitespace-nowrap">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_COLOR[statusKey] }}
                    />
                    {STATUS_LABEL[statusKey]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CustomerCardShell>
  );
}

function SideCell({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "buy" | "sell";
}) {
  const cls =
    variant === "buy"
      ? "border-[#C5D4F2] bg-[#EAF1FE]"
      : "border-[#F0CBBE] bg-[#FCEAE2]";
  const dotCls = variant === "buy" ? "bg-[#5B7FD8]" : "bg-[#E68062]";
  return (
    <div className={`border rounded-[10px] px-3.5 py-3.5 ${cls}`}>
      <span className="text-[11px] text-neutral-500 font-medium tracking-[-0.005em] inline-flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        {label}
      </span>
      <div className="flex items-baseline gap-[3px] mt-2">
        <span className="text-[24px] font-bold text-neutral-900 tracking-[-0.025em] tabular-nums leading-none">
          {value}
        </span>
        <span className="text-[11.5px] text-neutral-600">건</span>
      </div>
    </div>
  );
}
