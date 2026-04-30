"use client";

import { Star } from "lucide-react";

interface FavoriteStarProps {
  active: boolean;
  onToggle: () => void;
}

export default function FavoriteStar({ active, onToggle }: FavoriteStarProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={active ? "즐겨찾기 해제" : "즐겨찾기"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
    >
      <Star
        className={`h-4 w-4 ${active ? "fill-amber-400 stroke-amber-500" : "stroke-gray-300"}`}
        strokeWidth={1.8}
      />
    </button>
  );
}
