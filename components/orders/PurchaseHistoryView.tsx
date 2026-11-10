"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  History,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  ShoppingBasket,
} from "lucide-react";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatDateTime, formatRupiah } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import ReceiptModal from "@/components/kasir/ReceiptModal";

interface PurchaseHistoryViewProps {
  onGoToMenu: () => void;
}

const METHOD_BADGE: Record<PaymentMethod, "terracotta" | "amber" | "choco"> = {
  Tunai: "terracotta",
  QRIS: "amber",
  "Kartu Debit": "choco",
};

export default function PurchaseHistoryView({ onGoToMenu }: PurchaseHistoryViewProps) {
  const { user } = useAuth();
  const { transactions } = useStore();
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const myTransactions = useMemo(() => {
    if (!user) return [];
    const targetName = user.name.trim().toLowerCase();
    return transactions
      .filter((t) => (t.customerName ?? "").trim().toLowerCase() === targetName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myTransactions;
    return myTransactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [myTransactions, search]);

  const totalSpent = useMemo(
    () => myTransactions.reduce((sum, t) => sum + t.total, 0),
    [myTransactions]
  );

  const totalItemsPurchased = useMemo(
    () =>
      myTransactions.reduce(
        (sum, t) => sum + t.items.reduce((itemSum, i) => itemSum + i.qty, 0),
        0
      ),
    [myTransactions]
  );

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pesanan Saya"
          value={myTransactions.length}
          icon={<Receipt className="h-6 w-6" />}
          accent="terracotta"
          hint={`atas nama ${user?.name ?? "Pelanggan"}`}
        />
        <StatCard
          label="Total Produk Dibeli"
          value={totalItemsPurchased}
          icon={<ShoppingBag className="h-6 w-6" />}
          accent="amber"
          hint="pcs roti, kue & minuman"
        />
        <StatCard
          label="Total Belanja Saya"
          value={formatRupiah(totalSpent)}
          icon={<History className="h-6 w-6" />}
          accent="green"
          hint="termasuk pajak"
        />
      </div>

      {myTransactions.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor nota atau nama produk..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            />
          </div>
          <button
            onClick={onGoToMenu}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            <ShoppingBasket className="h-4 w-4" />
            Pesan Lagi
          </button>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((t) => {
            const MethodIcon =
              t.paymentMethod === "Tunai"
                ? Banknote
                : t.paymentMethod === "QRIS"
                  ? QrCode
                  : CreditCard;

            return (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-dashed border-stone-200 pb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-[var(--color-terracotta)]">
                        {t.id}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {formatDateTime(t.date)}
                      </p>
                    </div>
                    <Badge variant={METHOD_BADGE[t.paymentMethod]}>
                      <MethodIcon className="h-3 w-3" />
                      {t.paymentMethod}
                    </Badge>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-sm">
                    {t.items.map((item) => (
                      <li
                        key={`${t.id}-${item.productId}`}
                        className="flex items-center justify-between gap-2 text-stone-700"
                      >
                        <span className="truncate">
                          <span className="font-bold text-stone-800">
                            {item.qty}×
                          </span>{" "}
                          {item.name}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-stone-600">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      Total Pembayaran
                    </p>
                    <p className="text-base font-extrabold tabular-nums text-stone-900">
                      {formatRupiah(t.total)}
                    </p>
                  </div>
                  <button
                    onClick={() => setReceipt(t)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Lihat Struk
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Receipt className="h-7 w-7" />}
          title={
            myTransactions.length === 0
              ? `Belum ada riwayat pembelian untuk ${user?.name ?? "Anda"}`
              : "Pesanan tidak ditemukan"
          }
          description={
            myTransactions.length === 0
              ? "Semua pesanan yang Anda buat di halaman menu akan tersimpan otomatis di sini."
              : "Coba ubah kata kunci pencarian Anda."
          }
          action={
            myTransactions.length === 0 && (
              <button
                onClick={onGoToMenu}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
              >
                <ShoppingBasket className="h-4 w-4" />
                Pesan Menu Sekarang
              </button>
            )
          }
        />
      )}

      <ReceiptModal transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
