"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import ClubCardV2, { type ClubCardEntity } from "./ClubCardV2";

interface FavoriteRecentStripProps {
  clubs: ClubCardEntity[];
  isFavorite: (code: string) => boolean;
  onCardClick: (club: ClubCardEntity) => void;
  onToggleFavorite: (club: ClubCardEntity) => void;
}

export default function FavoriteRecentStrip({
  clubs,
  isFavorite,
  onCardClick,
  onToggleFavorite,
}: FavoriteRecentStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (clubs.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    node.scrollBy({ left: 200 * dir, behavior: "smooth" });
  };

  return (
    <section className="pb-3.5 border-b border-neutral-100">
      <div className="flex items-center justify-between px-[18px] mt-3.5 mb-2.5">
        <h3 className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-neutral-900 tracking-[-0.01em] m-0">
          <Star className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={1.4} />
          <span>즐겨찾기 · 최근</span>
          <span className="text-[11px] font-mono text-[#888887] tracking-[0.02em] font-normal">
            {clubs.length}
          </span>
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="이전"
            className="w-[26px] h-[26px] grid place-items-center bg-surface text-neutral-600 border border-neutral-200 rounded-md cursor-pointer transition-colors hover:text-neutral-900 hover:border-neutral-900"
          >
            <ChevronLeft className="w-[11px] h-[11px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="다음"
            className="w-[26px] h-[26px] grid place-items-center bg-surface text-neutral-600 border border-neutral-200 rounded-md cursor-pointer transition-colors hover:text-neutral-900 hover:border-neutral-900"
          >
            <ChevronRight className="w-[11px] h-[11px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto px-[18px] pt-0.5 pb-1.5"
        style={{ scrollSnapType: "x proximity" }}
      >
        {clubs.map((club) => (
          <ClubCardV2
            key={club.code}
            club={club}
            favorite={isFavorite(club.code)}
            onClick={() => onCardClick(club)}
            onToggleFavorite={() => onToggleFavorite(club)}
            className="flex-shrink-0 w-[184px]"
          />
        ))}
      </div>
    </section>
  );
}
