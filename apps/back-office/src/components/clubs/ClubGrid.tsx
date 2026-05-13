"use client";

import type { ReactNode } from "react";
import ClubCardV2, { type ClubCardEntity } from "./ClubCardV2";

interface ClubGridProps {
  clubs: ClubCardEntity[];
  isFavorite: (code: string) => boolean;
  onCardClick: (club: ClubCardEntity) => void;
  onToggleFavorite: (club: ClubCardEntity) => void;
  count: number;
  metaLabel?: string;
  emptyState?: ReactNode;
  rightSlot?: ReactNode;
}

export default function ClubGrid({
  clubs,
  isFavorite,
  onCardClick,
  onToggleFavorite,
  count,
  metaLabel,
  emptyState,
  rightSlot,
}: ClubGridProps) {
  return (
    <section className="pt-3.5 pb-2">
      <div className="flex items-center justify-between px-[18px] mb-2.5">
        <h3 className="inline-flex items-baseline gap-1.5 text-[12.5px] font-bold text-neutral-900 tracking-[-0.01em] m-0">
          <span>전체 골프장</span>
          <span className="text-[11px] font-mono text-[#888887] tracking-[0.02em] font-normal">
            {count}
          </span>
        </h3>
        <div className="flex items-center gap-3">
          {metaLabel && (
            <span className="text-[11px] text-neutral-400">{metaLabel}</span>
          )}
          {rightSlot}
        </div>
      </div>
      {clubs.length === 0 && emptyState ? (
        emptyState
      ) : (
        <div className="grid gap-2.5 px-[18px] pb-1.5 grid-cols-2 min-[820px]:grid-cols-3 min-[1100px]:grid-cols-4">
          {clubs.map((club) => (
            <ClubCardV2
              key={club.code}
              club={club}
              favorite={isFavorite(club.code)}
              onClick={() => onCardClick(club)}
              onToggleFavorite={() => onToggleFavorite(club)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
