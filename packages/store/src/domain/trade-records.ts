import type { TradeWorkflowStatus } from "@heritage-dx/types";

export type TradeRecordWorkflowTone = "doc" | "tax" | "completed" | "rejected";

export interface TradeRecordWorkflowMeta {
  label: string;
  tone: TradeRecordWorkflowTone;
}

const WORKFLOW_META: Record<TradeWorkflowStatus, TradeRecordWorkflowMeta> = {
  DOCUMENT_AND_BALANCE: {
    label: "잔금/문서 진행",
    tone: "doc",
  },
  TAX_FILING: {
    label: "세무신고",
    tone: "tax",
  },
  COMPLETED: {
    label: "완료",
    tone: "completed",
  },
  REJECTED: {
    label: "반려",
    tone: "rejected",
  },
};

export function getTradeWorkflowMeta(
  status: TradeWorkflowStatus,
): TradeRecordWorkflowMeta {
  return WORKFLOW_META[status] ?? {
    label: status,
    tone: "doc",
  };
}

export interface TradeRecordWorkflowLike {
  workflowStatus: TradeWorkflowStatus;
}

export interface TradeRecordCountLike extends TradeRecordWorkflowLike {
  tradeType: "매수" | "매도";
}

export interface TradeRecordDateLike {
  contractDate: string | null;
}

export function canAdvanceTradeToTaxFiling(record: TradeRecordWorkflowLike): boolean {
  return record.workflowStatus === "DOCUMENT_AND_BALANCE";
}

export function canAdvanceTradeToCompleted(record: TradeRecordWorkflowLike): boolean {
  return record.workflowStatus === "TAX_FILING";
}

export function canRejectTradeRecord(record: TradeRecordWorkflowLike): boolean {
  return (
    record.workflowStatus === "DOCUMENT_AND_BALANCE" ||
    record.workflowStatus === "TAX_FILING"
  );
}

export function formatTradeRecordPrice(
  price: string | number | null | undefined,
): string {
  if (price == null || price === "") return "-";

  const num = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(num) || num === 0) return "-";

  if (num >= 100000000) {
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    return man > 0 ? `${eok}억 ${man.toLocaleString("ko-KR")}만원` : `${eok}억원`;
  }

  if (num >= 10000) {
    return `${(num / 10000).toLocaleString("ko-KR")}만원`;
  }

  return `${num.toLocaleString("ko-KR")}원`;
}

export function getTradeRecordGroupLabel(date: string | null | undefined): string {
  if (!date) return "날짜 미정";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const normalize = (value: Date) => value.toISOString().slice(0, 10);
  if (date === normalize(today)) return "오늘";
  if (date === normalize(yesterday)) return "어제";

  const [year, month] = date.split("-");
  if (!year || !month) return "날짜 미정";

  return `${year}년 ${Number(month)}월`;
}

export interface GroupedTradeRecords {
  label: string;
  records: TradeRecordDateLike[];
}

export function groupTradeRecordsByContractMonth<T extends TradeRecordDateLike>(
  records: T[],
): Array<{ label: string; records: T[] }> {
  const groups: Array<{ label: string; records: T[] }> = [];

  records.forEach((record) => {
    const label = getTradeRecordGroupLabel(record.contractDate);
    const current = groups[groups.length - 1];

    if (!current || current.label !== label) {
      groups.push({ label, records: [record] });
      return;
    }

    current.records.push(record);
  });

  return groups;
}

export interface TradeRecordCounts {
  total: number;
  buy: number;
  sell: number;
  active: number;
  tax: number;
  completed: number;
}

export function getTradeRecordCounts(records: TradeRecordCountLike[]): TradeRecordCounts {
  return records.reduce<TradeRecordCounts>(
    (acc, record) => {
      acc.total += 1;
      if (record.tradeType === "매수") acc.buy += 1;
      if (record.tradeType === "매도") acc.sell += 1;
      if (record.workflowStatus !== "COMPLETED" && record.workflowStatus !== "REJECTED") {
        acc.active += 1;
      }
      if (record.workflowStatus === "TAX_FILING") acc.tax += 1;
      if (record.workflowStatus === "COMPLETED") acc.completed += 1;
      return acc;
    },
    {
      total: 0,
      buy: 0,
      sell: 0,
      active: 0,
      tax: 0,
      completed: 0,
    },
  );
}
