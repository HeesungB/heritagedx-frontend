import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getFirestore } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const firestore = await getFirestore();

    // 같은 토큰이 이미 있는지 확인
    const existing = await firestore
      .collection("fcm-tokens")
      .where("token", "==", token)
      .get();

    if (!existing.empty) {
      // 기존 토큰 업데이트 (유저 정보 갱신)
      const doc = existing.docs[0];
      await doc.ref.update({
        userId: user.id,
        userName: user.name || user.email,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // 새 토큰 등록
      await firestore.collection("fcm-tokens").add({
        token,
        userId: user.id,
        userName: user.name || user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM token registration error:", error);
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const firestore = await getFirestore();

    const docs = await firestore
      .collection("fcm-tokens")
      .where("token", "==", token)
      .get();

    if (!docs.empty) {
      const batch = firestore.batch();
      docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FCM token deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 }
    );
  }
}
