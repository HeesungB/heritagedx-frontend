"use client";

import type { MouseEvent } from "react";
import { MapPin, Star } from "lucide-react";

export interface ClubCardEntity {
  code: string;
  name: string;
  region?: string | null;
  holes?: string | null;
  operationTypes?: string[] | null;
}

interface ClubCardV2Props {
  club: ClubCardEntity;
  favorite: boolean;
  onClick: () => void;
  onToggleFavorite: () => void;
  className?: string;
}

function operationPill(type: string) {
  if (type === "MEMBERSHIP") {
    return (
      <span
        key={type}
        className="inline-flex items-center h-[18px] px-1.5 text-[9.5px] font-semibold leading-none rounded-[3px] bg-[#F0EEF8] text-[#4D3FAA] border border-[#E2DEF1]"
      >
        회원제
      </span>
    );
  }
  if (type === "PUBLIC") {
    return (
      <span
        key={type}
        className="inline-flex items-center h-[18px] px-1.5 text-[9.5px] font-semibold leading-none rounded-[3px] bg-[#ECF6EE] text-[#2E7A39] border border-[#D9EBD9]"
      >
        퍼블릭
      </span>
    );
  }
  return null;
}

export default function ClubCardV2({
  club,
  favorite,
  onClick,
  onToggleFavorite,
  className = "",
}: ClubCardV2Props) {
  const handleStar = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="group w-full flex flex-col gap-2 p-[12px_14px_14px] bg-surface border border-neutral-200 rounded-[10px] text-left cursor-pointer transition-all hover:border-[#C4C4C2] hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-start gap-1.5 justify-between">
          <div className="flex gap-1 flex-wrap">
            {club.operationTypes?.map((t) => operationPill(t))}
            {club.holes && (
              <span className="inline-flex items-center h-[18px] px-1.5 text-[9.5px] font-medium leading-none rounded-[3px] bg-surface text-neutral-600 border border-neutral-200 font-mono">
                {club.holes}
              </span>
            )}
          </div>
          <span className="w-[22px] h-[22px] flex-shrink-0" aria-hidden />
        </div>
        <div className="text-[14px] font-bold tracking-[-0.025em] text-neutral-900 leading-[1.2]">
          {club.name}
        </div>
        {club.region && (
          <div className="flex items-center gap-1 text-[11.5px] text-neutral-500">
            <MapPin className="w-2.5 h-2.5 text-neutral-400 flex-shrink-0" strokeWidth={1.7} />
            <span>{club.region}</span>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={handleStar}
        aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기"}
        className={`absolute top-[12px] right-[14px] w-[22px] h-[22px] grid place-items-center bg-transparent border-none cursor-pointer rounded transition-colors ${
          favorite ? "text-neutral-900" : "text-[#C4C4C2] hover:text-neutral-900"
        }`}
      >
        <Star
          className="w-[13px] h-[13px]"
          strokeWidth={1.4}
          fill={favorite ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}
