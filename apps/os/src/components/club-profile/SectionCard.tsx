"use client";

import type { LucideIcon } from "lucide-react";

export default function SectionCard({
  number,
  title,
  subtitle,
  Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-600",
  toolbar,
  children,
}: {
  number?: string;
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white">
      <header className="flex items-start justify-between gap-4 border-b border-[#f3f4f6] px-5 py-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-[-0.005em] text-[#101828]">
              {number && (
                <span className="mr-1.5 text-[#99a1af]">{number}</span>
              )}
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-[12px] tracking-[-0.005em] text-[#6a7282]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {toolbar && <div className="shrink-0">{toolbar}</div>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
