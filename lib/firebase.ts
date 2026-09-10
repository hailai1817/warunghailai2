"use client";

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Placeholders in .env.local (".env.local" is gitignored) mean Firebase has not
// been configured yet — the app keeps running fully in local mode.
export function hasFirebaseConfig(): boolean {
  const { apiKey, projectId, appId } = FIREBASE_CONFIG;
  return Boolean(
    apiKey &&
      !apiKey.includes("YOUR_") &&
      projectId &&
      !projectId.includes("YOUR_") &&
      appId &&
      !appId.includes("YOUR_")
  );
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (typeof window === "undefined") return null;
  if (!hasFirebaseConfig()) return null;
  if (!db) {
    app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
  }
  return db;
}