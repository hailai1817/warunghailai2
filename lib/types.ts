export type Category = "Roti Manis" | "Pastry" | "Cake" | "Minuman";

export const CATEGORIES: Category[] = ["Roti Manis", "Pastry", "Cake", "Minuman"];

export type PaymentMethod = "Tunai" | "QRIS" | "Kartu Debit";

export const PAYMENT_METHODS: PaymentMethod[] = ["Tunai", "QRIS", "Kartu Debit"];

export type DiscountType = "percent" | "nominal";

export interface TransactionDiscount {
  type: DiscountType;
  value: number;
  amount: number;
}

export type StockStatus = "Aman" | "Hampir Habis" | "Habis";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  image: string;
  barcode?: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  qty: number;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: TransactionItem[];
  subtotal: number;
  discount?: number;
  discountType?: DiscountType;
  discountValue?: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  change: number;
}

export interface ColorTheme {
  id: string;
  primary: string;
  secondary: string;
  dark: string;
  bg: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  taxRate: number;
  receiptFooter: string;
  workingDate?: string;
  discountPresets?: number[];
  theme?: ColorTheme;
}

export type CheckoutResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string };

export interface CustomerReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export type ViewKey = "kasir" | "stok" | "laporan" | "ulasan" | "pengaturan";
