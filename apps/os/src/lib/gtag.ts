export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

type OSEventMap = {
  trade_memo_create: {
    club_name?: string;
    trade_type?: string;
    via_ai?: boolean;
  };
  trade_memo_ai_draft_submit: { length: number; club?: string };
  trade_memo_ai_applied: {
    matched_club: boolean;
    matched_membership: boolean;
    missing_count: number;
  };
  membership_trade_create: { club_name?: string; trade_type?: string };
  club_view: { club_name: string };
  club_search: { club_name: string };
  estimate_generate: { club_name: string };
  document_download: { document_name: string };
  claim_submit: { category: string };
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

export function trackEvent<K extends keyof OSEventMap>(
  name: K,
  params?: OSEventMap[K],
) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag("event", name, params as Record<string, unknown>);
}
