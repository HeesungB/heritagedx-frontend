"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  ReceiptText,
  Trash2,
  UsersRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@heritage-dx/ui";
import {
  canAdvanceTradeToCompleted,
  canAdvanceTradeToTaxFiling,
  canRejectTradeRecord,
  formatTradeRecordPrice,
  getTradeWorkflowMeta,
  type TradeRecordWorkflowTone,
} from "@heritage-dx/store";
import type { TradeRecordView } from "./types";

interface TradeRecordDetailPanelProps {
  record: TradeRecordView | null;
  canDelete: boolean;
  approvalBusyId: string | null;
  onEdit: (record: TradeRecordView) => void;
  onDelete: (record: TradeRecordView) => void;
  onAdvanceToTaxFiling: (record: TradeRecordView) => void;
  onAdvanceToCompleted: (record: TradeRecordView) => void;
  onReject: (record: TradeRecordView) => void;
}

function displayText(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "완료" : "미완료";
  return String(value);
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function getProfitValue(record: TradeRecordView): number | null {
  return record.marketProfit ?? record.netProfit ?? null;
}

function getProfitLabel(record: TradeRecordView): string {
  return record.marketProfit != null ? "시세차익" : "순이익";
}

const TONE_PILL_CLASS: Record<TradeRecordWorkflowTone, string> = {
  completed: "border border-[#ECECEA] bg-[#F5F5F4] text-[#525252]",
  tax: "border border-[#E2DEF1] bg-[#F0EEF8] text-[#4D3FAA]",
  doc: "border border-[#ECECEA] bg-[#FAFAF9] text-[#737373]",
  rejected: "border border-[#F4CCCC] bg-[#FDF4F4] text-[#DC2626]",
};

function WorkflowPill({ tone, label }: { tone: TradeRecordWorkflowTone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-semibold leading-[1.5] tracking-[0.04em] ${TONE_PILL_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  footer,
  isPrimary,
}: {
  label: string;
  value: string;
  footer: string;
  isPrimary?: boolean;
}) {
  const isEmpty = value === "-";
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        isPrimary ? "border-[#DDEAFC] bg-[#F3F7FE]" : "border-[#ECECEA] bg-white"
      }`}
    >
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#A3A3A3]">
        {label}
      </span>
      <div className="mt-1.5">
        <span
          className={`text-[22px] font-bold tabular-nums leading-none tracking-[-0.02em] ${
            isPrimary
              ? "text-[#2F6FEB]"
              : isEmpty
                ? "font-semibold text-[#C4C4C2]"
                : "text-[#0A0A0A]"
          }`}
        >
          {value}
        </span>
      </div>
      <span className="mt-1.5 font-mono text-[11px] tracking-[0.02em] text-[#A3A3A3]">
        {footer}
      </span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  meta,
  children,
}: {
  title: string;
  icon: LucideIcon;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#ECECEA] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#F0F0EE] px-5 py-3.5">
        <h3 className="m-0 inline-flex items-center gap-2 text-[13px] font-bold tracking-[-0.01em] text-[#0A0A0A]">
          <Icon className="h-3.5 w-3.5 text-[#A3A3A3]" strokeWidth={1.7} />
          {title}
        </h3>
        {meta && (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#A3A3A3]">
            {meta}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string; mono?: boolean; wide?: boolean }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
      {items.map((item) => (
        <div key={item.label} className={item.wide ? "col-span-2" : ""}>
          <dt className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#A3A3A3]">
            {item.label}
          </dt>
          <dd
            className={`mt-1 text-[13.5px] font-medium tracking-[-0.005em] ${
              item.value === "-" ? "text-[#C4C4C2]" : "text-[#0A0A0A]"
            } ${item.mono ? "font-mono tracking-[0]" : ""}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Timeline({ record }: { record: TradeRecordView }) {
  const rawItems = [
    { label: "계약일", date: record.contractDate },
    { label: "잔금일", date: record.balanceDate },
    { label: "실거래일", date: record.actualTransactionDate },
  ];

  const items = rawItems.map((item, i) => {
    const hasDate = Boolean(item.date);
    const prevHasDate = i > 0 && Boolean(rawItems[i - 1].date);
    const state: "done" | "pending" | "todo" = hasDate
      ? "done"
      : prevHasDate
        ? "pending"
        : "todo";
    return {
      ...item,
      state,
      statusText: state === "done" ? "완료" : state === "pending" ? "예정" : "대기",
    };
  });

  const dotClass: Record<string, string> = {
    done: "border-[#047857] bg-[#047857]",
    pending: "border-[#EAB308] bg-[#FEF9E7]",
    todo: "border-[#D4D4D2] bg-white",
  };

  const badgeClass: Record<string, string> = {
    done: "bg-[#E8F4ED] text-[#047857]",
    pending: "bg-[#FEF6DC] text-[#92660A]",
    todo: "bg-[#F5F5F4] text-[#A3A3A3]",
  };

  return (
    <div className="pl-1.5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`grid grid-cols-[16px_1fr_auto] items-start gap-3.5 py-3.5 ${
            i > 0 ? "border-t border-dashed border-[#ECECEA]" : ""
          }`}
        >
          <span
            className={`mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 ${dotClass[item.state]}`}
          >
            {item.state === "done" && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-2 w-2"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-semibold tracking-[-0.005em] text-[#0A0A0A]">
              {item.label}
            </span>
            <span className="font-mono text-[11.5px] tracking-[0] text-[#737373]">
              {item.date ? displayDate(item.date) : "— 미정 —"}
            </span>
          </div>
          <span
            className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em] ${badgeClass[item.state]}`}
          >
            {item.statusText}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatTag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold tracking-[-0.005em] ${
        on
          ? "border-[#C9E6D3] bg-[#E8F4ED] text-[#047857]"
          : "border-[#ECECEA] bg-[#FAFAF9] text-[#A3A3A3]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-[#047857]" : "bg-[#D4D4D2]"}`} />
      {label}
    </span>
  );
}

export default function TradeRecordDetailPanel({
  record,
  canDelete,
  approvalBusyId,
  onEdit,
  onDelete,
  onAdvanceToTaxFiling,
  onAdvanceToCompleted,
  onReject,
}: TradeRecordDetailPanelProps) {
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 px-16 py-20 text-[#A3A3A3]">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#ECECEA] bg-white text-[#C4C4C2]">
          <ClipboardList className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <span className="text-[14px] font-semibold text-[#525252]">거래를 선택해주세요</span>
        <span className="text-[12.5px] text-[#A3A3A3]">
          목록에서 거래를 선택하면 상세 정보를 확인할 수 있습니다.
        </span>
      </div>
    );
  }

  const workflowMeta = getTradeWorkflowMeta(record.workflowStatus);
  const isBusy = approvalBusyId === record.id;
  const showAdvanceToTaxFiling =
    record.workflowStatus === "DOCUMENT_AND_BALANCE" && canAdvanceTradeToTaxFiling(record);
  const showAdvanceToCompleted =
    record.workflowStatus === "TAX_FILING" && canAdvanceTradeToCompleted(record);
  const showReject =
    (record.workflowStatus === "DOCUMENT_AND_BALANCE" ||
      record.workflowStatus === "TAX_FILING") &&
    canRejectTradeRecord(record);
  const profitValue = getProfitValue(record);

  return (
    <div>
      <div className="mb-6 border-b border-[#ECECEA] pb-5">
        <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11.5px] tracking-[0.04em] text-[#A3A3A3]">
          <span className="text-[#525252]">거래 내역</span>
          <ChevronRight className="h-2.5 w-2.5 text-[#D4D4D2]" strokeWidth={2} />
          <span className="font-semibold text-[#0A0A0A]">
            {record.customerName || "— 미입력 —"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-bold leading-[1.5] tracking-[0.04em] ${
                  record.tradeType === "매수"
                    ? "bg-[#DDEAFC] text-[#2F6FEB]"
                    : "bg-[#FBE0E0] text-[#DC2626]"
                }`}
              >
                {record.tradeType}
              </span>
              <h2
                className={`m-0 text-[26px] font-bold leading-[1.15] tracking-[-0.025em] ${
                  record.customerName ? "text-[#0A0A0A]" : "text-[#C4C4C2]"
                }`}
              >
                {record.customerName || "— 미입력 —"}
              </h2>
              <WorkflowPill tone={workflowMeta.tone} label={workflowMeta.label} />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[13px] text-[#737373]">
              {record.clubName && (
                <span className="font-semibold text-[#0A0A0A]">{record.clubName}</span>
              )}
              {record.clubName && record.membershipName && (
                <span className="text-[#D4D4D2]">·</span>
              )}
              {record.membershipName && <span>{record.membershipName}</span>}
              {record.contact && (
                <>
                  <span className="text-[#D4D4D2]">·</span>
                  <span className="font-mono tracking-[0]">{record.contact}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ECECEA] bg-white px-3.5 py-[7px] text-[13px] font-semibold text-[#525252] transition-colors hover:border-[#D4D4D2] hover:text-[#0A0A0A]"
            >
              <Edit3 className="h-[13px] w-[13px]" strokeWidth={1.7} />
              편집
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(record)}
                className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#ECECEA] bg-white text-[#525252] transition-colors hover:border-[#D4D4D2] hover:text-[#0A0A0A]"
              >
                <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.7} />
              </button>
            )}
          </div>
        </div>

        {(showAdvanceToTaxFiling || showAdvanceToCompleted || showReject) && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-[#FAFAF9] p-3">
            {showAdvanceToTaxFiling && (
              <Button
                type="button"
                size="sm"
                disabled={isBusy}
                isLoading={isBusy}
                onClick={() => onAdvanceToTaxFiling(record)}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                세무신고 진행
              </Button>
            )}
            {showAdvanceToCompleted && (
              <Button
                type="button"
                size="sm"
                disabled={isBusy}
                isLoading={isBusy}
                onClick={() => onAdvanceToCompleted(record)}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                완료
              </Button>
            )}
            {showReject && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isBusy}
                isLoading={isBusy}
                onClick={() => onReject(record)}
              >
                <XCircle className="mr-1 h-4 w-4" />
                반려
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="매매가"
          value={formatTradeRecordPrice(record.amount)}
          footer="Listing price"
          isPrimary
        />
        <SummaryCard
          label="거래금"
          value={formatTradeRecordPrice(record.tradeAmount)}
          footer="Deal value"
        />
        <SummaryCard
          label="수수료"
          value={formatTradeRecordPrice(record.commission)}
          footer="Commission"
        />
        <SummaryCard
          label={getProfitLabel(record)}
          value={formatTradeRecordPrice(profitValue)}
          footer="Net gain"
        />
      </div>

      <div className="mb-4">
        <Section title="고객 / 담당" icon={UsersRound} meta="PARTIES">
          <InfoGrid
            items={[
              { label: "고객명", value: displayText(record.customerName) },
              { label: "연락처", value: displayText(record.contact), mono: true },
              {
                label: "담당자",
                value: record.manager ? displayText(record.manager) : "— 미배정 —",
              },
              { label: "작성자", value: displayText(record.createdByName) },
              { label: "거래상대", value: displayText(record.tradingPartner) },
            ]}
          />
        </Section>
      </div>

      <div className="mb-4">
        <Section title="일정" icon={CalendarDays} meta="SCHEDULE">
          <Timeline record={record} />
        </Section>
      </div>

      <div className="mb-4">
        <Section title="세금 / 상태" icon={ReceiptText} meta="TAX & STATUS">
          <div className="mb-3.5 flex flex-wrap gap-2">
            <StatTag
              on={record.balanceCompleted}
              label={record.balanceCompleted ? "잔금 완료" : "잔금 미정"}
            />
            <StatTag
              on={record.taxTransfer}
              label={record.taxTransfer ? "양도세 신고" : "양도세 미신고"}
            />
            <StatTag
              on={record.taxAcquisition}
              label={record.taxAcquisition ? "취득세 신고" : "취득세 미신고"}
            />
          </div>
          <InfoGrid
            items={[
              {
                label: "세금계산서 매출",
                value: formatTradeRecordPrice(record.invoiceSales),
                mono: true,
              },
              {
                label: "세금계산서 매입",
                value: formatTradeRecordPrice(record.invoicePurchase),
                mono: true,
              },
            ]}
          />
        </Section>
      </div>

      <Section title="특이사항" icon={FileText} meta="NOTES">
        {record.description && (
          <div className="mb-4">
            <p className="mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#A3A3A3]">
              설명
            </p>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed tracking-[-0.005em] text-[#525252]">
              {record.description}
            </p>
          </div>
        )}
        {record.remarks ? (
          <p className="rounded-[10px] border border-dashed border-[#ECECEA] bg-[#FAFAF9] px-4 py-3.5 text-[13px] leading-relaxed tracking-[-0.005em] text-[#525252]">
            {record.remarks}
          </p>
        ) : (
          <p className="rounded-[10px] border border-dashed border-[#ECECEA] bg-[#FAFAF9] py-5 text-center text-[13px] italic text-[#C4C4C2]">
            등록된 특이사항이 없습니다.
          </p>
        )}
      </Section>
    </div>
  );
}
