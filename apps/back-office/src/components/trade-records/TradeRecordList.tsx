"use client";

import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@heritage-dx/ui";
import {
  formatTradeRecordPrice,
  getTradeWorkflowMeta,
  groupTradeRecordsByContractMonth,
  type TradeRecordWorkflowTone,
} from "@heritage-dx/store";
import type { TradeRecordPagination, TradeRecordView } from "./types";

export interface TradeRecordListProps {
  records: TradeRecordView[];
  selectedRecordId?: string | null;
  onSelect: (record: TradeRecordView) => void;
  isLoading?: boolean;
  pagination?: TradeRecordPagination | null;
  page: number;
  onPrev: () => void;
  onNext: () => void;
}

interface TradeRecordMonthGroup {
  label: string;
  records: TradeRecordView[];
}

function normalizeGroups(records: TradeRecordView[]): TradeRecordMonthGroup[] {
  return groupTradeRecordsByContractMonth(records).map((group) => ({
    label: group.label,
    records: group.records,
  }));
}

const TONE_CLASS: Record<TradeRecordWorkflowTone, string> = {
  completed: "border border-[#ECECEA] bg-[#F5F5F4] text-[#525252]",
  tax: "border border-[#E2DEF1] bg-[#F0EEF8] text-[#4D3FAA]",
  doc: "border border-[#ECECEA] bg-[#FAFAF9] font-mono text-[9.5px] text-[#737373]",
  rejected: "border border-[#F4CCCC] bg-[#FDF4F4] text-[#DC2626]",
};

export default function TradeRecordList({
  records,
  selectedRecordId,
  onSelect,
  isLoading = false,
  pagination,
  page,
  onPrev,
  onNext,
}: TradeRecordListProps) {
  const groups = normalizeGroups(records);
  const showPagination = Boolean(pagination && pagination.totalPages > 1);

  if (isLoading && records.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-white">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#A3A3A3]" />
        <span className="text-sm text-[#737373]">불러오는 중...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-[#ECECEA] bg-white text-[#C4C4C2]">
          <FileText className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <p className="text-[14px] font-semibold text-[#525252]">거래 내역이 없습니다</p>
        <p className="mt-1 text-[12.5px] text-[#A3A3A3]">
          필터를 조정하거나 새 거래를 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-2 pb-8 pt-1 [scrollbar-width:thin]">
        {groups.map((group) => (
          <section key={group.label}>
            <div className="after:flex-1 after:h-px after:bg-[#F0F0EE] sticky top-0 z-10 flex items-center gap-2 bg-white px-3.5 pb-1.5 pt-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#A3A3A3]">
              {group.label}
              <span className="h-px flex-1 bg-[#F0F0EE]" />
            </div>
            <div>
              {group.records.map((record) => {
                const workflowMeta = getTradeWorkflowMeta(record.workflowStatus);
                const selected = selectedRecordId === record.id;

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelect(record)}
                    className={`grid w-full cursor-pointer grid-cols-[36px_1fr_auto] items-center gap-3 rounded-[10px] px-3.5 py-3 text-left transition-colors ${
                      selected ? "bg-[#F0F0EE]" : "hover:bg-[#FAFAF9]"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-[1.5] tracking-[0.04em] ${
                          record.tradeType === "매수"
                            ? "bg-[#DDEAFC] text-[#2F6FEB]"
                            : "bg-[#FBE0E0] text-[#DC2626]"
                        }`}
                      >
                        {record.tradeType}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`truncate text-[13.5px] font-semibold tracking-[-0.01em] ${
                            record.customerName ? "text-[#0A0A0A]" : "font-medium text-[#C4C4C2]"
                          }`}
                        >
                          {record.customerName || "— 미입력 —"}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-[1.5] tracking-[0.01em] ${
                            TONE_CLASS[workflowMeta.tone]
                          }`}
                        >
                          {workflowMeta.label}
                        </span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[#737373]">
                        {record.membershipName && (
                          <span className="min-w-0 truncate font-medium text-[#525252]">
                            {record.membershipName}
                          </span>
                        )}
                        {record.membershipName && record.clubName && (
                          <span className="text-[#D4D4D2]">·</span>
                        )}
                        {record.clubName && (
                          <span className="shrink-0 truncate">{record.clubName}</span>
                        )}
                        {record.contractDate && (
                          <>
                            <span className="text-[#D4D4D2]">·</span>
                            <span className="shrink-0 font-mono text-[11px] tracking-[0]">
                              {record.contractDate.slice(0, 10)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[14px] font-bold leading-none tabular-nums tracking-[-0.01em] text-[#0A0A0A]">
                        {formatTradeRecordPrice(record.amount)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${
                          record.balanceCompleted ? "text-[#047857]" : "text-[#A3A3A3]"
                        }`}
                      >
                        <span
                          className={`inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                            record.balanceCompleted ? "bg-[#047857]" : "bg-[#D4D4D2]"
                          }`}
                        >
                          {record.balanceCompleted ? (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.6}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-2 w-2 text-white"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.6}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-2 w-2 text-white"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          )}
                        </span>
                        {record.balanceCompleted ? "잔금" : "미정"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {showPagination && pagination && (
        <div className="flex shrink-0 items-center justify-between border-t border-[#F0F0EE] bg-white px-5 py-3">
          <span className="font-mono text-[11.5px] tracking-[0.02em] text-[#A3A3A3]">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={page <= 1 || !pagination.hasPrev}
              className="h-[26px] w-[26px] p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="px-1.5 font-mono text-[11.5px] tracking-[0.02em] text-[#525252]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={page >= pagination.totalPages || !pagination.hasNext}
              className="h-[26px] w-[26px] p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
