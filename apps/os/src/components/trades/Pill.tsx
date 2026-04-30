"use client";

import type { ReactNode } from "react";

interface PillProps {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}

export default function Pill({ active, count, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] transition-colors ${
        active
          ? "border border-gray-900 bg-gray-900 text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      } ${active ? "font-semibold" : "font-medium"}`}
    >
      <span>{children}</span>
      {count != null && (
        <span
          className={`inline-flex items-center rounded-full px-1.5 text-[11px] font-semibold leading-none ${
            active ? "bg-white/20 text-white py-1" : "bg-gray-100 text-gray-500 py-0.5"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
