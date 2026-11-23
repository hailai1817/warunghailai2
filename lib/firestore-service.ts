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
import type { CustomerReview, Employee, Product, ProductAuditLog, StoreSettings, Transaction } from "./types";

export type CloudCollectionKey = "products" | "transactions" | "reviews" | "employees" | "productLogs";

export interface CloudData {
  products?: Product[];
  transactions?: Transaction[];
  settings?: StoreSettings | null;
  reviews?: CustomerReview[];
  employees?: Employee[];
  productLogs?: ProductAuditLog[];
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
    const [productsSnap, transactionsSnap, settingsSnap, reviewsSnap, employeesSnap, productLogsSnap] =
      await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "transactions")),
        getDoc(doc(db, "settings", SETTINGS_DOC)),
        getDocs(collection(db, "reviews")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "productLogs")),
      ]);
    return {
      products: productsSnap.docs.map((d) => d.data() as Product),
      transactions: transactionsSnap.docs.map((d) => d.data() as Transaction),
      settings: settingsSnap.exists() ? (settingsSnap.data() as StoreSettings) : null,
      reviews: reviewsSnap.docs.map((d) => d.data() as CustomerReview),
      employees: employeesSnap.docs.map((d) => d.data() as Employee),
      productLogs: productLogsSnap.docs.map((d) => d.data() as ProductAuditLog),
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
  payload: Array<Product | Transaction | CustomerReview | Employee | ProductAuditLog>
): Promise<boolean>;
export async function cloudSave(
  key: CloudCollectionKey | "settings",
  payload: StoreSettings | Array<Product | Transaction | CustomerReview | Employee | ProductAuditLog>
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
    const keptIds = new Set<string>();

    // Prepare all set operations
    type BatchOp =
      | { type: "set"; id: string; data: unknown }
      | { type: "delete"; id: string };

    const ops: BatchOp[] = [];
    for (const item of items) {
      keptIds.add(item.id);
      ops.push({ type: "set", id: item.id, data: cleanForFirestore(item) });
    }

    // Prepare delete operations for obsolete items
    const existing = await getDocs(ref);
    for (const snap of existing.docs) {
      if (!keptIds.has(snap.id)) {
        ops.push({ type: "delete", id: snap.id });
      }
    }

    // Firestore allows maximum 500 ops per batch. Use 400 to stay safely under limit.
    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        if (op.type === "set") {
          batch.set(doc(ref, op.id), op.data as Record<string, unknown>);
        } else {
          batch.delete(doc(ref, op.id));
        }
      }
      await batch.commit();
    }

    return true;
  } catch {
    return false;
  }
}

export async function pushAllDataToCloud(data: {
  products: Product[];
  transactions: Transaction[];
  settings: StoreSettings;
  reviews: CustomerReview[];
  employees: Employee[];
}): Promise<{ ok: boolean; message: string }> {
  const db = getDb();
  if (!db) {
    return {
      ok: false,
      message: "Firebase belum dikonfigurasi. Harap lengkapi konfigurasi Firebase terlebih dahulu.",
    };
  }
  try {
    const pSettings = await cloudSave("settings", data.settings);
    const pProducts = await cloudSave("products", data.products);
    const pTx = await cloudSave("transactions", data.transactions);
    const pReviews = await cloudSave("reviews", data.reviews);
    const pEmployees = await cloudSave("employees", data.employees);

    if (pSettings && pProducts && pTx && pReviews && pEmployees) {
      return {
        ok: true,
        message: `Berhasil mem-push seluruh data ke Cloud Firestore (${data.products.length} produk, ${data.transactions.length} transaksi, ${data.employees.length} karyawan, ${data.reviews.length} ulasan)!`,
      };
    }
    return {
      ok: false,
      message:
        "Sebagian data gagal di-push ke Firestore. Periksa aturan (firestore.rules) dan jaringan internet Anda.",
    };
  } catch (err) {
    return {
      ok: false,
      message: `Gagal push ke Firestore: ${err instanceof Error ? err.message : String(err)}`,
    };
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
      message: "Firebase belum dikonfigurasi. Atur melalui menu Konfigurasi Firebase atau isi .env.local.",
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