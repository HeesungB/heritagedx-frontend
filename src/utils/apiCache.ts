// 간단한 메모리 캐시 구현
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  const now = Date.now();

  // 캐시가 있고 유효한 경우
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  // 새로운 데이터 fetch
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data = await response.json();

  // 캐시에 저장
  cache.set(url, { data, timestamp: now });

  return data as T;
}

export function clearCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

export function preloadCache(urls: string[]) {
  return Promise.all(urls.map((url) => fetchWithCache(url).catch(() => null)));
}
