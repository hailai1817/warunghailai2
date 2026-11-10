import type { CustomerReview, Employee, Product, StoreSettings, Transaction, PaymentMethod } from "./types";
import { DEFAULT_IMAGE } from "./constants";
import { BAKERY_THEME } from "./color";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const avatarImg = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&q=80`;

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "P01",
    name: "Roti Sobek Coklat",
    category: "Roti Manis",
    price: 18000,
    stock: 24,
    image: img("photo-1509365465985-25d11c17e812"),
    description: "Roti sobek lembut isi coklat meleleh, pilihan favorit keluarga.",
  },
  {
    id: "P02",
    name: "Roti Manis Selai Stroberi",
    category: "Roti Manis",
    price: 15000,
    stock: 3,
    image: img("photo-1468577760773-139c2f1c335f"),
    description: "Roti manis klasik dengan selai stroberi premium.",
  },
  {
    id: "P03",
    name: "Roti Isi Coklat Keju",
    category: "Roti Manis",
    price: 17000,
    stock: 12,
    image: img("photo-1612827788868-c8632040ab64"),
    description: "Perpaduan coklat dan keju di dalam roti empuk.",
  },
  {
    id: "P04",
    name: "Donat Gula",
    category: "Roti Manis",
    price: 12000,
    stock: 0,
    image: img("photo-1677412627540-05bfbb819caf"),
    description: "Donat tabur gula halus yang ringan dan manis.",
  },
  {
    id: "P05",
    name: "Croissant Butter",
    category: "Pastry",
    price: 22000,
    stock: 18,
    image: img("photo-1555507036-ab1f4038808a"),
    description: "Croissant berlapis mentega Prancis, renyah di luar.",
  },
  {
    id: "P06",
    name: "Danish Almond",
    category: "Pastry",
    price: 25000,
    stock: 8,
    image: img("photo-1756137943964-dd49bc77640e"),
    description: "Pastry Denmark dengan topping kacang almond panggang.",
  },
  {
    id: "P07",
    name: "Choco Bun Filling",
    category: "Pastry",
    price: 20000,
    stock: 14,
    image: img("photo-1681218424681-b4f8228ecea9"),
    description: "Bun coklat dengan isian creamy khas bakery.",
  },
  {
    id: "P08",
    name: "Chocolate Layer Cake",
    category: "Cake",
    price: 32000,
    stock: 6,
    image: img("photo-1606313564200-e75d5e30476c"),
    description: "Slice cake coklat berlapis dengan ganache pekat.",
  },
  {
    id: "P09",
    name: "Red Velvet Cupcake",
    category: "Cake",
    price: 18000,
    stock: 2,
    image: img("photo-1761746351221-5218b3ba23f0"),
    description: "Cupcake red velvet dengan cream cheese frosting.",
  },
  {
    id: "P10",
    name: "Birthday Cake 1kg",
    category: "Cake",
    price: 350000,
    stock: 4,
    image: img("photo-1535141192574-5d4897c12636"),
    description: "Kue ulang tahun ukuran 1kg, custom sesuai pesanan.",
  },
  {
    id: "P11",
    name: "Iced Americano",
    category: "Minuman",
    price: 18000,
    stock: 30,
    image: img("photo-1581996323441-538096e854b9"),
    description: "Espresso dingin menyegarkan tanpa gula.",
  },
  {
    id: "P12",
    name: "Es Teh Melati",
    category: "Minuman",
    price: 12000,
    stock: 5,
    image: img("photo-1556679343-c7306c1976bc"),
    description: "Teh melati dingin dengan aroma wangi bunga.",
  },
  {
    id: "P13",
    name: "Cappuccino Hangat",
    category: "Minuman",
    price: 22000,
    stock: 16,
    image: img("photo-1509042239860-f550ce710b93"),
    description: "Cappuccino hangat dengan foam susu yang lembut.",
  },
  {
    id: "P14",
    name: "Macha Cakeroll",
    category: "Cake",
    price: 50000,
    stock: 10,
    barcode: "8990037282383",
    image: img("photo-1627308592814-f88b68f7b4a1"),
    description: "Cake roll rasa macha lembut dengan krim hijau khas Jepang.",
  },
  {
    id: "P15",
    name: "Mango Cake",
    category: "Cake",
    price: 30000,
    stock: 8,
    barcode: "202506140043",
    image: img("photo-1779608993337-fc83f391bbed"),
    description: "Cake mangga segar dengan topping buah mangga matang.",
  },
  {
    id: "P16",
    name: "Pure Milk",
    category: "Minuman",
    price: 12000,
    stock: 20,
    barcode: "6975830562186",
    image: img("photo-1550583724-b2692b85b150"),
    description: "Susu murni dingin yang creamy dan menyegarkan.",
  },
];

/**
 * Migrates old/mismatched default product images to accurate ones.
 * Backfills cached client localStorage or Firestore documents seamlessly.
 */
export function migrateProductCatalog(products: Product[]): Product[] {
  const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

  // Obsolete/mismatched Unsplash IDs mapping
  const obsoleteImageMap: Record<string, string> = {
    "photo-1607252650355-f7fd0460ccdb": img("photo-1627308592814-f88b68f7b4a1"), // Android mascot -> Matcha roll
    "photo-1565958011703-44f9829ba187": img("photo-1779608993337-fc83f391bbed"), // Raspberry -> Mango cake
    "photo-1517433670267-08bbd4be890f": img("photo-1756137943964-dd49bc77640e"), // Storefront -> Danish Almond
    "photo-1574085733277-851d9d856a3a": img("photo-1761746351221-5218b3ba23f0"), // Black Forest -> Red Velvet
    "photo-1517701550927-30cf4ba1dba5": img("photo-1581996323441-538096e854b9"), // Milk latte -> Iced Americano
    "photo-1544787219-7f47ccb76574": img("photo-1556679343-c7306c1976bc"), // Hot tea mug -> Es Teh Melati
    "photo-1551024601-bec78aea704b": img("photo-1677412627540-05bfbb819caf"), // Dark chocolate -> Donat Gula
    "photo-1549931319-a545dcf3bc73": img("photo-1612827788868-c8632040ab64"), // Sourdough -> Roti Coklat Keju
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

const productById = (id: string): Product => {
  const p = INITIAL_PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Product not found: ${id}`);
  return p;
};

interface SeedItem {
  id: string;
  qty: number;
}

const TAX_RATE = 10;

function makeTransaction(
  seq: number,
  dayOffset: number,
  hour: number,
  minute: number,
  items: SeedItem[],
  method: PaymentMethod,
  discountPercent = 0
): Transaction {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(hour, minute, 0, 0);

  const lineItems = items.map((item) => {
    const p = productById(item.id);
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: item.qty,
      subtotal: p.price * item.qty,
    };
  });

  const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * TAX_RATE) / 100);
  const total = taxable + tax;
  const cashReceived = method === "Tunai" ? Math.ceil(total / 50000) * 50000 : total;

  return {
    id: `TRX-${date.toISOString().slice(2, 10).replace(/-/g, "")}-${String(seq).padStart(4, "0")}`,
    date: date.toISOString(),
    items: lineItems,
    subtotal,
    discount: discount > 0 ? discount : undefined,
    discountType: discount > 0 ? "percent" : undefined,
    discountValue: discount > 0 ? discountPercent : undefined,
    tax,
    total,
    paymentMethod: method,
    cashReceived,
    change: cashReceived - total,
  };
}

export const INITIAL_TRANSACTIONS: Transaction[] = [
  makeTransaction(1, 0, 9, 12, [{ id: "P05", qty: 2 }, { id: "P13", qty: 1 }], "Tunai"),
  makeTransaction(2, 0, 13, 45, [{ id: "P08", qty: 1 }, { id: "P11", qty: 2 }, { id: "P12", qty: 1 }], "QRIS", 10),
  makeTransaction(3, 1, 10, 30, [{ id: "P01", qty: 3 }, { id: "P03", qty: 2 }], "Tunai"),
  makeTransaction(4, 1, 16, 5, [{ id: "P10", qty: 1 }, { id: "P09", qty: 4 }], "Kartu Debit"),
  makeTransaction(5, 2, 11, 20, [{ id: "P06", qty: 2 }, { id: "P13", qty: 2 }], "Tunai"),
  makeTransaction(6, 3, 8, 55, [{ id: "P07", qty: 3 }, { id: "P11", qty: 1 }], "QRIS"),
  makeTransaction(7, 3, 15, 40, [{ id: "P02", qty: 5 }, { id: "P12", qty: 2 }], "Tunai", 15),
  makeTransaction(8, 5, 14, 10, [{ id: "P08", qty: 2 }, { id: "P01", qty: 2 }, { id: "P13", qty: 1 }], "Kartu Debit"),
];

export const FALLBACK_IMAGE = DEFAULT_IMAGE;

function reviewDate(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: "R01",
    customerName: "Siti Rahayu",
    rating: 5,
    avatar: avatarImg("photo-1544005313-94ddf0286df2"),
    comment: "Roti sobek coklatnya lembut banget dan isinya melimpah. Anak-anak sampai minta lagi!",
    date: reviewDate(0, 11, 24),
  },
  {
    id: "R02",
    customerName: "Budi Santoso",
    rating: 4,
    avatar: avatarImg("photo-1507003211169-0a1dd7228f2d"),
    comment: "Croissant butter-nya renyah dan wangi. Harga masih wajar untuk kualitas sebaik ini.",
    date: reviewDate(1, 15, 40),
  },
  {
    id: "R03",
    customerName: "Dewi Lestari",
    rating: 5,
    avatar: avatarImg("photo-1494790108377-be9c29b29330"),
    comment: "Birthday cake custom-nya cantik dan tidak terlalu manis. Pelayanannya ramah dan tepat waktu.",
    date: reviewDate(2, 10, 5),
  },
  {
    id: "R04",
    customerName: "Andi Wijaya",
    rating: 3,
    avatar: avatarImg("photo-1500648767791-00dcc994a43e"),
    comment: "Iced americanonya enak, tapi antriannya lumayan lama pas jam makan siang.",
    date: reviewDate(3, 13, 15),
  },
  {
    id: "R05",
    customerName: "Maya Anggraini",
    rating: 5,
    avatar: avatarImg("photo-1534528741775-53994a69daeb"),
    comment: "Es teh melatinya segar dan cocok buat nemenin ngobrol sore. Recomended!",
    date: reviewDate(4, 16, 50),
  },
  {
    id: "R06",
    customerName: "Rizky Pratama",
    rating: 2,
    avatar: avatarImg("photo-1519085360753-af0119f7cbe7"),
    comment: "Donat gulanya stok habis terus setiap kali saya datang. Semoga sering di-restock.",
    date: reviewDate(5, 9, 30),
    adminReply: "Terima kasih masukannya Kak Rizky! Jadwal produksi Donat Gula sudah kami tambah pagi & sore supaya selalu tersedia.",
    adminReplyBy: "Admin HaiLai",
    adminReplyDate: reviewDate(5, 11, 15),
  },
  {
    id: "R07",
    customerName: "Nurul Hidayah",
    rating: 5,
    avatar: avatarImg("photo-1438761681033-6461ffad8d80"),
    comment: "Red velvet cupcake-nya juara, cream cheese frosting-nya pas banget. Pasti balik lagi!",
    date: reviewDate(6, 14, 20),
  },
  {
    id: "R08",
    customerName: "Fajar Nugroho",
    rating: 4,
    avatar: avatarImg("photo-1506794778202-cad84cf45f1d"),
    comment: "Kemasan bagus, roti tetap segar sampai rumah. Semoga ke depannya ada varian baru.",
    date: reviewDate(7, 12, 10),
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "E01",
    name: "Rina Kusuma",
    position: "Kasir Utama",
    shift: "Pagi (07:00 - 15:00)",
    phone: "0812-3456-7890",
    active: true,
    joinedAt: reviewDate(30, 8, 0),
  },
  {
    id: "E02",
    name: "Bagas Pratama",
    position: "Kasir & Barista",
    shift: "Sore (14:00 - 22:00)",
    phone: "0813-9876-5432",
    active: true,
    joinedAt: reviewDate(15, 9, 0),
  },
  {
    id: "E03",
    name: "Tika Wulandari",
    position: "Kasir",
    shift: "Pagi (07:00 - 15:00)",
    phone: "0857-2233-4455",
    active: false,
    joinedAt: reviewDate(45, 8, 30),
  },
];
