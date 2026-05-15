"use client";

import { Search } from "lucide-react";
import { ClubSearchSelect } from "@heritage-dx/ui";
import type { TradeRecordCounts, TradeWorkflowStatus } from "@heritage-dx/store";
import type { TradeRecordClubOption } from "./types";

type TradeTypeFilter = "" | "매수" | "매도";
type WorkflowFilter = "" | TradeWorkflowStatus;

export interface TradeRecordsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  tradeType: TradeTypeFilter;
  onTradeTypeChange: (value: TradeTypeFilter) => void;
  workflowStatus: WorkflowFilter;
  onWorkflowStatusChange: (value: WorkflowFilter) => void;
  clubs: TradeRecordClubOption[];
  selectedClubCode: string;
  onClubChange: (code: string) => void;
  memberships: string[];
  selectedMembership: string;
  onMembershipChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  topClubCodes?: string[];
  isClubFavorite?: (code: string) => boolean;
  onToggleClubFavorite?: (code: string, club: TradeRecordClubOption) => void;
  onClubSelect?: (club: TradeRecordClubOption) => void;
  disabled?: boolean;
  counts?: TradeRecordCounts;
  totalCount?: number;
}

interface ChipDef {
  label: string;
  count?: number;
  isActive: boolean;
  colorClass: string;
  activeClass: string;
  onClick: () => void;
}

export default function TradeRecordsFilterBar({
  searchValue,
  onSearchChange,
  tradeType,
  onTradeTypeChange,
  workflowStatus,
  onWorkflowStatusChange,
  clubs,
  selectedClubCode,
  onClubChange,
  memberships,
  selectedMembership,
  onMembershipChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  topClubCodes,
  isClubFavorite,
  onToggleClubFavorite,
  onClubSelect,
  disabled = false,
  counts,
  totalCount,
}: TradeRecordsFilterBarProps) {
  const isAllActive = tradeType === "" && workflowStatus === "";

  const chips: ChipDef[] = [
    {
      label: "전체",
      count: totalCount,
      isActive: isAllActive,
      colorClass: "",
      activeClass: "bg-[#0A0A0A] text-white border-[#0A0A0A]",
      onClick: () => {
        onTradeTypeChange("");
        onWorkflowStatusChange("");
      },
    },
    {
      label: "매수",
      count: counts?.buy,
      isActive: tradeType === "매수",
      colorClass: "text-[#2F6FEB] border-[#DDEAFC] bg-[#F3F7FE]",
      activeClass: "text-[#2F6FEB] border-[#DDEAFC] bg-[#F3F7FE]",
      onClick: () => onTradeTypeChange(tradeType === "매수" ? "" : "매수"),
    },
    {
      label: "매도",
      count: counts?.sell,
      isActive: tradeType === "매도",
      colorClass: "text-[#DC2626] border-[#F4CCCC] bg-[#FDF4F4]",
      activeClass: "text-[#DC2626] border-[#F4CCCC] bg-[#FDF4F4]",
      onClick: () => onTradeTypeChange(tradeType === "매도" ? "" : "매도"),
    },
    {
      label: "세무신고",
      count: counts?.tax,
      isActive: workflowStatus === "TAX_FILING",
      colorClass: "",
      activeClass: "bg-[#0A0A0A] text-white border-[#0A0A0A]",
      onClick: () =>
        onWorkflowStatusChange(workflowStatus === "TAX_FILING" ? "" : "TAX_FILING"),
    },
    {
      label: "완료",
      count: counts?.completed,
      isActive: workflowStatus === "COMPLETED",
      colorClass: "",
      activeClass: "bg-[#0A0A0A] text-white border-[#0A0A0A]",
      onClick: () =>
        onWorkflowStatusChange(workflowStatus === "COMPLETED" ? "" : "COMPLETED"),
    },
    {
      label: "진행",
      count: counts ? counts.active - counts.tax : undefined,
      isActive: workflowStatus === "DOCUMENT_AND_BALANCE",
      colorClass: "",
      activeClass: "bg-[#0A0A0A] text-white border-[#0A0A0A]",
      onClick: () =>
        onWorkflowStatusChange(
          workflowStatus === "DOCUMENT_AND_BALANCE" ? "" : "DOCUMENT_AND_BALANCE",
        ),
    },
    {
      label: "반려",
      count: undefined,
      isActive: workflowStatus === "REJECTED",
      colorClass: "",
      activeClass: "bg-[#0A0A0A] text-white border-[#0A0A0A]",
      onClick: () =>
        onWorkflowStatusChange(workflowStatus === "REJECTED" ? "" : "REJECTED"),
    },
  ];

  const inactiveBase =
    "text-[#525252] border-[#ECECEA] bg-white hover:border-[#D4D4D2] hover:text-[#0A0A0A]";

  return (
    <div className="flex-shrink-0 border-b border-[#F0F0EE] bg-white px-5 pb-3 pt-3.5">
      <div className="relative mb-2.5">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A3A3A3]"
          strokeWidth={1.7}
        />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="고객명, 회원권명, 골프장 검색…"
          disabled={disabled}
          className="h-9 w-full rounded-lg border border-[#ECECEA] bg-[#FAFAF9] pl-8 pr-3 text-[13px] tracking-[-0.005em] text-[#0A0A0A] placeholder-[#A3A3A3] outline-none focus:border-[#0A0A0A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={chip.onClick}
            disabled={disabled}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium tracking-[-0.005em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              chip.isActive ? chip.activeClass : (chip.colorClass || inactiveBase)
            }`}
          >
            {chip.label}
            {chip.count != null && (
              <span
                className={`rounded-full px-1.5 py-px font-mono text-[10px] leading-[1.6] tracking-[0] ${
                  chip.isActive && !chip.colorClass
                    ? "bg-white/20 text-white"
                    : chip.label === "매수"
                      ? "bg-[rgba(47,111,235,0.12)] text-[#2F6FEB]"
                      : chip.label === "매도"
                        ? "bg-[rgba(220,38,38,0.12)] text-[#DC2626]"
                        : "bg-[#F5F5F4] text-[#525252]"
                }`}
              >
                {chip.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ClubSearchSelect
          clubs={clubs}
          selectedClubCode={selectedClubCode}
          onChange={onClubChange}
          compact
          placeholder="전체 골프장"
          topClubCodes={topClubCodes}
          isFavorite={isClubFavorite}
          onToggleFavorite={(code, item) => onToggleClubFavorite?.(code, item)}
          onClubSelect={(item) => onClubSelect?.(item)}
          usePortal
        />

        <select
          value={selectedMembership}
          onChange={(e) => onMembershipChange(e.target.value)}
          disabled={disabled || !selectedClubCode}
          className="h-8 w-full rounded-lg border border-[#ECECEA] bg-white px-3 text-xs text-[#525252] focus:border-[#0A0A0A] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#FAFAF9] disabled:text-[#A3A3A3]"
        >
          <option value="">전체 회원권</option>
          {memberships.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          disabled={disabled}
          className="h-8 w-full rounded-lg border border-[#ECECEA] bg-white px-3 text-xs text-[#525252] focus:border-[#0A0A0A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="hidden text-xs text-[#A3A3A3] sm:inline">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          disabled={disabled}
          className="h-8 w-full rounded-lg border border-[#ECECEA] bg-white px-3 text-xs text-[#525252] focus:border-[#0A0A0A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
