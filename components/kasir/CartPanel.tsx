"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Banknote,
  Check,
  CreditCard,
  Minus,
  Percent,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  ShoppingBasket,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { DiscountType, PaymentMethod, Transaction } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { QUICK_CASH } from "@/lib/constants";
import { DEFAULT_SETTINGS, FALLBACK_IMAGE } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
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

function CartItemThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const target = failed || !src ? FALLBACK_IMAGE : src;

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-crust)]/40">
      <Image
        src={target}
        alt={alt}
        fill
        sizes="48px"
        unoptimized
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

export default function CartPanel({ onClose, onSuccess }: CartPanelProps) {
  const { user } = useAuth();
  const { cart, products, settings, checkout, updateCartQty, removeFromCart, clearCart } = useStore();
  const isCustomer = user?.role === "pelanggan";
  const [method, setMethod] = useState<PaymentMethod>("Tunai");
  const [cashStr, setCashStr] = useState("");
  const [error, setError] = useState("");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");

  const presets =
    settings.discountPresets && settings.discountPresets.length > 0
      ? settings.discountPresets
      : DEFAULT_SETTINGS.discountPresets ?? [];

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const rawValue = Number(discountValue.replace(",", ".")) || 0;
  const discountAmount =
    discountType === "percent"
      ? Math.round((subtotal * Math.min(Math.max(0, rawValue), 100)) / 100)
      : Math.min(Math.max(0, Math.round(rawValue)), subtotal);
  const discount = !isCustomer && discountOpen && subtotal > 0 ? Math.min(discountAmount, subtotal) : 0;
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * settings.taxRate) / 100);
  const total = taxable + tax;
  const cash = parseInt(cashStr.replace(/\D/g, ""), 10) || 0;
  const paid =
    method === "Tunai"
      ? isCustomer && cashStr.trim() === ""
        ? total
        : cash
      : total;
  const change = paid - total;

  const handleCashChange = (value: string) => {
    setError("");
    setCashStr(value);
  };

  const handleMethodChange = (m: PaymentMethod) => {
    setError("");
    setMethod(m);
  };

  const handleDiscountChange = (value: string) => {
    setError("");
    setDiscountValue(value.replace(/[^\d.,]/g, ""));
  };

  const resetDiscount = () => {
    setDiscountValue("");
    setDiscountOpen(false);
  };

  const handleCheckout = () => {
    setError("");
    const result = checkout(
      method,
      paid,
      discount > 0
        ? { type: discountType, value: rawValue, amount: discount }
        : undefined,
      user ? { customerName: user.name, orderedByRole: user.role } : undefined
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCashStr("");
    setMethod("Tunai");
    resetDiscount();
    onSuccess(result.transaction);
  };

  const quickAmounts = QUICK_CASH.filter((v) => v > total);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dashed border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingBasket className="h-5 w-5 text-[var(--color-terracotta)]" />
          <h2 className="text-base font-extrabold text-stone-800">
            {isCustomer ? "Pesanan Saya" : "Keranjang Belanja"}
          </h2>
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
              const product = products.find((p) => p.id === item.productId);
              const isMaxStock = product ? item.qty >= product.stock : false;

              return (
                <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <CartItemThumbnail src={item.image} alt={item.name} />
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
                      disabled={isMaxStock}
                      aria-label="Tambah"
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                        isMaxStock
                          ? "cursor-not-allowed border-stone-100 text-stone-300"
                          : "border-stone-200 text-stone-500 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                      }`}
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
          {discount > 0 && (
            <div className="flex justify-between font-semibold text-emerald-600">
              <span>
                Diskon
                {discountType === "percent" ? ` (${Math.min(rawValue, 100)}%)` : ""}
              </span>
              <span className="tabular-nums">-{formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-stone-600">
            <span>Pajak (PPN {settings.taxRate}%)</span>
            <span className="font-semibold tabular-nums">{formatRupiah(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold text-stone-900">
            <span>Total Bayar</span>
            <span className="tabular-nums text-[var(--color-terracotta)]">{formatRupiah(total)}</span>
          </div>
        </div>

        {!isCustomer && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() => setDiscountOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-terracotta)] transition hover:opacity-80"
                aria-expanded={discountOpen}
              >
                <Tag className="h-3.5 w-3.5" />
                Diskon / Promo
              </button>
              {discount > 0 && (
                <button
                  onClick={resetDiscount}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 transition hover:text-red-600"
                >
                  <RotateCcw className="h-3 w-3" /> Hapus diskon
                </button>
              )}
            </div>

            {discountOpen && (
              <div className="space-y-2.5 rounded-xl border border-dashed border-[var(--color-terracotta)]/40 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Jenis
                  </span>
                  <div className="ml-auto flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
                    {(["percent", "nominal"] as DiscountType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setDiscountType(t);
                          setDiscountValue("");
                        }}
                        className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                          discountType === t
                            ? "bg-[var(--color-terracotta)] text-white shadow"
                            : "text-stone-500 hover:text-stone-700"
                        }`}
                      >
                        {t === "percent" ? "%" : "Rp"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {discountType === "nominal" && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                      Rp
                    </span>
                  )}
                  <input
                    inputMode="decimal"
                    value={discountValue}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder={
                      discountType === "percent"
                        ? "Masukkan persen diskon, cth: 10"
                        : "Masukkan nominal diskon, cth: 5000"
                    }
                    className={`w-full rounded-lg border-2 border-stone-200 bg-white py-2 text-sm font-bold tabular-nums text-stone-800 outline-none transition focus:border-[var(--color-terracotta)] ${
                      discountType === "nominal" ? "pl-9 pr-3" : "px-3"
                    }`}
                  />
                </div>

                {discountType === "percent" && presets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDiscountValue(String(v))}
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50"
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <Percent className="h-3 w-3" />
                  Potongan diskon berlaku sebelum PPN. Preset bisa dikustom di menu Pengaturan.
                </p>
              </div>
            )}
          </div>
        )}

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
                  placeholder={isCustomer ? String(total) : "0"}
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
            {isCustomer && cashStr.trim() === "" && (
              <p className="mt-1.5 text-[11px] text-stone-400">
                Kosongkan untuk langsung bayar uang pas di kasir sebesar {formatRupiah(total)}.
              </p>
            )}
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
          {isCustomer ? "Pesan Sekarang & Lihat Struk" : "Proses Transaksi & Cetak Struk"}
        </button>
      </div>
    </div>
  );
}
