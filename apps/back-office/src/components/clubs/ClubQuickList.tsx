"use client";

import type { ReactNode } from "react";

export interface ClubQuickListItem {
  code: string;
  name: string;
}

interface ClubQuickListProps {
  label: string;
  icon?: ReactNode;
  items: ClubQuickListItem[];
  activeCode?: string | null;
  onItemClick: (code: string) => void;
  emptyHint?: string;
}

export default function ClubQuickList({
  label,
  icon,
  items,
  activeCode,
  onItemClick,
  emptyHint,
}: ClubQuickListProps) {
  return (
    <div className="flex items-center gap-2.5 min-h-[28px]">
      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#888887] tracking-[0.1em] uppercase min-w-[72px] flex-shrink-0">
        {icon}
        <span>{label}</span>
        <span className="font-mono text-[9.5px] text-neutral-400 font-medium tracking-normal normal-case ml-0.5">
          {items.length}
        </span>
      </span>
      <div className="flex gap-1 overflow-x-auto flex-1 min-w-0 px-px py-px pb-1">
        {items.length === 0 ? (
          <span className="text-[11.5px] text-neutral-400 px-1 py-1">
            {emptyHint ?? "표시할 골프장이 없습니다"}
          </span>
        ) : (
          items.map((item) => {
            const isActive = activeCode === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onItemClick(item.code)}
                className={`h-[26px] px-2.5 text-[11.5px] font-medium rounded-full border whitespace-nowrap flex-shrink-0 tracking-[-0.01em] cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary text-white border-primary font-semibold"
                    : "bg-surface text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 hover:border-[#DCDCD8]"
                }`}
              >
                {item.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
