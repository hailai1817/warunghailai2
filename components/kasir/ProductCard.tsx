"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, ShoppingBasket } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import { FALLBACK_IMAGE } from "@/lib/mock-data";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  product: Product;
  inCartQty: number;
  onAdd: (id: string) => void;
}

const CATEGORY_BADGE: Record<Product["category"], "amber" | "terracotta" | "choco" | "green"> = {
  "Roti Manis": "amber",
  Pastry: "terracotta",
  Cake: "choco",
  Minuman: "green",
};

export default function ProductCard({ product, inCartQty, onAdd }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const status = getStockStatus(product.stock);
  const outOfStock = status === "Habis";
  const isMaxInCart = inCartQty >= product.stock;
  const isActionDisabled = outOfStock || isMaxInCart;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-crust)]/40">
        <Image
          src={imgError ? FALLBACK_IMAGE : product.image || FALLBACK_IMAGE}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1536px) 50vw, 33vw"
          unoptimized
          onError={() => setImgError(true)}
          className={`object-cover transition duration-300 group-hover:scale-105 ${
            outOfStock ? "grayscale" : ""
          }`}
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          <Badge variant={CATEGORY_BADGE[product.category]}>{product.category}</Badge>
        </div>
        <div className="absolute right-2 top-2">
          {outOfStock ? (
            <Badge variant="red">Stok Habis</Badge>
          ) : status === "Hampir Habis" ? (
            <Badge variant="yellow">Sisa {product.stock}</Badge>
          ) : (
            <Badge variant="green">In Stock</Badge>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-stone-900/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-800">
            {product.name}
          </h3>
          {inCartQty > 0 && (
            <Badge variant="cream">
              <ShoppingBasket className="h-3 w-3" />
              {inCartQty}
            </Badge>
          )}
        </div>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-base font-extrabold text-[var(--color-terracotta)]">
            {formatRupiah(product.price)}
          </p>
          <button
            onClick={() => onAdd(product.id)}
            disabled={isActionDisabled}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              isActionDisabled
                ? "cursor-not-allowed bg-stone-100 text-stone-400"
                : "bg-gradient-to-r from-amber-500 to-[var(--color-terracotta)] text-white shadow hover:opacity-90 active:scale-95"
            }`}
          >
            <Plus className="h-4 w-4" />
            {outOfStock ? "Habis" : isMaxInCart ? "Maksimal" : inCartQty > 0 ? "Tambah Lagi" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
