"use client";

import { useEffect, useRef, useState } from "react";
import cachedCoordinates from "@/constants/golfCourseCoordinates.json";

/* eslint-disable @typescript-eslint/no-explicit-any */

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "pywcmzqls0";

const coordinatesMap = cachedCoordinates as Record<string, { name: string; lat: number; lng: number }>;

interface MapSidebarProps {
  currentAddress: string;
  clubName: string;
  onClose: () => void;
}

export default function MapSidebar({ currentAddress, clubName, onClose }: MapSidebarProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSdk = (): Promise<void> => {
      if (window.naver?.maps) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src*="oapi.map.naver.com"]'
        );

        if (existing) {
          const check = () => {
            if (window.naver?.maps) resolve();
            else setTimeout(check, 200);
          };
          check();
          return;
        }

        const script = document.createElement("script");
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("SDK load failed"));
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await loadSdk();
        if (cancelled || !mapRef.current) return;

        const { naver } = window;
        if (!naver?.maps) return;

        const current = coordinatesMap[currentAddress];
        const centerLat = current?.lat ?? 36.5;
        const centerLng = current?.lng ?? 127.5;

        const map = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(centerLat, centerLng),
          zoom: current ? 10 : 7,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
        });

        for (const [address, data] of Object.entries(coordinatesMap)) {
          if (!data) continue;
          const isCurrent = address === currentAddress;

          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(data.lat, data.lng),
            map,
            icon: {
              content: isCurrent
                ? `<div style="display:flex;flex-direction:column;align-items:center;">
                    <div style="padding:3px 8px;background:#dc2626;color:#fff;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${data.name}</div>
                    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #dc2626;"></div>
                    <div style="width:8px;height:8px;background:#dc2626;border:2px solid #fff;border-radius:50%;margin-top:-2px;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>
                  </div>`
                : `<div style="display:flex;flex-direction:column;align-items:center;">
                    <div style="padding:2px 6px;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:3px;font-size:10px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.1);">${data.name}</div>
                    <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid #d1d5db;"></div>
                    <div style="width:6px;height:6px;background:#6b7280;border:1.5px solid #fff;border-radius:50%;margin-top:-1px;box-shadow:0 1px 2px rgba(0,0,0,0.2);"></div>
                  </div>`,
              anchor: new naver.maps.Point(0, 0),
              size: new naver.maps.Size(0, 0),
            },
            zIndex: isCurrent ? 100 : 1,
          });

          naver.maps.Event.addListener(marker, "click", () => {
            map.setCenter(marker.getPosition());
            map.setZoom(12);
          });
        }

        setError(null);
        setLoading(false);
      } catch (err) {
        console.error("MapSidebar init error:", err);
        if (!cancelled) {
          setError("지도를 불러오는데 실패했습니다.");
          setLoading(false);
        }
      }
    };

    init();

    return () => { cancelled = true; };
  }, [currentAddress, clubName]);

  return (
    <aside className="w-[480px] flex-shrink-0 h-full border-l border-gray-200 bg-white flex flex-col print:hidden">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-xs text-gray-700">골프장 지도</h3>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          title="닫기"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 지도 영역 — 고정 크기로 네이버 지도가 확실히 렌더링되도록 */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />
        {(loading || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500">
            {error || "지도 로딩 중..."}
          </div>
        )}
      </div>
    </aside>
  );
}
