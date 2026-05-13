"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";

interface ClubDetailHeaderProps {
  name: string;
  region?: string | null;
  operationType?: string | null;
  holes?: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function ClubDetailHeader({
  name,
  region,
  operationType,
  holes,
  isFavorite,
  onToggleFavorite,
}: ClubDetailHeaderProps) {
  const metaParts = [region, operationType, holes].filter(
    (part): part is string => Boolean(part && part.trim()),
  );

  return (
    <div className="flex items-start justify-between gap-5 mb-[18px]">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-neutral-400 mb-0.5">
          <Link
            href="/clubs"
            className="text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            골프장
          </Link>
          <span className="text-[#C4C4C2]">/</span>
          <span className="truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[24px] font-bold tracking-[-0.03em] leading-[1.2] text-neutral-900 m-0 truncate">
            {name}
          </h1>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label="즐겨찾기 토글"
            className={`w-[34px] h-[34px] grid place-items-center rounded-lg border border-transparent transition-colors flex-shrink-0 cursor-pointer ${
              isFavorite
                ? "text-[#E0A82E] hover:bg-[#FEF7DD]"
                : "text-[#B6B6B4] hover:bg-neutral-50 hover:text-[#888887]"
            }`}
          >
            <Star
              className="w-5 h-5"
              strokeWidth={1.6}
              fill={isFavorite ? "#FCE588" : "none"}
              stroke={isFavorite ? "#E0A82E" : "currentColor"}
            />
          </button>
        </div>
        {metaParts.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-neutral-500 mt-0.5">
            <MapPin
              className="w-[11px] h-[11px] text-neutral-400"
              strokeWidth={1.7}
            />
            {metaParts.map((part, idx) => (
              <span key={`${part}-${idx}`} className="inline-flex items-center gap-2">
                <span>{part}</span>
                {idx < metaParts.length - 1 && (
                  <span className="text-[#DCDCD8]">·</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
