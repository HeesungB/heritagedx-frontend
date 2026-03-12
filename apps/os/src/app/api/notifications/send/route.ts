import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// lazy import to avoid build-time initialization
async function getFirebaseAdmin() {
  const { firestore, messaging } = await import("@/lib/firebase-admin");
  return { firestore, messaging };
}

interface SendNotificationBody {
  tradeId?: string;
  clubName: string;
  tradeType: string;
  customerName: string;
  membershipType: string;
  offerPrice?: number | null;
  desiredPrice?: number | null;
}

interface CounterTradeResult {
  count: number;
  latestCustomer: string | null;
  hasPriceMatch: boolean;
}

async function findCounterTrades(
  clubName: string,
  tradeType: string,
  offerPrice: number | null,
  desiredPrice: number | null
): Promise<CounterTradeResult> {
  try {
    const oppositeType = tradeType === "매수" ? "매도" : "매수";
    const params = new URLSearchParams({
      search: clubName,
      tradeType: oppositeType,
      limit: "100",
    });

    const res = await fetch(
      `https://api.heritage-dx.com/api/consultations?${params}`,
      { cache: "no-store" }
    );

    if (!res.ok) return { count: 0, latestCustomer: null, hasPriceMatch: false };

    const json = await res.json();
    const allTrades = json.data?.trades || json.trades || [];

    // 같은 골프장 + 미완료만 필터
    const trades = allTrades.filter(
      (t: Record<string, unknown>) => t.clubName === clubName && !t.isDone
    );

    // 유사가격 판별 (±10%)
    const refPrice = offerPrice || desiredPrice;
    let hasPriceMatch = false;
    if (refPrice && refPrice > 0) {
      const threshold = refPrice * 0.1;
      hasPriceMatch = trades.some((t: Record<string, unknown>) => {
        const tPrice = Number(t.offerPrice) || Number(t.desiredPrice) || 0;
        return tPrice > 0 && Math.abs(tPrice - refPrice) <= threshold;
      });
    }

    // 최근 항목
    const sorted = [...trades].sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
    const latestCustomer = sorted.length > 0 ? String(sorted[0].customerName) : null;

    return { count: trades.length, latestCustomer, hasPriceMatch };
  } catch {
    return { count: 0, latestCustomer: null, hasPriceMatch: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNotificationBody = await request.json();
    const {
      tradeId,
      clubName,
      tradeType,
      customerName,
      membershipType,
      offerPrice,
      desiredPrice,
    } = body;

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

    // 반대매매 후보 조회
    const matches = await findCounterTrades(
      clubName,
      tradeType,
      offerPrice ?? null,
      desiredPrice ?? null
    );

    const oppositeType = tradeType === "매수" ? "매도" : "매수";
    const title = `새 상담일지: ${clubName}`;
    let messageBody = `[${tradeType}] ${customerName} - ${membershipType}`;
    if (matches.count > 0) {
      messageBody += `\n반대매매(${oppositeType}) ${matches.count}건`;
      if (matches.hasPriceMatch) {
        messageBody += " (유사가격 있음)";
      }
      if (matches.latestCustomer) {
        messageBody += `\n최근: ${matches.latestCustomer}`;
      }
    }

    const notificationUrl = tradeId
      ? `/trade-memos?memoId=${tradeId}`
      : "/trade-memos";

    // sendEachForMulticast로 전송
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body: messageBody,
      },
      data: {
        tradeId: tradeId || "",
        clubName,
        tradeType,
        customerName,
        membershipType,
        url: notificationUrl,
        counterTradeCount: String(matches.count),
        hasPriceMatch: String(matches.hasPriceMatch),
      },
      webpush: {
        fcmOptions: {
          link: notificationUrl,
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
      tradeId: tradeId || null,
      clubName,
      tradeType,
      customerName,
      membershipType,
      counterTradeCount: matches.count,
      hasPriceMatch: matches.hasPriceMatch,
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
