import { NextRequest } from "next/server";

const API_BASE_URL = "https://api.heritage-dx.com";

export async function getAuthUser(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch {
    return null;
  }
}

export async function getFirestore() {
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore: getFs } = await import("firebase-admin/firestore");

  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");
    }
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountKey, "base64").toString("utf-8")
    );
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getFs();
}
