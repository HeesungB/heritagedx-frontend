import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// lazy import to avoid build-time initialization
async function getFirebaseAdmin() {
  const { firestore, messaging } = await import("@/lib/firebase-admin");
  return { firestore, messaging };
}

interface SendNotificationBody {
  clubName: string;
  tradeType: string;
  customerName: string;
  membershipType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationBody = await request.json();
    const { clubName, tradeType, customerName, membershipType } = body;

    if (!clubName || !tradeType || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { firestore, messaging } = await getFirebaseAdmin();

    // Firestore에서 모든 FCM 토큰 조회
    const tokensSnapshot = await firestore.collection("fcm-tokens").get();

    if (tokensSnapshot.empty) {
      return NextResponse.json({ sent: 0, message: "No registered tokens" });
    }

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token as string);

    const title = `새 거래 메모: ${clubName}`;
    const messageBody = `[${tradeType}] ${customerName} - ${membershipType}`;

    // sendEachForMulticast로 전송
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body: messageBody,
      },
      data: {
        clubName,
        tradeType,
        customerName,
        membershipType,
        url: "/trade-memos",
      },
      webpush: {
        fcmOptions: {
          link: "/trade-memos",
        },
      },
    });

    // 만료된 토큰 정리
    const expiredTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error &&
        (resp.error.code === "messaging/registration-token-not-registered" ||
          resp.error.code === "messaging/invalid-registration-token")
      ) {
        expiredTokens.push(tokens[idx]);
      }
    });

    if (expiredTokens.length > 0) {
      const batch = firestore.batch();
      for (const token of expiredTokens) {
        const docs = await firestore
          .collection("fcm-tokens")
          .where("token", "==", token)
          .get();
        docs.forEach((doc) => batch.delete(doc.ref));
      }
      await batch.commit();
    }

    // Firestore에 알림 이력 저장 (fire-and-forget)
    firestore.collection("notifications").add({
      title,
      body: messageBody,
      clubName,
      tradeType,
      customerName,
      membershipType,
      createdAt: new Date().toISOString(),
      readBy: [],
    }).catch((err) => console.error("Notification write failed:", err));

    return NextResponse.json({
      sent: response.successCount,
      failed: response.failureCount,
      expiredCleaned: expiredTokens.length,
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
