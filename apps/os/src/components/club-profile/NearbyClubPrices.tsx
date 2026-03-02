"use client";

import { useMemo } from "react";
import { Club } from "@/types";
import { haversineDistance } from "@/utils/distance";
import { normalizeName } from "@/utils/club-name";
import coordinates from "@/constants/golfCourseCoordinates.json";

interface NearbyClubPricesProps {
  currentClubAddress: string;
  currentClubName: string;
  clubs: Club[];
  onClubClick?: (clubCode: string) => void;
}

interface NearbyClub {
  club: Club;
  distance: number;
  price: string | null;
}

type CoordEntry = { name: string; lat: number; lng: number };
const coordMap = coordinates as Record<string, CoordEntry>;

// name으로 좌표 역조회 (캐시)
let nameToCoordCache: Map<string, { lat: number; lng: number }> | null = null;
function getNameToCoordMap(): Map<string, { lat: number; lng: number }> {
  if (nameToCoordCache) return nameToCoordCache;
  nameToCoordCache = new Map();
  for (const entry of Object.values(coordMap)) {
    nameToCoordCache.set(normalizeName(entry.name), {
      lat: entry.lat,
      lng: entry.lng,
    });
  }
  return nameToCoordCache;
}

function formatPrice(price: string): string {
  // 이미 콤마가 있으면 그대로 반환
  if (price.includes(",")) return price;
  // 숫자만 추출 후 콤마 포맷
  const num = parseInt(price.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return price;
  return num.toLocaleString();
}

export default function NearbyClubPrices({
  currentClubAddress,
  currentClubName,
  clubs,
  onClubClick,
}: NearbyClubPricesProps) {
  const nearbyClubs = useMemo(() => {
    // 1. 현재 골프장 좌표 (address 기반)
    const currentCoord = coordMap[currentClubAddress];
    if (!currentCoord) return [];

    const { lat: curLat, lng: curLng } = currentCoord;
    const nameMap = getNameToCoordMap();
    const normalizedCurrent = normalizeName(currentClubName);

    // DEBUG: 리스트 API 응답에 recentMarketPrice가 포함되는지 확인
    if (process.env.NODE_ENV === "development" && clubs.length > 0) {
      const sample = clubs.slice(0, 3);
      console.log("[NearbyClubPrices] clubs sample (recentMarketPrice 확인):", sample.map(c => ({ name: c.name, recentMarketPrice: c.recentMarketPrice })));
    }

    // 2. 각 골프장과 거리 계산
    const withDistance: NearbyClub[] = [];
    for (const club of clubs) {
      const normalized = normalizeName(club.name);
      if (normalized === normalizedCurrent) continue;

      const coord = nameMap.get(normalized);
      if (!coord) continue;

      const dist = haversineDistance(curLat, curLng, coord.lat, coord.lng);
      if (dist > 50) continue;

      // 시세 조회: clubs 배열의 recentMarketPrice 사용
      const price = club.recentMarketPrice || null;

      withDistance.push({ club, distance: dist, price });
    }

    // 3. 가까운 순 5개
    withDistance.sort((a, b) => a.distance - b.distance);
    return withDistance.slice(0, 5);
  }, [currentClubAddress, currentClubName, clubs]);

  if (nearbyClubs.length === 0) return null;

  return (
    <div className="print:hidden border-t border-gray-300">
      <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
        <span className="text-sm font-medium text-gray-700">주변 골프장 시세</span>
      </div>
      <div>
        {nearbyClubs.map(({ club, distance, price }, idx) => (
          <div
            key={club.code}
            onClick={() => onClubClick?.(club.code)}
            className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${
              idx < nearbyClubs.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-gray-900 truncate">
                {club.name}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {distance < 1
                  ? `${Math.round(distance * 10) / 10}km`
                  : `${Math.round(distance)}km`}
              </span>
            </div>
            <span
              className={`shrink-0 ml-2 ${
                price ? "font-medium text-gray-900" : "text-gray-400"
              }`}
            >
              {price ? formatPrice(price) : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
