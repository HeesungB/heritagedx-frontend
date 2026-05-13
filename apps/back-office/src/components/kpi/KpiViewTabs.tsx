"use client";

import type { KpiMetric } from "@heritage-dx/store";

interface KpiViewTab {
  key: KpiMetric;
  label: string;
}

const TABS: KpiViewTab[] = [
  { key: "all", label: "종합" },
  { key: "tradeCount", label: "거래" },
  { key: "consultationCount", label: "상담" },
  { key: "profit", label: "순이익" },
];

interface KpiViewTabsProps {
  value: KpiMetric;
  onChange: (metric: KpiMetric) => void;
}

export default function KpiViewTabs({ value, onChange }: KpiViewTabsProps) {
  return (
    <div className="inline-flex gap-0.5 flex-shrink-0">
      {TABS.map(({ key, label }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center h-[26px] px-2.5 text-[11.5px] rounded-md border tracking-[-0.005em] cursor-pointer transition-colors ${
              isActive
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-transparent text-neutral-600 border-transparent font-medium hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
