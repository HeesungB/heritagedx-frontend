"use client";

import Link from "next/link";
import { ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

export interface KpiCardProps {
  label: string;
  subLabel: string;
  icon: ReactNode;
  value: string | undefined;
  unit?: string;
  delta?: {
    text: string;
    direction?: "up" | "down" | "flat";
    accent?: string;
  };
  listTitle?: string;
  children?: ReactNode;
  footerLabel: string;
  footerHref: string;
  hasError?: boolean;
}

export default function KpiCard({
  label,
  subLabel,
  icon,
  value,
  unit,
  delta,
  listTitle,
  children,
  footerLabel,
  footerHref,
  hasError,
}: KpiCardProps) {
  const isLoading = value === undefined;

  return (
    <div className="flex flex-col p-5 pb-[18px] rounded-card border border-neutral-100 bg-surface min-h-[280px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-medium tracking-[0.01em] text-neutral-500">
            {label}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
            {subLabel}
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg bg-neutral-50 grid place-items-center text-neutral-900 flex-shrink-0">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mt-4">
        {isLoading ? (
          <div className="h-9 w-24 bg-neutral-100 rounded animate-pulse" />
        ) : hasError ? (
          <span className="text-sm text-neutral-400">데이터 로드 실패</span>
        ) : (
          <>
            <span className="text-[36px] font-bold tracking-[-0.03em] leading-none font-sans">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-neutral-500 font-medium">{unit}</span>
            )}
          </>
        )}
      </div>

      {delta && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
          <span>{delta.text}</span>
          {delta.accent && (
            <span
              className={
                delta.direction === "up"
                  ? "text-success inline-flex items-center gap-0.5"
                  : delta.direction === "down"
                  ? "text-error inline-flex items-center gap-0.5"
                  : "text-neutral-600"
              }
            >
              {delta.direction === "up" && <ArrowUp className="w-3 h-3" />}
              {delta.direction === "down" && <ArrowDown className="w-3 h-3" />}
              {delta.accent}
            </span>
          )}
        </div>
      )}

      {(listTitle || children) && (
        <>
          <div className="h-px bg-neutral-100 mt-[18px] mb-3.5" />
          {listTitle && (
            <div className="text-[11px] font-semibold tracking-[0.12em] text-neutral-400 uppercase mb-2">
              {listTitle}
            </div>
          )}
          <div>{children}</div>
        </>
      )}

      <div className="mt-auto pt-3">
        <Link
          href={footerHref}
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-neutral-900 hover:text-neutral-700"
        >
          {footerLabel}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
