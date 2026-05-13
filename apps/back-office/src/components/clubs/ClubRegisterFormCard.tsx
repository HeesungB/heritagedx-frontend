"use client";

import type { ReactNode } from "react";

interface ClubRegisterFormCardProps {
  number: string;
  title: string;
  children: ReactNode;
}

export default function ClubRegisterFormCard({
  number,
  title,
  children,
}: ClubRegisterFormCardProps) {
  return (
    <section className="bg-surface border border-neutral-200 rounded-card overflow-hidden mb-4">
      <header className="px-[22px] py-4 border-b border-neutral-100 bg-[#FBFBFA] flex items-center gap-2.5">
        <span className="font-mono text-[10.5px] font-medium text-neutral-400 tracking-[0.04em]">
          {number}
        </span>
        <h3 className="text-[14px] font-bold tracking-[-0.02em] text-neutral-900 m-0">
          {title}
        </h3>
      </header>
      <div className="px-[22px] pt-[22px] pb-6">{children}</div>
    </section>
  );
}
