import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getFirestore } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

    const firestore = await getFirestore();
    const collection = firestore.collection("notifications");

    // 전체 개수 조회
    const countSnapshot = await collection.count().get();
    const total = countSnapshot.data().count;
    const totalPages = Math.ceil(total / limit);

    // 페이지네이션된 목록 조회
    const offset = (page - 1) * limit;
    const snapshot = await collection
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        tradeId: data.tradeId || null,
        clubName: data.clubName,
        tradeType: data.tradeType,
        customerName: data.customerName,
        membershipType: data.membershipType,
        createdAt: data.createdAt,
        isRead: Array.isArray(data.readBy) && data.readBy.includes(String(user.id)),
      };
    });

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
