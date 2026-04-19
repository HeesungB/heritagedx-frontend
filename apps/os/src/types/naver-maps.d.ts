// 네이버 지도 SDK 최소 타입 선언 (1-4)
// 전체 SDK 를 모델링하지 않고, NaverMap 컴포넌트가 실제 사용하는 표면만 선언한다.

export {};

declare global {
  namespace naver.maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Map {
      constructor(element: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      setZoom(zoom: number): void;
      destroy(): void;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng;
    }

    interface MapOptions {
      center: LatLng;
      zoom?: number;
      zoomControl?: boolean;
      zoomControlOptions?: {
        position: Position;
      };
    }

    interface HtmlIcon {
      content: string;
      anchor?: Point;
      size?: Size;
    }

    interface MarkerOptions {
      position: LatLng;
      map: Map;
      icon?: HtmlIcon | string;
      zIndex?: number;
    }

    const Event: {
      addListener(target: unknown, event: string, handler: (...args: unknown[]) => void): void;
    };

    enum Position {
      TOP_LEFT,
      TOP_CENTER,
      TOP_RIGHT,
      LEFT_CENTER,
      CENTER,
      RIGHT_CENTER,
      BOTTOM_LEFT,
      BOTTOM_CENTER,
      BOTTOM_RIGHT,
    }
  }

  interface Window {
    naver?: {
      maps: typeof naver.maps;
    };
    navermap_authFailure?: () => void;
  }
}
