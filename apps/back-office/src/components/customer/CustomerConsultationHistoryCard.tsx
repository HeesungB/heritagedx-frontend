"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import type { CustomerHistorySummaryEntity } from "@heritage-dx/store";
import CustomerCardShell from "./CustomerCardShell";
import {
  classifyTradeStatus,
  TRADE_STATUS_COLOR,
  TRADE_STATUS_LABEL,
  type TradeStatusKey,
} from "./trade-status";

interface CustomerConsultationHistoryCardProps {
  summary: CustomerHistorySummaryEntity | null;
  isLoading?: boolean;
}

export default function CustomerConsultationHistoryCard({
  summary,
  isLoading,
}: CustomerConsultationHistoryCardProps) {
  const consultationCount = summary?.summary.consultationCount ?? 0;
  const recentConsultations = summary?.recentConsultations ?? [];

  // 하단 리스트(recentConsultations) 의 approvalStatus 분포 그대로 상단에 노출 — 동일 데이터 소스로 1:1 일치.
  // active(진행) + pending(대기) 셀을 각각 분리해 라벨/카운트가 행의 dot+라벨과 정확히 매칭되게 한다.
  const stats = recentConsultations.reduce(
    (acc, c) => {
      const k = classifyTradeStatus(c.approvalStatus);
      acc[k] += 1;
      return acc;
    },
    { done: 0, active: 0, pending: 0, canceled: 0 } as Record<
      TradeStatusKey,
      number
    >,
  );

  return (
    <CustomerCardShell
      title="상담 이력"
      pill={consultationCount}
      titleMeta={
        recentConsultations.length > 0
          ? `· 최근 ${recentConsultations.length}건 기준`
          : undefined
      }
      action={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-[26px] px-[9px] rounded-md bg-surface border border-neutral-200 text-neutral-600 text-[11.5px] font-medium cursor-pointer transition-colors hover:text-neutral-900 hover:border-[#D4D4D2]"
        >
          전체 보기
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <StatCell statusKey="active" value={stats.active} unit="건" />
        <StatCell statusKey="pending" value={stats.pending} unit="건" />
        <StatCell statusKey="done" value={stats.done} unit="건" />
        <StatCell statusKey="canceled" value={stats.canceled} unit="건" />
      </div>

      <div className="border border-neutral-100 rounded-[10px] overflow-hidden">
        {isLoading && recentConsultations.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-neutral-500">
            상담 이력을 불러오는 중…
          </div>
        ) : recentConsultations.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-neutral-500">
            상담 이력이 없습니다.
          </div>
        ) : (
          recentConsultations.map((c, idx) => (
            <ConsultationRow
              key={c.id}
              clubName={c.clubName}
              membershipName={c.membershipName}
              side={c.tradeType}
              date={c.registrationDate}
              status={c.approvalStatus}
              defaultOpen={idx === 0}
            />
          ))
        )}
      </div>
    </CustomerCardShell>
  );
}

function StatCell({
  statusKey,
  value,
  unit,
}: {
  statusKey: TradeStatusKey;
  value: number;
  unit: string;
}) {
  return (
    <div className="bg-[#FAFAF9] border border-neutral-100 rounded-[10px] px-4 py-3.5 min-w-0">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 tracking-[-0.005em]">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: TRADE_STATUS_COLOR[statusKey] }}
        />
        {TRADE_STATUS_LABEL[statusKey]}
      </span>
      <span className="flex items-baseline gap-[3px] mt-1.5">
        <span className="text-[22px] font-bold text-neutral-900 tracking-[-0.025em] tabular-nums leading-none">
          {value}
        </span>
        <span className="text-[11.5px] text-neutral-600">{unit}</span>
      </span>
    </div>
  );
}

function sideChipClass(side: "매수" | "매도"): string {
  return side === "매수"
    ? "bg-[#E8EEFB] text-[#2D3FAA]"
    : "bg-[#FEE2E2] text-[#991B1B]";
}

function ConsultationRow({
  clubName,
  membershipName,
  side,
  date,
  status,
  defaultOpen,
}: {
  clubName: string;
  membershipName: string;
  side: "매수" | "매도";
  date: string | null;
  status: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const statusKey = classifyTradeStatus(status);
  return (
    <div className="border-t border-neutral-50 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full grid grid-cols-[16px_minmax(0,1fr)_auto_auto_auto] items-center gap-2.5 px-4 py-[13px] cursor-pointer transition-colors hover:bg-[#FAFAF9] text-left"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
          strokeWidth={1.8}
        />
        <span className="flex items-center gap-1.5 min-w-0 text-[12.5px] text-neutral-900">
          <span className="font-semibold flex-shrink-0">{clubName}</span>
          <span className="text-neutral-400 flex-shrink-0">·</span>
          <span className="text-neutral-600 flex-shrink-0">{membershipName}</span>
        </span>
        <span
          className={`inline-flex items-center h-5 px-[7px] rounded text-[10.5px] font-semibold tracking-[0.02em] font-mono ${sideChipClass(side)}`}
        >
          {side}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 tracking-[-0.005em] whitespace-nowrap">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: TRADE_STATUS_COLOR[statusKey] }}
          />
          {TRADE_STATUS_LABEL[statusKey]}
        </span>
        <span className="text-[11.5px] text-neutral-400 font-mono">
          {date ?? "—"}
        </span>
      </button>
      {open && (
        <div className="bg-[#FAFAF9] px-4 py-[14px] border-t border-neutral-50 flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg bg-surface min-w-0">
              <Pencil className="w-[13px] h-[13px] text-neutral-400 flex-shrink-0" strokeWidth={1.7} />
              <input
                type="text"
                placeholder={`${clubName} · ${membershipName} 메모를 추가… (Enter)`}
                className="flex-1 min-w-0 border-none outline-none bg-transparent text-[12.5px] text-neutral-900 tracking-[-0.005em] placeholder:text-neutral-400"
                disabled
              />
            </div>
            <button
              type="button"
              disabled
              className="h-9 px-4 rounded-lg bg-neutral-900 text-white border-none text-[12px] font-semibold cursor-not-allowed opacity-50"
            >
              추가
            </button>
          </div>
          <div className="pl-[18px] text-[12px] text-neutral-400">
            상세 메모는 상담일지에서 관리할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}
