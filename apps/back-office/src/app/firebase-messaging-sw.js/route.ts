import { NextResponse } from "next/server";

export async function GET() {
  const swContent = `
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var title = (payload.notification && payload.notification.title) || "새 알림";
  var body = (payload.notification && payload.notification.body) || "";

  self.registration.showNotification(title, {
    body: body,
    icon: "/favicon.ico",
    data: {
      url: (payload.data && payload.data.url) || "/dashboard/trade-memos",
    },
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/dashboard/trade-memos";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.indexOf(url) !== -1 && "focus" in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
`;

  return new NextResponse(swContent, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
