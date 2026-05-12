"use client";

import { useMemo } from "react";

interface HelloHeaderProps {
  userName: string;
  periodLabel: string;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KO[d.getDay()]}요일`;
}

export default function HelloHeader({ userName, periodLabel }: HelloHeaderProps) {
  const dateLabel = useMemo(() => formatKoreanDate(new Date()), []);

  return (
    <div className="flex justify-between items-start mb-[30px] gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.025em] leading-[1.2] text-neutral-900 m-0">
          안녕하세요, {userName}님
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 mb-0">
          {dateLabel} · Heritage DX 백오피스
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3.5 py-2 text-[13px] font-medium text-neutral-900 bg-surface border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          {periodLabel}
        </button>
      </div>
    </div>
  );
}
