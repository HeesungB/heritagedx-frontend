"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { FileText, MessageSquare, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  useKpiSummary,
  useKpiSeries,
  mapConsultationDtoToEntity,
  mapMembershipTradeDtoToEntity,
  type KpiFilters,
} from "@heritage-dx/store";
import { formatProfitShort } from "@heritage-dx/utils";
import HelloHeader from "@/components/home/HelloHeader";
import KpiCard from "@/components/home/KpiCard";
import RecentTradesList from "@/components/home/RecentTradesList";
import RecentConsultationsList from "@/components/home/RecentConsultationsList";
import ProfitBreakdown from "@/components/home/ProfitBreakdown";

// 차트 패널은 동적 로딩 — 초기 페인트 가속
const MonthlyTrendPanel = dynamic(
  () => import("@/components/home/MonthlyTrendPanel"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-card bg-neutral-50 animate-pulse" />
    ),
  },
);

const THIS_MONTH_FILTERS: KpiFilters = {
  preset: "thisMonth",
  dateField: "contractDate",
  employeeId: "",
};

const LAST_MONTH_FILTERS: KpiFilters = {
  preset: "lastMonth",
  dateField: "contractDate",
  employeeId: "",
};

const YEAR_FILTERS: KpiFilters = {
  preset: "1year",
  dateField: "contractDate",
  employeeId: "",
};

function nowMonthLabel(): string {
  const d = new Date();
  return `이번 달 · ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildTradeDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return undefined;
  const diff = current - previous;
  if (diff === 0) {
    return {
      text: `지난 달 ${previous}건 · `,
      direction: "flat" as const,
      accent: "변동 없음",
    };
  }
  return {
    text: `지난 달 ${previous}건 · `,
    direction: diff > 0 ? ("up" as const) : ("down" as const),
    accent: `${diff > 0 ? "+" : ""}${diff}건`,
  };
}

function buildProfitDelta(currentWon: number, previousWon: number) {
  if (previousWon === 0 && currentWon === 0) return undefined;
  if (previousWon === 0) {
    return {
      text: `지난 달 0원 · `,
      direction: "up" as const,
      accent: "신규",
    };
  }
  const pct = ((currentWon - previousWon) / previousWon) * 100;
  const rounded = Math.round(pct);
  return {
    text: `지난 달 ${formatProfitShort(previousWon)} · `,
    direction: rounded >= 0 ? ("up" as const) : ("down" as const),
    accent: `${rounded > 0 ? "+" : ""}${rounded}%`,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { preloadedRecords, preloadedMemos } = useData();
  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useKpiSummary(THIS_MONTH_FILTERS);
  const { data: lastMonth } = useKpiSummary(LAST_MONTH_FILTERS);
  const { data: yearSeries } = useKpiSeries(YEAR_FILTERS);

  const recentTrades = useMemo(
    () =>
      (preloadedRecords?.trades ?? [])
        .slice(0, 2)
        .map(mapMembershipTradeDtoToEntity),
    [preloadedRecords],
  );
  const recentConsultations = useMemo(
    () =>
      (preloadedMemos?.trades ?? [])
        .slice(0, 4)
        .map(mapConsultationDtoToEntity),
    [preloadedMemos],
  );

  const ytdProfit = yearSeries.reduce((sum, b) => sum + b.profit, 0);
  const hasError = Boolean(summaryError) && !summaryLoading;

  return (
    <div className="px-10 pt-9 pb-12 overflow-y-auto">
      <HelloHeader
        userName={user?.name ?? "관리자"}
        periodLabel={nowMonthLabel()}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-7">
        <KpiCard
          label="거래 건수"
          subLabel={`이번 달 (${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")})`}
          icon={<FileText className="w-[15px] h-[15px]" strokeWidth={1.6} />}
          value={summaryLoading ? undefined : String(summary.tradeCount)}
          unit="건"
          delta={buildTradeDelta(summary.tradeCount, lastMonth.tradeCount)}
          listTitle="최근 거래"
          footerLabel="전체 거래 내역"
          footerHref="/trade-records"
          hasError={hasError}
        >
          <RecentTradesList items={recentTrades} />
        </KpiCard>

        <KpiCard
          label="상담 건수"
          subLabel={`이번 달 (${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")})`}
          icon={<MessageSquare className="w-[15px] h-[15px]" strokeWidth={1.6} />}
          value={summaryLoading ? undefined : String(summary.consultationCount)}
          unit="건"
          listTitle="최근 상담"
          footerLabel="전체 상담일지"
          footerHref="/trade-memos"
          hasError={hasError}
        >
          <RecentConsultationsList items={recentConsultations} />
        </KpiCard>

        <KpiCard
          label="총 순이익"
          subLabel={`이번 달 (${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")})`}
          icon={<TrendingUp className="w-[15px] h-[15px]" strokeWidth={1.6} />}
          value={summaryLoading ? undefined : formatProfitShort(summary.profit)}
          delta={buildProfitDelta(summary.profit, lastMonth.profit)}
          listTitle="이번 달 진행 현황"
          footerLabel="월별 추이 보기"
          footerHref="/kpi"
          hasError={hasError}
        >
          <ProfitBreakdown
            profitThisMonthWon={summary.profit}
            commissionWon={null}
            ytdProfitWon={ytdProfit}
          />
        </KpiCard>
      </div>

      <MonthlyTrendPanel />
    </div>
  );
}
