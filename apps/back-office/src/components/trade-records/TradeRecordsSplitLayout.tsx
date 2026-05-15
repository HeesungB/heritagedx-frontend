"use client";

import type { ReactNode } from "react";

interface TradeRecordsSplitLayoutProps {
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export default function TradeRecordsSplitLayout({
  children,
  left,
  right,
  className = "",
  leftClassName = "",
  rightClassName = "",
}: TradeRecordsSplitLayoutProps) {
  if (children) {
    return (
      <div
        className={`lg:grid lg:grid-cols-[minmax(480px,580px)_1fr] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`lg:grid lg:grid-cols-[minmax(480px,580px)_1fr] ${className}`}
    >
      <section className={`min-h-0 border-r border-[#F0F0EE] bg-white ${leftClassName}`}>{left}</section>
      <section className={`min-h-0 bg-[#FAFAF9] ${rightClassName}`}>{right}</section>
    </div>
  );
}
