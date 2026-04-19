"use client";

import { useState, useCallback } from "react";

export interface GeocodeCoords {
  lat: number;
  lng: number;
}

export function useGeocode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCoords = useCallback(
    async (address: string): Promise<GeocodeCoords | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/geocode?query=${encodeURIComponent(address)}`,
        );
        const data = await response.json();

        if (data.error) {
          const msg =
            typeof data.error === "string"
              ? data.error
              : data.error.message || "알 수 없는 오류가 발생했습니다.";
          setError(msg);
          return null;
        }

        const addresses = data.addresses;
        if (!addresses || addresses.length === 0) {
          setError("주소를 찾을 수 없습니다.");
          return null;
        }

        return {
          lat: parseFloat(addresses[0].y),
          lng: parseFloat(addresses[0].x),
        };
      } catch {
        setError("지오코딩 요청에 실패했습니다.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { getCoords, isLoading, error };
}
