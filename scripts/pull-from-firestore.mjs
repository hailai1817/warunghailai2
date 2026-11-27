import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "node:fs";

const firebaseConfig = {
  apiKey: "AIzaSyAQ7JJkh1Zb2EU63KXawSfU2uhHZ5gqLV4",
  authDomain: "webwarung-hailai.firebaseapp.com",
  projectId: "webwarung-hailai",
  storageBucket: "webwarung-hailai.firebasestorage.app",
  messagingSenderId: "260787210326",
  appId: "1:260787210326:web:4a756dc3f22a2a3f7753f7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateSeedFromFirestore() {
  console.log("Pulling current data from Firestore...");

  const [pSnap, tSnap, rSnap, eSnap, lSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "transactions")),
    getDocs(collection(db, "reviews")),
    getDocs(collection(db, "employees")),
    getDocs(collection(db, "productLogs")),
  ]);

  const products = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  products.sort((a, b) => a.id.localeCompare(b.id));

  const transactions = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const reviews = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const employees = eSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  employees.sort((a, b) => a.id.localeCompare(b.id));

  const productLogs = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  productLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log(`Pulled ${products.length} products, ${transactions.length} transactions, ${reviews.length} reviews, ${employees.length} employees, ${productLogs.length} logs.`);

  const mockDataContent = `import type {
  CustomerReview,
  Employee,
  Product,
  ProductAuditLog,
  StoreSettings,
  Transaction,
} from "./types";
import { DEFAULT_IMAGE } from "./constants";
import { BAKERY_THEME } from "./color";

const img = (id: string) => \`https://images.unsplash.com/\${id}?auto=format&fit=crop&w=800&q=80\`;

export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

export function migrateProductCatalog(products: Product[]): Product[] {
  const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

  const obsoleteImageMap: Record<string, string> = {
    "photo-1607252650355-f7fd0460ccdb": img("photo-1627308592814-f88b68f7b4a1"),
    "photo-1565958011703-44f9829ba187": img("photo-1779608993337-fc83f391bbed"),
    "photo-1517433670267-08bbd4be890f": img("photo-1756137943964-dd49bc77640e"),
    "photo-1574085733277-851d9d856a3a": img("photo-1761746351221-5218b3ba23f0"),
    "photo-1517701550927-30cf4ba1dba5": img("photo-1581996323441-538096e854b9"),
    "photo-1544787219-7f47ccb76574": img("photo-1556679343-c7306c1976bc"),
    "photo-1551024601-bec78aea704b": img("photo-1677412627540-05bfbb819caf"),
    "photo-1549931319-a545dcf3bc73": img("photo-1612827788868-c8632040ab64"),
  };

  return products.map((product) => {
    const seed = initialMap.get(product.id);
    if (seed && (!product.image || product.image.trim() === "")) {
      return { ...product, image: seed.image };
    }

    if (product.id === "P01" && product.image && product.image.includes("photo-1509440159596-0249088772ff")) {
      return { ...product, image: img("photo-1509365465985-25d11c17e812") };
    }

    if (product.id === "P02" && product.image && product.image.includes("photo-1555507036-ab1f4038808a")) {
      return { ...product, image: img("photo-1468577760773-139c2f1c335f") };
    }

    for (const [oldId, newUrl] of Object.entries(obsoleteImageMap)) {
      if (product.image && product.image.includes(oldId)) {
        return { ...product, image: newUrl };
      }
    }

    return product;
  });
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "HaiLai's Bakery and Cafe",
  address: "Jl. Melati Raya No. 88, Bandung",
  phone: "(022) 555-1234",
  taxRate: 10,
  receiptFooter: "Terima kasih sudah berbelanja di HaiLai's Bakery and Cafe. Sampai jumpa kembali!",
  discountPresets: [5, 10, 15, 20, 25],
  theme: BAKERY_THEME,
};

export const INITIAL_TRANSACTIONS: Transaction[] = ${JSON.stringify(transactions, null, 2)};

export const FALLBACK_IMAGE = DEFAULT_IMAGE;

export const INITIAL_REVIEWS: CustomerReview[] = ${JSON.stringify(reviews, null, 2)};

export const INITIAL_EMPLOYEES: Employee[] = ${JSON.stringify(employees, null, 2)};

export const INITIAL_PRODUCT_LOGS: ProductAuditLog[] = ${JSON.stringify(productLogs, null, 2)};
`;

  fs.writeFileSync("C:/Users/TEFA/.gemini/antigravity/worktrees/web-warungHaiLai/update_halo_integration/lib/mock-data.ts", mockDataContent, "utf8");
  console.log("Updated lib/mock-data.ts successfully with live Firestore data!");
}

updateSeedFromFirestore().catch(console.error);
