"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const ENV_FIREBASE_CONFIG: FirebaseConfigObject = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const FIREBASE_STORAGE_KEY = "hailai_firebase_config";

export function getFirebaseConfig(): FirebaseConfigObject {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(FIREBASE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FirebaseConfigObject>;
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          return {
            apiKey: parsed.apiKey.trim(),
            authDomain: (parsed.authDomain ?? "").trim(),
            projectId: parsed.projectId.trim(),
            storageBucket: (parsed.storageBucket ?? "").trim(),
            messagingSenderId: (parsed.messagingSenderId ?? "").trim(),
            appId: parsed.appId.trim(),
          };
        }
      }
    } catch {
      // fallback to env
    }
  }

  return ENV_FIREBASE_CONFIG;
}

export function saveFirebaseConfigToStorage(config: Partial<FirebaseConfigObject>): void {
  if (typeof window === "undefined") return;
  const payload: FirebaseConfigObject = {
    apiKey: (config.apiKey ?? "").trim(),
    authDomain: (config.authDomain ?? "").trim(),
    projectId: (config.projectId ?? "").trim(),
    storageBucket: (config.storageBucket ?? "").trim(),
    messagingSenderId: (config.messagingSenderId ?? "").trim(),
    appId: (config.appId ?? "").trim(),
  };
  localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(payload));
  app = null;
  db = null;
}

export function clearFirebaseConfigFromStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FIREBASE_STORAGE_KEY);
  app = null;
  db = null;
}

// Check whether Firebase has valid credentials configured
export function hasFirebaseConfig(): boolean {
  const config = getFirebaseConfig();
  const { apiKey, projectId, appId } = config;
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
    const config = getFirebaseConfig();
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(config);
    db = getFirestore(app);
  }
  return db;
}
