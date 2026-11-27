"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getDb, getFirebaseConfig, hasFirebaseConfig } from "./firebase";
import type { CsChatMessage, CsChatThread, CustomerReview, Employee, Product, ProductAuditLog, StoreSettings, Transaction } from "./types";

export type CloudCollectionKey = "products" | "transactions" | "reviews" | "employees" | "productLogs" | "cs_chats";

export interface CloudData {
  products?: Product[];
  transactions?: Transaction[];
  settings?: StoreSettings | null;
  reviews?: CustomerReview[];
  employees?: Employee[];
  productLogs?: ProductAuditLog[];
  csChats?: CsChatThread[];
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
    const [productsSnap, transactionsSnap, settingsSnap, reviewsSnap, employeesSnap, productLogsSnap, csChatsSnap] =
      await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "transactions")),
        getDoc(doc(db, "settings", SETTINGS_DOC)),
        getDocs(collection(db, "reviews")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "productLogs")),
        getDocs(collection(db, "cs_chats")),
      ]);
    return {
      products: productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Product)),
      transactions: transactionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Transaction)),
      settings: settingsSnap.exists() ? (settingsSnap.data() as StoreSettings) : null,
      reviews: reviewsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as CustomerReview)),
      employees: employeesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Employee)),
      productLogs: productLogsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as ProductAuditLog)),
      csChats: csChatsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as CsChatThread)),
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

    // Upsert all items into Firestore safely in chunks without deleting existing items
    const CHUNK_SIZE = 400;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        batch.set(doc(ref, item.id), cleanForFirestore(item) as Record<string, unknown>, { merge: true });
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
  const db = getDb();
  if (!db) {
    return {
      configured: false,
      connected: false,
      message: "Koneksi database Firebase tidak dapat diinisialisasi.",
    };
  }
  try {
    const sDoc = await getDoc(doc(db, "settings", SETTINGS_DOC));
    const project = getFirebaseConfig().projectId;
    return {
      configured: true,
      connected: true,
      message: `Terhubung ke Firebase Firestore (Project: ${project || "aktif"}). Sinkronisasi cloud aktif real-time (dokumen settings ada: ${sDoc.exists() ? "Ya" : "Baru"}).`,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      message: `Tidak bisa terhubung ke Firestore: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function cloudSaveDoc(
  col: CloudCollectionKey,
  docId: string,
  data: unknown
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, col, docId), cleanForFirestore(data) as Record<string, unknown>, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function cloudDeleteDoc(
  col: CloudCollectionKey,
  docId: string
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, col, docId));
    return true;
  } catch {
    return false;
  }
}

export interface RealtimeSubscribers {
  onReviews?: (reviews: CustomerReview[]) => void;
  onTransactions?: (transactions: Transaction[]) => void;
  onProducts?: (products: Product[]) => void;
  onEmployees?: (employees: Employee[]) => void;
  onProductLogs?: (logs: ProductAuditLog[]) => void;
  onCsChats?: (threads: CsChatThread[]) => void;
}

export function subscribeToRealtimeCloud(handlers: RealtimeSubscribers): () => void {
  const db = getDb();
  if (!db) return () => {};

  const unsubs: Array<() => void> = [];

  if (handlers.onReviews) {
    unsubs.push(
      onSnapshot(
        collection(db, "reviews"),
        (snap) => {
          if (handlers.onReviews) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as CustomerReview));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            handlers.onReviews(list);
          }
        },
        (err) => console.warn("Firestore reviews sync notice:", err)
      )
    );
  }

  if (handlers.onTransactions) {
    unsubs.push(
      onSnapshot(
        collection(db, "transactions"),
        (snap) => {
          if (handlers.onTransactions) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Transaction));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            handlers.onTransactions(list);
          }
        },
        (err) => console.warn("Firestore transactions sync notice:", err)
      )
    );
  }

  if (handlers.onProducts) {
    unsubs.push(
      onSnapshot(
        collection(db, "products"),
        (snap) => {
          if (handlers.onProducts) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Product));
            list.sort((a, b) => a.id.localeCompare(b.id));
            handlers.onProducts(list);
          }
        },
        (err) => console.warn("Firestore products sync notice:", err)
      )
    );
  }

  if (handlers.onEmployees) {
    unsubs.push(
      onSnapshot(
        collection(db, "employees"),
        (snap) => {
          if (handlers.onEmployees) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as Employee));
            list.sort((a, b) => a.id.localeCompare(b.id));
            handlers.onEmployees(list);
          }
        },
        (err) => console.warn("Firestore employees sync notice:", err)
      )
    );
  }

  if (handlers.onProductLogs) {
    unsubs.push(
      onSnapshot(
        collection(db, "productLogs"),
        (snap) => {
          if (handlers.onProductLogs) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as ProductAuditLog));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            handlers.onProductLogs(list);
          }
        },
        (err) => console.warn("Firestore productLogs sync notice:", err)
      )
    );
  }

  if (handlers.onCsChats) {
    unsubs.push(
      onSnapshot(
        collection(db, "cs_chats"),
        (snap) => {
          if (handlers.onCsChats) {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as CsChatThread));
            list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            handlers.onCsChats(list);
          }
        },
        (err) => console.warn("Firestore cs_chats sync notice:", err)
      )
    );
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

export async function sendCsChatMessage(
  threadId: string,
  message: { senderRole: "pelanggan" | "admin"; senderName: string; text: string },
  customerMeta: { customerName: string }
): Promise<CsChatThread | null> {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const newMsg: CsChatMessage = {
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    senderRole: message.senderRole,
    senderName: message.senderName,
    text: message.text.trim(),
    timestamp,
  };

  if (!db) return null;

  try {
    const threadRef = doc(db, "cs_chats", threadId);
    const snap = await getDoc(threadRef);
    let thread: CsChatThread;

    if (snap.exists()) {
      const existing = snap.data() as CsChatThread;
      thread = {
        ...existing,
        updatedAt: timestamp,
        lastMessage: newMsg.text,
        lastSenderRole: newMsg.senderRole,
        unreadByAdmin: message.senderRole === "pelanggan" ? true : existing.unreadByAdmin,
        unreadByCustomer: message.senderRole === "admin" ? true : existing.unreadByCustomer,
        messages: [...(existing.messages || []), newMsg],
      };
    } else {
      thread = {
        id: threadId,
        customerName: customerMeta.customerName,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessage: newMsg.text,
        lastSenderRole: newMsg.senderRole,
        unreadByAdmin: message.senderRole === "pelanggan",
        unreadByCustomer: message.senderRole === "admin",
        status: "open",
        messages: [newMsg],
      };
    }

    await setDoc(threadRef, cleanForFirestore(thread) as Record<string, unknown>, { merge: true });
    return thread;
  } catch (err) {
    console.warn("[Firestore] Failed to send CS chat message:", err);
    return null;
  }
}

export async function markCsThreadRead(threadId: string, byRole: "admin" | "pelanggan"): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const threadRef = doc(db, "cs_chats", threadId);
    const patch = byRole === "admin" ? { unreadByAdmin: false } : { unreadByCustomer: false };
    await setDoc(threadRef, patch, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function deleteCsThread(threadId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "cs_chats", threadId));
    return true;
  } catch {
    return false;
  }
}