"use client";

import { useState } from "react";

export interface TradeNotificationPayload {
  tradeId: string;
  clubName: string;
  tradeType: string;
  customerName: string;
  membershipType: string;
  offerPrice: number | null;
  desiredPrice: number | null;
}

export function useSendTradeNotification() {
  const [isSending, setIsSending] = useState(false);

  const send = async (payload: TradeNotificationPayload): Promise<void> => {
    setIsSending(true);
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[useSendTradeNotification] 알림 전송 실패:", err);
    } finally {
      setIsSending(false);
    }
  };

  return { send, isSending };
}
