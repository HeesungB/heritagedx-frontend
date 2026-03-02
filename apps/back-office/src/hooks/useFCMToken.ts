"use client";

import { useEffect, useRef } from "react";
import { getFCMToken } from "@/lib/firebase";

export function useFCMToken() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    (async () => {
      try {
        // Service Worker 등록
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }

        const token = await getFCMToken();
        if (!token) return;

        // 토큰을 서버에 등록
        await fetch("/api/fcm-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error("FCM token registration failed:", error);
      }
    })();
  }, []);
}
