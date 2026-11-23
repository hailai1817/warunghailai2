"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/format";
import { getStockStatus, getTotalStock, LOW_STOCK_THRESHOLD } from "@/lib/stock";
import { FALLBACK_IMAGE } from "@/lib/mock-data";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ProductFormModal from "./ProductFormModal";

type CategoryFilter = "Semua" | Category;

function ProductTableThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const target = failed || !src ? FALLBACK_IMAGE : src;

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
      <Image
        src={target}
        alt={alt}
        fill
        sizes="40px"
        unoptimized
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

const STATUS_STYLE = {
  Aman: { variant: "green" as const, dot: "bg-emerald-500" },
  "Hampir Habis": { variant: "yellow" as const, dot: "bg-yellow-500" },
  Habis: { variant: "red" as const, dot: "bg-red-500" },
};

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: number[] = [];
  pages.push(1);
  if (current > 3) {
    pages.push(-1);
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push(-1);
  }
  pages.push(total);
  return pages;
}

export default function InventoryView() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("Semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [prevQuery, setPrevQuery] = useState({ search, filter, pageSize });

  if (
    prevQuery.search !== search ||
    prevQuery.filter !== filter ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({ search, filter, pageSize });
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q);
      const matchCat = filter === "Semua" || p.category === filter;
      return matchQuery && matchCat;
    });
  }, [products, search, filter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedProducts = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const stats = useMemo(() => {
    const low = products.filter((p) => getStockStatus(p.stock) === "Hampir Habis").length;
    const out = products.filter((p) => getStockStatus(p.stock) === "Habis").length;
    return { total: products.length, stock: getTotalStock(products), low, out };
  }, [products]);

  const handleSave = (data: Omit<Product, "id">) => {
    if (editing) {
      updateProduct(editing.id, data);
    } else {
      addProduct(data);
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Produk"
          value={stats.total}
          icon={<Package className="h-6 w-6" />}
          accent="amber"
          hint="produk terdaftar"
        />
        <StatCard
          label="Total Stok"
          value={stats.stock.toLocaleString("id-ID")}
          icon={<Boxes className="h-6 w-6" />}
          accent="choco"
          hint="pcs tersedia"
        />
        <StatCard
          label="Hampir Habis"
          value={stats.low}
          icon={<AlertTriangle className="h-6 w-6" />}
          accent="yellow"
          hint={`stok di bawah ${LOW_STOCK_THRESHOLD} pcs`}
        />
        <StatCard
          label="Stok Habis"
          value={stats.out}
          icon={<XCircle className="h-6 w-6" />}
          accent="red"
          hint="perlu restock"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / ID produk..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CategoryFilter)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
        >
          <PackagePlus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-bold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-center">Stok</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedProducts.map((product) => {
                const status = getStockStatus(product.stock);
                const style = STATUS_STYLE[status];
                return (
                  <tr
                    key={product.id}
                    className={`transition hover:bg-amber-50/40 ${
                      status === "Hampir Habis" ? "bg-yellow-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-stone-500">
                      {product.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductTableThumbnail src={product.image} alt={product.name} />
                        <div>
                          <p className="font-bold text-stone-800">{product.name}</p>
                          {product.description && (
                            <p className="max-w-[220px] truncate text-xs text-stone-400">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.barcode ? (
                        <span className="font-mono text-xs font-semibold text-[var(--color-caramel)]">
                          {product.barcode}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="cream">{product.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-stone-800">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-1 text-sm font-extrabold tabular-nums ${
                          status === "Habis"
                            ? "bg-red-100 text-red-700"
                            : status === "Hampir Habis"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={style.variant}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditing(product);
                            setFormOpen(true);
                          }}
                          aria-label={`Edit ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(product)}
                          aria-label={`Hapus ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-7 w-7" />}
              title="Tidak ada produk"
              description="Belum ada produk yang cocok dengan pencarian. Tambahkan produk baru untuk mulai."
              action={
                <button
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-terracotta)] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </button>
              }
            />
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-stone-200/80 bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
              <span>
                Menampilkan <b>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</b> dari <b>{totalItems}</b> produk
              </span>
              <span className="hidden text-stone-300 sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-bold text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
                >
                  <option value={5}>5 produk</option>
                  <option value={8}>8 produk</option>
                  <option value={10}>10 produk</option>
                  <option value={15}>15 produk</option>
                  <option value={20}>20 produk</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  title="Halaman Pertama"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  title="Halaman Sebelumnya"
                  className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) =>
                    p === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                          safeCurrentPage === p
                            ? "bg-[var(--color-terracotta)] text-white shadow-sm"
                            : "border border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  title="Halaman Berikutnya"
                  className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  title="Halaman Terakhir"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {formOpen && (
        <ProductFormModal
          key={editing?.id ?? "new"}
          product={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus Produk"
        message={`Produk "${deleting?.name}" akan dihapus permanen dari katalog dan stok. Lanjutkan?`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteProduct(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
