"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Banknote,
  Check,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { QUICK_CASH } from "@/lib/constants";
import { FALLBACK_IMAGE } from "@/lib/mock-data";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";

interface CartPanelProps {
  onClose?: () => void;
  onSuccess: (transaction: Transaction) => void;
}

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  Tunai: Banknote,
  QRIS: QrCode,
  "Kartu Debit": CreditCard,
};

export default function CartPanel({ onClose, onSuccess }: CartPanelProps) {
  const { cart, settings, checkout, updateCartQty, removeFromCart, clearCart } = useStore();
  const [method, setMethod] = useState<PaymentMethod>("Tunai");
  const [cashStr, setCashStr] = useState("");
  const [error, setError] = useState("");

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round((subtotal * settings.taxRate) / 100);
  const total = subtotal + tax;
  const cash = parseInt(cashStr.replace(/\D/g, ""), 10) || 0;
  const paid = method === "Tunai" ? cash : total;
  const change = paid - total;

  const handleCashChange = (value: string) => {
    setError("");
    setCashStr(value);
  };

  const handleMethodChange = (m: PaymentMethod) => {
    setError("");
    setMethod(m);
  };

  const handleCheckout = () => {
    setError("");
    const result = checkout(method, paid);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCashStr("");
    setMethod("Tunai");
    onSuccess(result.transaction);
  };

  const quickAmounts = [...QUICK_CASH.filter((v) => v >= total), total];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dashed border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBasket className="h-5 w-5 text-[var(--color-terracotta)]" />
          <h2 className="text-base font-extrabold text-stone-800">Keranjang Belanja</h2>
          {cart.length > 0 && (
            <span className="rounded-full bg-[var(--color-terracotta)] px-2 py-0.5 text-xs font-bold text-white">
              {cart.reduce((s, i) => s + i.qty, 0)} item
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            >
              Kosongkan
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Tutup keranjang"
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<ShoppingBasket className="h-7 w-7" />}
              title="Keranjang kosong"
              description="Pilih produk dari katalog untuk mulai membuat pesanan."
            />
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {cart.map((item) => {
              const lineTotal = item.price * item.qty;
              return (
                <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-crust)]/40">
                    <Image
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.name}
                      fill
                      sizes="48px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-800">{item.name}</p>
                    <p className="text-xs text-stone-500">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(item.productId, -1)}
                      aria-label="Kurangi"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:bg-stone-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums text-stone-800">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.productId, 1)}
                      aria-label="Tambah"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-extrabold text-stone-800">{formatRupiah(lineTotal)}</p>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Hapus"
                      className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-stone-400 transition hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-dashed border-stone-200 bg-stone-50/60 px-4 py-4">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Pajak (PPN {settings.taxRate}%)</span>
            <span className="font-semibold tabular-nums">{formatRupiah(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-stone-900">
            <span>Total Bayar</span>
            <span className="tabular-nums text-[var(--color-terracotta)]">{formatRupiah(total)}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
            Metode Pembayaran
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICONS[m];
              const active = method === m;
              return (
                <button
                  key={m}
                  onClick={() => handleMethodChange(m)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition ${
                    active
                      ? "border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-white shadow"
                      : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {m}
                  {active && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {method === "Tunai" ? (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  Rp
                </span>
                <input
                  inputMode="numeric"
                  value={cashStr}
                  onChange={(e) => handleCashChange(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border-2 border-stone-200 bg-white py-2.5 pl-9 pr-3 text-right text-base font-bold tabular-nums text-stone-800 outline-none transition focus:border-[var(--color-terracotta)]"
                />
              </div>
              <button
                onClick={() => handleCashChange(String(total))}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-bold text-stone-600 transition hover:bg-amber-50"
              >
                Uang Pas
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(new Set(quickAmounts)).map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleCashChange(String(amount))}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold tabular-nums text-stone-600 transition hover:bg-amber-50"
                >
                  {amount >= 1000000 ? `${amount / 1000000} jt` : `${amount / 1000}rb`}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--color-choco)] px-4 py-3 text-white">
              <span className="text-sm font-semibold">Kembalian</span>
              <span
                className={`text-lg font-extrabold tabular-nums ${
                  change < 0 ? "text-red-300" : "text-amber-300"
                }`}
              >
                {change < 0 ? `Kurang ${formatRupiah(Math.abs(change))}` : formatRupiah(change)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-xs text-stone-500">
            Pembayaran <b>{method}</b> — nominal otomatis sebesar{" "}
            <b className="text-stone-700">{formatRupiah(total)}</b>.
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || (method === "Tunai" && change < 0)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Receipt className="h-5 w-5" />
          Proses Transaksi &amp; Cetak Struk
        </button>
      </div>
    </div>
  );
}
