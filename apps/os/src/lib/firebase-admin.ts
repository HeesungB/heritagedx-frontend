import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountKey, "base64").toString("utf-8")
  );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const app = initFirebaseAdmin();

export const firestore = getFirestore(app);
export const messaging = getMessaging(app);
