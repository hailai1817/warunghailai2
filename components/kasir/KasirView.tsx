"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBasket } from "lucide-react";
import type { Category, Transaction } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/format";
import ProductCard from "./ProductCard";
import CartPanel from "./CartPanel";
import ReceiptModal from "./ReceiptModal";
import EmptyState from "@/components/ui/EmptyState";

type CategoryFilter = "Semua" | Category;

export default function KasirView() {
  const { products, cart, addToCart } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("Semua");
  const [cartOpen, setCartOpen] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((i) => map.set(i.productId, i.qty));
    return map;
  }, [cart]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchCat = filter === "Semua" || p.category === filter;
      return matchQuery && matchCat;
    });
  }, [products, search, filter]);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1">
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk roti, kue, atau minuman..."
                className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-700 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[var(--color-terracotta)] focus:ring-2 focus:ring-[var(--color-terracotta)]/20"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["Semua", ...CATEGORIES] as CategoryFilter[]).map((cat) => {
                const active = filter === cat;
                const count =
                  cat === "Semua"
                    ? products.length
                    : products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow"
                        : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                    }`}
                  >
                    {cat} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-7 w-7" />}
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau pilih kategori lain."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCartQty={cartQtyMap.get(product.id) ?? 0}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-[400px] shrink-0 border-l border-stone-200 bg-white lg:block">
        <CartPanel onSuccess={(t) => setReceipt(t)} />
      </div>

      <div className="no-print fixed inset-x-0 bottom-16 z-20 px-4 lg:hidden">
        <button
          onClick={() => setCartOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-[var(--color-choco)] px-4 py-3 text-white shadow-xl shadow-stone-300"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ShoppingBasket className="h-5 w-5 text-amber-300" />
            Keranjang ({cartCount})
          </span>
          <span className="text-sm font-extrabold tabular-nums text-amber-300">
            {formatRupiah(cartTotal)}
          </span>
        </button>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-stone-900/60" onClick={() => setCartOpen(false)} aria-hidden />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex-1 overflow-y-auto">
              <CartPanel onClose={() => setCartOpen(false)} onSuccess={(t) => { setCartOpen(false); setReceipt(t); }} />
            </div>
          </div>
        </div>
      )}

      <ReceiptModal transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
