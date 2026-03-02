import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getFirestore } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = String(user.id);
    const firestore = await getFirestore();
    const { FieldValue } = await import("firebase-admin/firestore");

    if (body.all === true) {
      // 전체 읽음 처리 (최근 100건)
      const snapshot = await firestore
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          readBy: FieldValue.arrayUnion(userId),
        });
      });
      await batch.commit();

      return NextResponse.json({ success: true, updated: snapshot.size });
    }

    if (body.notificationId) {
      // 단건 읽음 처리
      const docRef = firestore.collection("notifications").doc(body.notificationId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      await docRef.update({
        readBy: FieldValue.arrayUnion(userId),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "notificationId or all:true required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Notification read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
