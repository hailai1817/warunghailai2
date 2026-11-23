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
  Employee,
  PaymentMethod,
  Product,
  ProductAuditLog,
  StoreSettings,
  Transaction,
  TransactionDiscount,
  UserRole,
} from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  DEFAULT_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_LOGS,
  INITIAL_REVIEWS,
  INITIAL_TRANSACTIONS,
  migrateProductCatalog,
} from "@/lib/mock-data";
import {
  generateTransactionId,
  getEffectiveWorkingDate,
} from "@/lib/format";
import { applyThemeVars, BAKERY_THEME } from "@/lib/color";
import { hasFirebaseConfig } from "@/lib/firebase";
import {
  cloudDeleteDoc,
  cloudLoadAll,
  cloudSave,
  cloudSaveDoc,
  subscribeToRealtimeCloud,
} from "@/lib/firestore-service";

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
// truth; localStorage stays as an offline/first-paint cache.
const cloudTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const lastCloudSaved: Record<string, string> = {};

function scheduleCloudSave(
  key: "products" | "transactions" | "settings" | "reviews" | "employees" | "productLogs",
  payload: unknown
): void {
  if (!hasFirebaseConfig()) return;
  const serialized = JSON.stringify(payload);
  if (lastCloudSaved[key] === serialized) return;

  const existing = cloudTimers[key];
  if (existing) clearTimeout(existing);
  cloudTimers[key] = setTimeout(() => {
    lastCloudSaved[key] = serialized;
    void (
      cloudSave as unknown as (k: string, p: unknown) => Promise<boolean>
    )(key, payload);
  }, 700);
}

export type EmployeeMutationResult = { ok: true } | { ok: false; error: string };

interface StoreContextValue {
  products: Product[];
  transactions: Transaction[];
  productLogs: ProductAuditLog[];
  cart: CartItem[];
  settings: StoreSettings;
  reviews: CustomerReview[];
  employees: Employee[];
  hydrated: boolean;
  cloudEnabled: boolean;
  addToCart: (productId: string) => boolean;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (
    method: PaymentMethod,
    cashReceived: number,
    discount?: TransactionDiscount,
    customerMeta?: { customerName?: string; orderedByRole?: UserRole }
  ) => CheckoutResult;
  addProduct: (
    data: Omit<Product, "id">,
    actor?: { name: string; role: UserRole; photo?: string }
  ) => void;
  updateProduct: (
    id: string,
    patch: Partial<Omit<Product, "id">>,
    actor?: { name: string; role: UserRole; photo?: string; details?: string }
  ) => void;
  deleteProduct: (
    id: string,
    actor?: {
      name: string;
      role: UserRole;
      photo?: string;
      productName?: string;
      details?: string;
    }
  ) => void;
  clearProductLogs: () => void;
  addReview: (data: Omit<CustomerReview, "id" | "date">) => void;
  updateReview: (id: string, patch: Partial<Omit<CustomerReview, "id">>) => void;
  deleteReview: (id: string) => void;
  addEmployee: (data: Omit<Employee, "id" | "joinedAt">) => EmployeeMutationResult;
  updateEmployee: (
    id: string,
    patch: Partial<Omit<Employee, "id" | "joinedAt">>
  ) => EmployeeMutationResult;
  deleteEmployee: (id: string) => void;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  resetData: () => void;
  clearTransactions: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [productLogs, setProductLogs] = useState<ProductAuditLog[]>(INITIAL_PRODUCT_LOGS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initial state intentionally matches the server-rendered mock data so the
  // first client render can hydrate without mismatches. Persisted data is then
  // read once after mount, before any writes are allowed.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reading persisted data after hydration */
    if (typeof window !== "undefined") {
      const obsoleteKeys = [
        "hailai.products.v1",
        "hailai.transactions.v1",
        "hailai.settings.v1",
        "hailai.reviews.v1",
        "hailai.employees.v1",
        "hailai.productLogs.v1",
        "hailai.products.v2",
        "hailai.transactions.v2",
        "hailai.settings.v2",
        "hailai.reviews.v2",
        "hailai.employees.v2",
        "hailai.productLogs.v2",
      ];
      obsoleteKeys.forEach((k) => {
        try {
          window.localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
    }

    const loadedProducts = loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    const prodIdSet = new Set(loadedProducts.map((p) => p.id));
    const mergedProducts = [
      ...loadedProducts,
      ...INITIAL_PRODUCTS.filter((p) => !prodIdSet.has(p.id)),
    ];
    setProducts(migrateProductCatalog(mergedProducts));

    const loadedTransactions = loadFromStorage(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS);
    const trxIdSet = new Set(loadedTransactions.map((t) => t.id));
    const mergedTransactions = [
      ...loadedTransactions,
      ...INITIAL_TRANSACTIONS.filter((t) => !trxIdSet.has(t.id)),
    ];
    setTransactions(mergedTransactions);

    const loadedSettings = loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    setSettings({
      ...loadedSettings,
      useRealtimeDate: loadedSettings.useRealtimeDate ?? true,
    });

    const loadedEmployees = loadFromStorage(STORAGE_KEYS.employees, INITIAL_EMPLOYEES);
    const initialEmpMap = new Map(INITIAL_EMPLOYEES.map((e) => [e.id, e]));
    let mergedEmployees: Employee[] = loadedEmployees.map((e) => {
      const seed = initialEmpMap.get(e.id);
      return {
        ...e,
        photo: e.photo || seed?.photo,
        email: e.email || seed?.email,
        address: e.address || seed?.address,
        birthDate: e.birthDate || seed?.birthDate,
        emergencyContact: e.emergencyContact || seed?.emergencyContact,
        bio: e.bio || seed?.bio,
      };
    });
    // Append any employee from INITIAL_EMPLOYEES missing in loadedEmployees
    for (const seed of INITIAL_EMPLOYEES) {
      if (
        !mergedEmployees.some(
          (e) => e.id === seed.id || e.name.toLowerCase() === seed.name.toLowerCase()
        )
      ) {
        mergedEmployees.push(seed);
      }
    }
    // Ensure Admin (Hailai) exists
    if (!mergedEmployees.some((e) => e.name.toLowerCase() === "hailai")) {
      const adminSeed = INITIAL_EMPLOYEES.find((e) => e.name.toLowerCase() === "hailai");
      if (adminSeed) {
        mergedEmployees = [adminSeed, ...mergedEmployees];
      }
    }
    setEmployees(mergedEmployees);

    // Merge default avatar pictures for reviews that don't have one yet, and append any new reviews
    const loadedReviews = loadFromStorage(STORAGE_KEYS.reviews, INITIAL_REVIEWS);
    const initialAvatarMap = new Map(INITIAL_REVIEWS.map((r) => [r.id, r.avatar]));
    const reviewIdSet = new Set(loadedReviews.map((r) => r.id));
    const mergedReviews = [
      ...loadedReviews.map((r) => {
        if (!r.avatar && initialAvatarMap.has(r.id)) {
          return { ...r, avatar: initialAvatarMap.get(r.id) };
        }
        return r;
      }),
      ...INITIAL_REVIEWS.filter((r) => !reviewIdSet.has(r.id)),
    ];
    setReviews(mergedReviews);

    const loadedLogs = loadFromStorage(STORAGE_KEYS.productLogs, INITIAL_PRODUCT_LOGS);
    const logIdSet = new Set(loadedLogs.map((l) => l.id));
    const mergedLogs = [
      ...loadedLogs,
      ...INITIAL_PRODUCT_LOGS.filter((l) => !logIdSet.has(l.id)),
    ];
    setProductLogs(mergedLogs);

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Load initial data from Firestore and establish realtime sync across all devices
  useEffect(() => {
    let cancelled = false;
    let unsubRealtime: (() => void) | null = null;

    void (async () => {
      if (!hasFirebaseConfig()) {
        setCloudReady(true);
        return;
      }
      const cloud = await cloudLoadAll();
      if (cancelled) return;
      if (cloud !== null) {
        if (cloud.products && cloud.products.length > 0) {
          lastCloudSaved["products"] = JSON.stringify(cloud.products);
          setProducts(migrateProductCatalog(cloud.products));
        }
        if (cloud.transactions && cloud.transactions.length > 0) {
          lastCloudSaved["transactions"] = JSON.stringify(cloud.transactions);
          setTransactions(cloud.transactions);
        }
        if (cloud.employees && cloud.employees.length > 0) {
          lastCloudSaved["employees"] = JSON.stringify(cloud.employees);
          setEmployees(cloud.employees);
        }
        if (cloud.productLogs && cloud.productLogs.length > 0) {
          lastCloudSaved["productLogs"] = JSON.stringify(cloud.productLogs);
          setProductLogs(cloud.productLogs);
        }
        if (cloud.reviews && cloud.reviews.length > 0) {
          const initialAvatarMap = new Map(INITIAL_REVIEWS.map((r) => [r.id, r.avatar]));
          const mapped = cloud.reviews.map((r) => {
            if (!r.avatar && initialAvatarMap.has(r.id)) {
              return { ...r, avatar: initialAvatarMap.get(r.id) };
            }
            return r;
          });
          lastCloudSaved["reviews"] = JSON.stringify(mapped);
          setReviews(mapped);
        }
        if (cloud.settings) {
          lastCloudSaved["settings"] = JSON.stringify(cloud.settings);
          setSettings({
            ...cloud.settings,
            useRealtimeDate: cloud.settings.useRealtimeDate ?? true,
          });
        }
      }
      setCloudReady(true);

      // Realtime listener for cross-device instantaneous sync
      unsubRealtime = subscribeToRealtimeCloud({
        onReviews: (cloudReviews) => {
          if (cancelled) return;
          const initialAvatarMap = new Map(INITIAL_REVIEWS.map((r) => [r.id, r.avatar]));
          const mapped = cloudReviews.map((r) => {
            if (!r.avatar && initialAvatarMap.has(r.id)) {
              return { ...r, avatar: initialAvatarMap.get(r.id) };
            }
            return r;
          });
          lastCloudSaved["reviews"] = JSON.stringify(mapped);
          setReviews(mapped);
        },
        onTransactions: (t) => {
          if (cancelled) return;
          lastCloudSaved["transactions"] = JSON.stringify(t);
          setTransactions(t);
        },
        onProducts: (p) => {
          if (cancelled) return;
          lastCloudSaved["products"] = JSON.stringify(p);
          setProducts(migrateProductCatalog(p));
        },
        onEmployees: (e) => {
          if (cancelled) return;
          lastCloudSaved["employees"] = JSON.stringify(e);
          setEmployees(e);
        },
        onProductLogs: (l) => {
          if (cancelled) return;
          lastCloudSaved["productLogs"] = JSON.stringify(l);
          setProductLogs(l);
        },
      });
    })();

    return () => {
      cancelled = true;
      if (unsubRealtime) unsubRealtime();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.products, products);
    if (!cloudReady) return;
    scheduleCloudSave("products", products);
  }, [products, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.transactions, transactions);
    if (!cloudReady) return;
    scheduleCloudSave("transactions", transactions);
  }, [transactions, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.settings, settings);
    if (!cloudReady) return;
    scheduleCloudSave("settings", settings);
  }, [settings, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.reviews, reviews);
    if (!cloudReady) return;
    scheduleCloudSave("reviews", reviews);
  }, [reviews, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.employees, employees);
    if (!cloudReady) return;
    scheduleCloudSave("employees", employees);
  }, [employees, hydrated, cloudReady]);

  useEffect(() => {
    if (!hydrated) return;
    persistLocal(STORAGE_KEYS.productLogs, productLogs);
    if (!cloudReady) return;
    scheduleCloudSave("productLogs", productLogs);
  }, [productLogs, hydrated, cloudReady]);

  // Apply the user's color theme to the CSS custom properties used by the UI.
  // Runs on mount (after persisted settings load) and whenever the theme changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    applyThemeVars(settings.theme ?? BAKERY_THEME);
  }, [settings?.theme]);

  const addToCart = useCallback(
    (productId: string): boolean => {
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock <= 0) return false;

      let added = true;
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          if (existing.qty >= product.stock) {
            added = false;
            return prev;
          }
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
      return added;
    },
    [products]
  );

  const updateCartQty = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) => {
        const product = products.find((p) => p.id === productId);
        const maxStock = product ? product.stock : Infinity;
        return prev
          .map((i) => {
            if (i.productId !== productId) return i;
            const nextQty = delta > 0 ? Math.min(i.qty + delta, maxStock) : i.qty + delta;
            return { ...i, qty: nextQty };
          })
          .filter((i) => i.qty > 0);
      });
    },
    [products]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const checkout = useCallback(
    (
      method: PaymentMethod,
      cashReceived: number,
      discount?: TransactionDiscount,
      customerMeta?: { customerName?: string; orderedByRole?: UserRole }
    ): CheckoutResult => {
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

      const txDateObj = getEffectiveWorkingDate(settings);
      const yy = String(txDateObj.getFullYear()).slice(-2);
      const mm = String(txDateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(txDateObj.getDate()).padStart(2, "0");
      const prefix = `TRX-${yy}${mm}${dd}-`;

      const todayMaxSeq = transactions.reduce((max, t) => {
        if (t.id.startsWith(prefix)) {
          const seq = parseInt(t.id.replace(prefix, ""), 10);
          return Number.isFinite(seq) ? Math.max(max, seq) : max;
        }
        return max;
      }, 0);

      const transaction: Transaction = {
        id: generateTransactionId(todayMaxSeq + 1, txDateObj),
        date: txDateObj.toISOString(),
        customerName: customerMeta?.customerName,
        orderedByRole: customerMeta?.orderedByRole,
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
      void cloudSaveDoc("transactions", transaction.id, transaction);
      setCart([]);
      return { ok: true, transaction };
    },
    [cart, products, settings, transactions]
  );

  const addProduct = useCallback(
    (
      data: Omit<Product, "id">,
      actor?: { name: string; role: UserRole; photo?: string }
    ) => {
      let createdId = "P01";
      setProducts((prev) => {
        const nextSeq = prev.reduce((max, p) => {
          const n = parseInt(p.id.replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0);
        createdId = `P${String(nextSeq + 1).padStart(2, "0")}`;
        return [{ ...data, id: createdId }, ...prev];
      });

      if (actor) {
        const log: ProductAuditLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: new Date().toISOString(),
          action: "tambah",
          productId: createdId,
          productName: data.name,
          actorName: actor.name,
          actorRole: actor.role,
          actorPhoto: actor.photo,
          details: `Menambahkan produk baru "${data.name}" (${data.category}, Stok: ${data.stock} pcs, Harga: Rp ${data.price.toLocaleString("id-ID")})`,
          newData: data,
        };
        setProductLogs((prev) => [log, ...prev]);
      }
    },
    []
  );

  const updateProduct = useCallback(
    (
      id: string,
      patch: Partial<Omit<Product, "id">>,
      actor?: { name: string; role: UserRole; photo?: string; details?: string }
    ) => {
      let targetName = "";
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            targetName = patch.name || p.name;
            return { ...p, ...patch };
          }
          return p;
        })
      );

      if (actor) {
        const log: ProductAuditLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: new Date().toISOString(),
          action: "edit",
          productId: id,
          productName: targetName || patch.name || id,
          actorName: actor.name,
          actorRole: actor.role,
          actorPhoto: actor.photo,
          details: actor.details || `Memperbarui data produk "${targetName || patch.name || id}"`,
          newData: patch,
        };
        setProductLogs((prev) => [log, ...prev]);
      }
    },
    []
  );

  const deleteProduct = useCallback(
    (
      id: string,
      actor?: {
        name: string;
        role: UserRole;
        photo?: string;
        productName?: string;
        details?: string;
      }
    ) => {
      let removedName = actor?.productName || "";
      setProducts((prev) => {
        const found = prev.find((p) => p.id === id);
        if (found && !removedName) removedName = found.name;
        return prev.filter((p) => p.id !== id);
      });
      setCart((prev) => prev.filter((i) => i.productId !== id));

      if (actor) {
        const log: ProductAuditLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: new Date().toISOString(),
          action: "hapus",
          productId: id,
          productName: removedName || id,
          actorName: actor.name,
          actorRole: actor.role,
          actorPhoto: actor.photo,
          details: actor.details || `Menghapus produk "${removedName || id}" dari stok katalog`,
        };
        setProductLogs((prev) => [log, ...prev]);
      }
    },
    []
  );

  const clearProductLogs = useCallback(() => {
    setProductLogs([]);
  }, []);

  const addReview = useCallback((data: Omit<CustomerReview, "id" | "date">) => {
    setReviews((prev) => {
      const nextSeq = prev.reduce((max, r) => {
        const n = parseInt(r.id.replace(/\D/g, ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const id = `R${String(nextSeq + 1).padStart(2, "0")}`;
      const newReview = { ...data, id, date: new Date().toISOString() };
      void cloudSaveDoc("reviews", id, newReview);
      return [newReview, ...prev];
    });
  }, []);

  const updateReview = useCallback(
    (id: string, patch: Partial<Omit<CustomerReview, "id">>) => {
      setReviews((prev) => {
        const target = prev.find((r) => r.id === id);
        if (target) {
          const updated = { ...target, ...patch };
          void cloudSaveDoc("reviews", id, updated);
        }
        return prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      });
    },
    []
  );

  const deleteReview = useCallback((id: string) => {
    void cloudDeleteDoc("reviews", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addEmployee = useCallback(
    (data: Omit<Employee, "id" | "joinedAt">): EmployeeMutationResult => {
      const cleanName = data.name.trim();
      if (!cleanName) {
        return { ok: false, error: "Nama karyawan wajib diisi." };
      }
      const duplicate = employees.some(
        (e) => e.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        return { ok: false, error: `Karyawan dengan nama "${cleanName}" sudah terdaftar.` };
      }
      setEmployees((prev) => {
        const nextSeq = prev.reduce((max, e) => {
          const n = parseInt(e.id.replace(/\D/g, ""), 10);
          return Number.isNaN(n) ? max : Math.max(max, n);
        }, 0);
        const id = `E${String(nextSeq + 1).padStart(2, "0")}`;
        return [
          {
            ...data,
            name: cleanName,
            id,
            joinedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
      return { ok: true };
    },
    [employees]
  );

  const updateEmployee = useCallback(
    (
      id: string,
      patch: Partial<Omit<Employee, "id" | "joinedAt">>
    ): EmployeeMutationResult => {
      if (patch.name !== undefined) {
        const cleanName = patch.name.trim();
        if (!cleanName) {
          return { ok: false, error: "Nama karyawan wajib diisi." };
        }
        const duplicate = employees.some(
          (e) => e.id !== id && e.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) {
          return { ok: false, error: `Karyawan dengan nama "${cleanName}" sudah terdaftar.` };
        }
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                ...patch,
                name: patch.name !== undefined ? patch.name.trim() : e.name,
              }
            : e
        )
      );
      return { ok: true };
    },
    [employees]
  );

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetData = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setProductLogs(INITIAL_PRODUCT_LOGS);
    setSettings(DEFAULT_SETTINGS);
    setReviews(INITIAL_REVIEWS);
    setEmployees(INITIAL_EMPLOYEES);
    setCart([]);
  }, []);

  const clearTransactions = useCallback(() => setTransactions([]), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      transactions,
      productLogs,
      cart,
      settings,
      reviews,
      employees,
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
      clearProductLogs,
      addReview,
      updateReview,
      deleteReview,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      updateSettings,
      resetData,
      clearTransactions,
    }),
    [
      products,
      transactions,
      productLogs,
      cart,
      settings,
      reviews,
      employees,
      hydrated,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      checkout,
      addProduct,
      updateProduct,
      deleteProduct,
      clearProductLogs,
      addReview,
      updateReview,
      deleteReview,
      addEmployee,
      updateEmployee,
      deleteEmployee,
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
