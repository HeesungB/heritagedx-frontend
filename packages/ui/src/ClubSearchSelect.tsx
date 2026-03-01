"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import type { Club } from "@heritage-dx/types";

interface ClubSearchSelectProps {
  clubs: Club[];
  selectedClubCode: string;
  onChange: (code: string) => void;
  compact?: boolean;
  placeholder?: string;
}

export default function ClubSearchSelect({
  clubs,
  selectedClubCode,
  onChange,
  compact = false,
  placeholder = "전체 골프장",
}: ClubSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedClub = useMemo(
    () => clubs.find((c) => c.code === selectedClubCode),
    [clubs, selectedClubCode],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.trim().toLowerCase();
    return clubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q)),
    );
  }, [clubs, search]);

  // 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // 열릴 때 input focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const baseText = compact ? "text-xs" : "text-sm";
  const basePadding = compact ? "px-2.5 py-1.5" : "px-3 py-2";
  const baseWidth = compact ? "min-w-[140px]" : "min-w-[160px]";
  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <div ref={containerRef} className={`relative ${baseWidth}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full border border-gray-300 rounded-lg ${basePadding} ${baseText} text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:border-gray-500`}
      >
        <span className={`truncate flex-1 ${selectedClub ? "text-gray-900" : "text-gray-500"}`}>
          {selectedClub ? selectedClub.name : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedClub ? (
            <X
              className={`${iconSize} text-gray-400 hover:text-gray-600`}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
            />
          ) : (
            <ChevronDown className={`${iconSize} text-gray-400`} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="골프장 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                !selectedClubCode ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600"
              }`}
            >
              {placeholder}
            </button>
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                  c.code === selectedClubCode
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-700"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm">{c.name}</span>
                  {c.operationTypes?.map((type) => (
                    <span
                      key={type}
                      className={`inline-flex px-1 py-0.5 text-[10px] font-medium rounded ${
                        type === "MEMBERSHIP"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {type === "MEMBERSHIP" ? "회원제" : type === "PUBLIC" ? "퍼블릭" : type}
                    </span>
                  ))}
                </div>
                {c.region && (
                  <div className="text-xs text-gray-400">
                    {c.region}{c.holes ? ` · ${c.holes}` : ""}
                  </div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                검색 결과 없음
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
