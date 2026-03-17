"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ArrowRight, TrendingUp, MessageSquare, FileText } from "lucide-react";
import { useAdminRepositories } from "@heritage-dx/api";
import { wonToManwon, formatManwon } from "@heritage-dx/utils";
import { getMonthBuckets } from "./KpiFilterBar";

interface SummaryState {
  tradeCount: number;
  profit: number;
  consultationCount: number;
  isLoading: boolean;
}

interface TrendState {
  data: { month: string; trades: number; consultations: number }[];
  isLoading: boolean;
}

export default function KpiMiniDashboard() {
  const { kpi } = useAdminRepositories();
  const summaryReqId = useRef(0);
  const trendReqId = useRef(0);

  const [summary, setSummary] = useState<SummaryState>({
    tradeCount: 0,
    profit: 0,
    consultationCount: 0,
    isLoading: true,
  });

  const [trend, setTrend] = useState<TrendState>({
    data: [],
    isLoading: true,
  });

  // Phase 1: 요약 카드 (2개 요청 — 빠르게 표시)
  const fetchSummary = useCallback(async () => {
    const id = ++summaryReqId.current;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const thisMonthStart = new Date(y, m, 1).toISOString().slice(0, 10);
    const thisMonthEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);

    try {
      const [tradesRes, consultsRes] = await Promise.all([
        kpi.getTrades({ startDate: thisMonthStart, endDate: thisMonthEnd }),
        kpi.getConsultations({ startDate: thisMonthStart, endDate: thisMonthEnd }),
      ]);

      if (id !== summaryReqId.current) return;

      console.log("[KPI Mini] 이번 달 trades 응답:", tradesRes);
      console.log("[KPI Mini] 이번 달 consultations 응답:", consultsRes);

      setSummary({
        tradeCount: tradesRes?.data?.totalCount ?? 0,
        profit: tradesRes?.data?.totalNetProfit ?? 0,
        consultationCount: consultsRes?.data?.totalCount ?? 0,
        isLoading: false,
      });
    } catch (err) {
      console.error("[KPI Mini] 요약 API 에러:", err);
      if (id === summaryReqId.current) {
        setSummary((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, [kpi]);

  // Phase 2: 6개월 추이 차트 (12개 요청 — 백그라운드)
  const fetchTrend = useCallback(async () => {
    const id = ++trendReqId.current;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const thisMonthEnd = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    const sixMonthStart = new Date(y, m - 5, 1).toISOString().slice(0, 10);
    const buckets = getMonthBuckets(sixMonthStart, thisMonthEnd);

    try {
      const [tradeResults, consultResults] = await Promise.all([
        Promise.all(
          buckets.map((b) =>
            kpi.getTrades({ startDate: b.startDate, endDate: b.endDate }),
          ),
        ),
        Promise.all(
          buckets.map((b) =>
            kpi.getConsultations({ startDate: b.startDate, endDate: b.endDate }),
          ),
        ),
      ]);

      if (id !== trendReqId.current) return;

      console.log("[KPI Mini] 추이 trades 응답:", tradeResults.map((r, i) => ({
        month: buckets[i].label,
        data: r?.data,
      })));

      const data = buckets.map((b, i) => ({
        month: b.label.slice(5),
        trades: tradeResults[i]?.data?.totalCount ?? 0,
        consultations: consultResults[i]?.data?.totalCount ?? 0,
      }));

      setTrend({ data, isLoading: false });
    } catch (err) {
      console.error("[KPI Mini] 추이 API 에러:", err);
      if (id === trendReqId.current) {
        setTrend((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, [kpi]);

  useEffect(() => {
    fetchSummary();
    fetchTrend();
  }, [fetchSummary, fetchTrend]);

  const profitManwon = wonToManwon(summary.profit);

  return (
    <div className="mb-8 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<FileText className="w-4 h-4" />}
          label="거래 건수"
          value={summary.isLoading ? undefined : `${summary.tradeCount}건`}
          color="indigo"
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="총 순이익"
          value={summary.isLoading ? undefined : formatManwon(profitManwon)}
          color="green"
        />
        <SummaryCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="상담 건수"
          value={summary.isLoading ? undefined : `${summary.consultationCount}건`}
          color="blue"
        />
      </div>

      {/* Mini trend chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">최근 6개월 추이</h3>
          <Link
            href="/kpi"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            통계 더보기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {trend.isLoading ? (
          <div className="h-[140px] flex flex-col items-center justify-center gap-2">
            <div className="flex items-end gap-1.5">
              {[40, 60, 80, 50, 70, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-5 bg-gray-200 rounded-sm animate-pulse"
                  style={{ height: h, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">차트 로딩 중...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={trend.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
                formatter={(value, name) => [
                  `${value}건`,
                  name === "trades" ? "거래" : "상담",
                ]}
                labelFormatter={(label) => `${label}월`}
              />
              <Bar dataKey="trades" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={14} />
              <Bar dataKey="consultations" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  color: "indigo" | "green" | "blue";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };

  const isLoading = value === undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label} (이번 달)</p>
        {isLoading ? (
          <div className="mt-1.5 h-5 w-20 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-lg font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}
