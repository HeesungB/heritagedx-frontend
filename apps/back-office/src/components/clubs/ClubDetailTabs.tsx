"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, CreditCard } from "lucide-react";

export type ClubDetailTabId = "basic" | "membership";

interface TabDef {
  id: ClubDetailTabId;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: "basic", label: "기본 정보", icon: Building2 },
  { id: "membership", label: "회원권", icon: CreditCard },
];

interface ClubDetailTabsProps {
  active: ClubDetailTabId;
  onChange: (id: ClubDetailTabId) => void;
}

export default function ClubDetailTabs({ active, onChange }: ClubDetailTabsProps) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-0.5 border-b border-neutral-200 mb-4"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 h-10 px-3.5 text-[13px] border-b-2 -mb-px transition-colors cursor-pointer ${
              isActive
                ? "text-neutral-900 font-bold border-neutral-900"
                : "text-[#888887] font-medium border-transparent hover:text-neutral-900"
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
