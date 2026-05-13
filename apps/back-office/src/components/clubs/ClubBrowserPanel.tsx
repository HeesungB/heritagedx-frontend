"use client";

import type { ReactNode } from "react";

interface ClubBrowserPanelProps {
  children: ReactNode;
}

export default function ClubBrowserPanel({ children }: ClubBrowserPanelProps) {
  return (
    <section
      aria-label="골프장 검색 및 선택"
      className="bg-surface border border-neutral-200 rounded-card overflow-hidden"
    >
      {children}
    </section>
  );
}
