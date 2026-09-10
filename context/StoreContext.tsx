"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  CartItem,
  CheckoutResult,
  CustomerReview,
  PaymentMethod,
  Product,
  StoreSettings,
  Transaction,
  TransactionDiscount,
} from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  DEFAULT_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_TRANSACTIONS,
} from "@/lib/mock-data";
import { generateTransactionId, workingDateObject } from "@/lib/format";
import { applyThemeVars, BAKERY_THEME } from "@/lib/color";
import { hasFirebaseConfig } from "@/lib/firebase";
import { cloudLoadAll, cloudSave } from "@/lib/firestore-service";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// On the file:// protocol some browsers (Chrome/Edge) throw a SecurityError on
// any localStorage access. Persistence must never crash the app, so writes are
// best-effort: the in-memory state keeps working, only saving is skipped.
function persistLocal(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — app still runs, data just won't survive reload
  }
}

// Debounced request/response sync to Firestore. Firestore is the source of
// truth; localStorage stays as an offline/first-paint cache. No realtime
// listeners: writes are explicit setDoc requests a moment after changes settle.
const cloudTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function scheduleCloudSave(
  key: "products" | "transactions" | "settings" | "reviews",
  payload: unknown
): void {
  if (!hasFirebaseConfig()) return;
  const existing = cloudTimers[key];
  if (existing) clearTimeout(existing);
  cloudTimers[key] = setTimeout(() => {
    void (
      cloudSave as unknown as (k: string, p: unknown) => Promise<boolean>
    )(key, payload);
  }, 700);
}

interface StoreContextValue {
  products: Product[];
  transactions: Transaction[];
  cart: CartItem[];
  settings: StoreSettings;
  reviews: CustomerReview[];
  hydrated: boolean;
  cloudEnabled: boolean;
  addToCart: (productId: string) => void;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (
    method: PaymentMethod,
    cashReceived: number,
    discount?: TransactionDiscount
  ) => CheckoutResult;
  addProduct: (data: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id">>) => void;
  deleteProduct: (id: string) => void;
  addReview: (data: Omit<CustomerReview, "id" | "date">) => void;
  deleteReview: (id: string) => void;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  resetData: () => void;
  clearTransactions: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initial state intentionally matches the server-rendered mock data so the
  // first client render can hydrate without mismatches. Persisted data is then
  // read once after mount, before any writes are allowed.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reading persisted data after hydration */
    setProducts(loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS));
    setTransactions(loadFromStorage(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS));
    setSettings(loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
    setReviews(loadFromStorage(STORAGE_KEYS.reviews, INITIAL_REVIEWS));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // One request/response round-trip after first render: pull the full dataset
  // from Firestore. The cloud version wins only when it actually has data; an
  // empty/never-populated cloud keeps the local seed data and lets the save
  // effects upload it on the first run.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cloud = await cloudLoadAll();
      if (cancelled || cloud === null) return;
      if (cloud.products && cloud.products.length > 0) setProducts(cloud.products);
      if (cloud.transactions && cloud.transactions.length > 0) {
        setTransactions(cloud.transactions);
      }
      if (cloud.reviews && cloud.reviews.length > 0) setReviews(cloud.reviews);
      if (cloud.settings) setSettings(cloud.settings);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.products, products);
    scheduleCloudSave("products", products);
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.transactions, transactions);
    scheduleCloudSave("transactions", transactions);
  }, [transactions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.settings, settings);
    scheduleCloudSave("settings", settings);
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.reviews, reviews);
    scheduleCloudSave("reviews", reviews);
  }, [reviews, hydrated]);

  // Apply the user's color theme to the CSS custom properties used by the UI.
  // Runs on mount (after persisted settings load) and whenever the theme changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    applyThemeVars(settings.theme ?? BAKERY_THEME);
  }, [settings?.theme]);

  const addToCart = useCallback(
    (productId: string) => {
      setCart((prev) => {
        const product = products.find((p) => p.id === productId);
        if (!product || product.stock <= 0) return prev;
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId
              ? { ...i, qty: Math.min(i.qty + 1, product.stock) }
              : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.image,
            qty: 1,
          },
        ];
      });
    },
    [products]
  );

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + delta } : i
        )
        .filter((i) => i.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const checkout = useCallback(
    (method: PaymentMethod, cashReceived: number, discount?: TransactionDiscount): CheckoutResult => {
      const items = cart;
      if (items.length === 0) {
        return { ok: false, error: "Keranjang masih kosong." };
      }

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          return { ok: false, error: `Produk "${item.name}" tidak ditemukan.` };
        }
        if (item.qty > product.stock) {
          return {
            ok: false,
            error: `Stok "${item.name}" tidak mencukupi (tersisa ${product.stock}).`,
          };
        }
      }

      const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const discountAmount =
        discount && Number.isFinite(discount.amount)
          ? Math.min(Math.max(0, Math.round(discount.amount)), subtotal)
          : 0;
      const taxable = subtotal - discountAmount;
      const tax = Math.round((taxable * settings.taxRate) / 100);
      const total = taxable + tax;
      const paid = method === "Tunai" ? Math.max(0, cashReceived) : total;
      const change = paid - total;

      if (change < 0) {
        return {
          ok: false,
          error: "Uang yang dibayarkan kurang dari total transaksi.",
        };
      }

      const transaction: Transaction = {
        id: generateTransactionId(transactions.length + 1),
        date: workingDateObject(settings.workingDate).toISOString(),
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          subtotal: i.price * i.qty,
        })),
        subtotal,
        discount: discountAmount > 0 ? discountAmount : undefined,
        discountType:
          discountAmount > 0 && discount ? discount.type : undefined,
        discountValue:
          discountAmount > 0 && discount && Number.isFinite(discount.value)
            ? discount.type === "percent"
              ? Math.min(Math.max(0, Math.round(discount.value)), 100)
              : Math.max(0, Math.round(discount.value))
            : undefined,
        tax,
        total,
        paymentMethod: method,
        cashReceived: paid,
        change,
      };

      setProducts((prev) =>
        prev.map((p) => {
          const item = items.find((i) => i.productId === p.id);
          return item
            ? { ...p, stock: Math.max(0, p.stock - item.qty) }
            : p;
        })
      );
      setTransactions((prev) => [transaction, ...prev]);
      setCart([]);
      return { ok: true, transaction };
    },
    [cart, products, settings, transactions]
  );

  const addProduct = useCallback((data: Omit<Product, "id">) => {
    setProducts((prev) => {
      const nextSeq = prev.reduce((max, p) => {
        const n = parseInt(p.id.replace(/\D/g, ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const id = `P${String(nextSeq + 1).padStart(2, "0")}`;
      return [{ ...data, id }, ...prev];
    });
  }, []);

  const updateProduct = useCallback(
    (id: string, patch: Partial<Omit<Product, "id">>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((i) => i.productId !== id));
  }, []);

  const addReview = useCallback((data: Omit<CustomerReview, "id" | "date">) => {
    setReviews((prev) => {
      const nextSeq = prev.reduce((max, r) => {
        const n = parseInt(r.id.replace(/\D/g, ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const id = `R${String(nextSeq + 1).padStart(2, "0")}`;
      return [{ ...data, id, date: new Date().toISOString() }, ...prev];
    });
  }, []);

  const deleteReview = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetData = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(DEFAULT_SETTINGS);
    setReviews(INITIAL_REVIEWS);
    setCart([]);
  }, []);

  const clearTransactions = useCallback(() => setTransactions([]), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      transactions,
      cart,
      settings,
      reviews,
      hydrated,
      cloudEnabled: hasFirebaseConfig(),
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      checkout,
      addProduct,
      updateProduct,
      deleteProduct,
      addReview,
      deleteReview,
      updateSettings,
      resetData,
      clearTransactions,
    }),
    [
      products,
      transactions,
      cart,
      settings,
      reviews,
      hydrated,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      checkout,
      addProduct,
      updateProduct,
      deleteProduct,
      addReview,
      deleteReview,
      updateSettings,
      resetData,
      clearTransactions,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return ctx;
}
