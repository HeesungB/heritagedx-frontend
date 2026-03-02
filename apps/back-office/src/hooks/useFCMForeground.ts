"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { onForegroundMessage } from "@/lib/firebase";

interface FCMPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

export function useFCMForeground() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const p = payload as FCMPayload;
      const title = p.notification?.title || "새 알림";
      const body = p.notification?.body || "";
      const tradeId = p.data?.tradeId;
      const url = tradeId
        ? `/trade-memos?memoId=${tradeId}`
        : (p.data?.url || "/trade-memos");

      toast(title, {
        description: body,
        duration: 8000,
        action: {
          label: "확인",
          onClick: () => router.push(url),
        },
      });

      // useNotifications가 이 이벤트를 수신하여 unreadCount 갱신
      window.dispatchEvent(new CustomEvent("fcm-notification-received"));
    });

    return unsubscribe;
  }, [router]);
}
