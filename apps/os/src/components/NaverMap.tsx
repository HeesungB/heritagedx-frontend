"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import cachedCoordinates from "@/constants/golfCourseCoordinates.json";
import { useGeocode } from "@/hooks/useGeocode";

interface NaverMapProps {
  address: string;
  name?: string;
}

// 네이버 지도 SDK 타입: apps/os/src/types/naver-maps.d.ts 선언 파일에서 전역 Window.naver 정의

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "pywcmzqls0";

const coordinatesMap = cachedCoordinates as Record<string, { name: string; lat: number; lng: number } | null>;

export default function NaverMap({ address, name }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // 이미 SDK가 로드되어 있는지 확인 (탭 전환 시 대응)
  const [sdkLoaded, setSdkLoaded] = useState(
    () => typeof window !== "undefined" && !!window.naver?.maps
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const { getCoords } = useGeocode();

  const initMap = useCallback(async () => {
    if (!mapRef.current || !address) return;

    const { naver } = window;
    if (!naver || !naver.maps) {
      setTimeout(initMap, 100);
      return;
    }

    setLoading(true);

    try {
      let lat: number;
      let lng: number;

      // 캐시된 좌표가 있으면 바로 사용, 없으면 API fallback
      const cached = coordinatesMap[address];
      if (cached) {
        lat = cached.lat;
        lng = cached.lng;
      } else {
        // 서버 API를 통해 geocoding (CORS 우회)
        const coords = await getCoords(address);
        if (!coords) {
          setError("주소를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }
        lat = coords.lat;
        lng = coords.lng;
      }

      const point = new naver.maps.LatLng(lat, lng);

      const map = new naver.maps.Map(mapRef.current!, {
        center: point,
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT,
        },
      });

      new naver.maps.Marker({
        position: point,
        map: map,
      });

      mapInstanceRef.current = map;
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Map init error:", err);
      setError("지도를 불러오는데 실패했습니다.");
      setLoading(false);
    }
  }, [address, getCoords]);

  useEffect(() => {
    // 인증 실패 처리
    window.navermap_authFailure = () => {
      setError("네이버 지도 인증에 실패했습니다.");
      setLoading(false);
    };
    return () => {
      window.navermap_authFailure = undefined;
    };
  }, []);

  useEffect(() => {
    if (sdkLoaded && address) {
      initMap();
    }
  }, [sdkLoaded, address, initMap]);

  return (
    <div className="w-full relative">
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
        onError={() => {
          setError("네이버 지도 로드에 실패했습니다.");
          setLoading(false);
        }}
      />
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg"
      />
      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-500">
          {error || "지도 로딩 중..."}
        </div>
      )}
    </div>
  );
}
