"use client";

import { Printer, RotateCcw } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { formatDateTime, formatRupiah } from "@/lib/format";

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const { settings } = useStore();

  if (!transaction) return null;

  const methodLabel: Record<Transaction["paymentMethod"], string> = {
    Tunai: "TUNAI",
    QRIS: "QRIS",
    "Kartu Debit": "KARTU DEBIT",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4 print:static print:p-0 print:m-0 print:block">
      <div className="no-print absolute inset-0 bg-stone-900/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-stone-100 shadow-2xl sm:rounded-3xl print:max-h-none print:w-auto print:max-w-none print:overflow-visible print:bg-transparent print:shadow-none print:rounded-none">
        <div className="no-print flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Struk Pembelian</h2>
            <p className="text-xs text-stone-500">Transaksi berhasil diproses</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-6 print:p-0 print:bg-transparent print:overflow-visible">
          <div
            id="receipt-print-area"
            className="receipt-paper mx-auto w-full max-w-[300px] bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-black shadow-lg"
          >
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-wider">{settings.storeName}</p>
              <p className="mt-1">{settings.address}</p>
              <p>Telp: {settings.phone}</p>
            </div>

            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-center text-xs font-bold tracking-[0.3em]">STRUK PEMBELIAN</p>
            <div className="my-2 border-t border-dashed border-black" />

            <div className="flex justify-between">
              <span>No. Nota</span>
              <span className="font-bold">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu</span>
              <span>{formatDateTime(transaction.date)}</span>
            </div>

            <div className="my-2 border-t border-dashed border-black" />

            {transaction.items.map((item) => (
              <div key={item.productId} className="mb-2">
                <p className="font-semibold">{item.name}</p>
                <div className="flex justify-between">
                  <span>
                    {item.qty} x {formatRupiah(item.price)}
                  </span>
                  <span className="tabular-nums">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))}

            <div className="my-2 border-t border-dashed border-black" />

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discount ? (
              <div className="flex justify-between">
                <span>
                  Diskon
                  {transaction.discountType === "percent"
                    ? ` ${transaction.discountValue}%`
                    : ""}
                </span>
                <span className="tabular-nums">-{formatRupiah(transaction.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>PPN {settings.taxRate}%</span>
              <span className="tabular-nums">{formatRupiah(transaction.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
            </div>

            <div className="my-2 border-t border-dashed border-black" />

            <div className="flex justify-between">
              <span>Bayar ({methodLabel[transaction.paymentMethod]})</span>
              <span className="tabular-nums">{formatRupiah(transaction.cashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span className="tabular-nums">{formatRupiah(transaction.change)}</span>
            </div>

            <div className="my-2 border-t border-dashed border-black" />

            <p className="text-center font-semibold">{settings.receiptFooter}</p>

            <div className="mt-3 flex flex-col items-center">
              <div
                aria-hidden
                className="h-7 w-full max-w-[180px]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, black 0 2px, transparent 2px 5px, black 5px 6px, transparent 6px 9px, black 9px 12px, transparent 12px 14px)",
                }}
              />
              <p className="mt-1 text-center">** Terima kasih atas kunjungan Anda **</p>
            </div>
          </div>
        </div>

        <div className="no-print flex gap-2 border-t border-stone-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-50"
          >
            <RotateCcw className="h-4 w-4" />
            Transaksi Baru
          </button>
          <button
            onClick={() => window.print()}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Print Struk
          </button>
        </div>
      </div>
    </div>
  );
}
