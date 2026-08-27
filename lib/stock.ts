import type { Product, StockStatus } from "./types";

export const LOW_STOCK_THRESHOLD = 5;

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "Habis";
  if (stock < LOW_STOCK_THRESHOLD) return "Hampir Habis";
  return "Aman";
}

export function getTotalStock(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.stock, 0);
}
