"use client";

import { PRESET_GROUPS, type PeriodPreset } from "@heritage-dx/store";

interface KpiRangeChipsProps {
  value: PeriodPreset;
  onChange: (preset: PeriodPreset) => void;
}

export default function KpiRangeChips({ value, onChange }: KpiRangeChipsProps) {
  const isCustom = value === "custom";

  return (
    <div className="flex items-center gap-1 overflow-x-auto flex-nowrap pb-0.5">
      {PRESET_GROUPS.map(({ key, label }) => {
        const isActive = !isCustom && value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center h-7 px-3 text-[12px] rounded-full border whitespace-nowrap flex-shrink-0 tracking-[-0.005em] cursor-pointer transition-colors ${
              isActive
                ? "bg-primary text-white border-primary font-semibold"
                : "bg-surface text-neutral-600 border-neutral-200 hover:border-[#C7C7C5] hover:text-neutral-900 font-medium"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
