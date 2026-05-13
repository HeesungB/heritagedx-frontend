"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

interface ClubSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showRegisterButton?: boolean;
}

export default function ClubSearchBar({
  value,
  onChange,
  placeholder = "골프장명, 지역, 연락처 등으로 검색해보세요",
  showRegisterButton = true,
}: ClubSearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && value) {
      onChange("");
    }
  };

  return (
    <div className="px-[18px] py-[14px] flex items-center gap-2.5 flex-wrap border-b border-neutral-100">
      <div className="relative flex-1 min-w-[240px]">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-neutral-400 pointer-events-none"
          strokeWidth={1.7}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="w-full h-[38px] pl-9 pr-[50px] text-[12.5px] text-neutral-900 bg-[#FAFAF9] border border-neutral-200 rounded-lg outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-surface focus:ring-[3px] focus:ring-neutral-900/[0.06]"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 h-[22px] px-2 text-[10px] font-semibold font-mono text-[#888887] bg-surface border border-neutral-200 rounded-[5px] inline-flex items-center pointer-events-none">
          ESC
        </span>
      </div>
      {showRegisterButton && (
        <Link
          href="/clubs/new"
          className="inline-flex items-center gap-1.5 h-[38px] px-3.5 bg-primary text-white border border-primary rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-[#1F1F1F]"
        >
          <Plus className="w-3 h-3" strokeWidth={2.2} />
          <span>새 골프장 등록</span>
        </Link>
      )}
    </div>
  );
}
