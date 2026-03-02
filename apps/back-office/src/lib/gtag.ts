export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

type BOEventMap = {
  club_create: { club_name: string };
  club_update: { club_name: string };
  document_create: { document_name: string };
  document_update: { document_name: string };
  trade_memo_status_update: { trade_id: string; status: string };
  trade_record_create: { club_name?: string };
  trade_record_update: { club_name?: string };
  login: Record<string, never>;
  logout: Record<string, never>;
};

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetOrName: string | Date,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export function trackEvent<K extends keyof BOEventMap>(
  name: K,
  params?: BOEventMap[K],
) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag("event", name, params as Record<string, unknown>);
}
