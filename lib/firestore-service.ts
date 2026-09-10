"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getDb, hasFirebaseConfig } from "./firebase";
import type { CustomerReview, Product, StoreSettings, Transaction } from "./types";

export type CloudCollectionKey = "products" | "transactions" | "reviews";

export interface CloudData {
  products?: Product[];
  transactions?: Transaction[];
  settings?: StoreSettings | null;
  reviews?: CustomerReview[];
}

const SETTINGS_DOC = "store";

// Firestore rejects undefined values. JSON round-trip drops undefined object
// keys (and empty-array entries) so partial/legacy data never breaks a write.
const cleanForFirestore = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value));

// Request/response only: every call below is an explicit get/set Firestore
// request. No onSnapshot() realtime listeners are used anywhere.
export async function cloudLoadAll(): Promise<CloudData | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const [productsSnap, transactionsSnap, settingsSnap, reviewsSnap] =
      await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "transactions")),
        getDoc(doc(db, "settings", SETTINGS_DOC)),
        getDocs(collection(db, "reviews")),
      ]);
    return {
      products: productsSnap.docs.map((d) => d.data() as Product),
      transactions: transactionsSnap.docs.map((d) => d.data() as Transaction),
      settings: settingsSnap.exists() ? (settingsSnap.data() as StoreSettings) : null,
      reviews: reviewsSnap.docs.map((d) => d.data() as CustomerReview),
    };
  } catch {
    // Unreachable network or unsupported rules -> caller falls back to local
    // localStorage cache.
    return null;
  }
}

export async function cloudSave(
  key: "settings",
  payload: StoreSettings
): Promise<boolean>;
export async function cloudSave(
  key: CloudCollectionKey,
  payload: Array<Product | Transaction | CustomerReview>
): Promise<boolean>;
export async function cloudSave(
  key: CloudCollectionKey | "settings",
  payload: StoreSettings | Array<Product | Transaction | CustomerReview>
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    if (key === "settings") {
      await setDoc(doc(db, "settings", SETTINGS_DOC), cleanForFirestore(payload) as StoreSettings);
      return true;
    }
    const ref = collection(db, key);
    const items = payload as Array<{ id: string }>;
    const batch = writeBatch(db);
    const keptIds = new Set<string>();
    for (const item of items) {
      batch.set(doc(ref, item.id), cleanForFirestore(item));
      keptIds.add(item.id);
    }
    const existing = await getDocs(ref);
    for (const snap of existing.docs) {
      if (!keptIds.has(snap.id)) {
        batch.delete(doc(ref, snap.id));
      }
    }
    await batch.commit();
    return true;
  } catch {
    return false;
  }
}

export interface CloudConnectionStatus {
  configured: boolean;
  connected: boolean;
  message: string;
}

export async function cloudTestConnection(): Promise<CloudConnectionStatus> {
  if (!hasFirebaseConfig()) {
    return {
      configured: false,
      connected: false,
      message: "Firebase belum dikonfigurasi. Isi .env.local lalu build ulang.",
    };
  }
  const data = await cloudLoadAll();
  if (data === null) {
    return {
      configured: true,
      connected: false,
      message:
        "Tidak bisa terhubung ke Firestore. Cek konfigurasi, aturan (firestore.rules), dan jaringan.",
    };
  }
  return {
    configured: true,
    connected: true,
    message:
      "Terhubung ke Firebase Firestore (request/response). Data tersimpan di cloud + cache lokal.",
  };
}