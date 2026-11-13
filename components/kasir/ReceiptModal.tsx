"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Printer, RotateCcw } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { formatDateTime, formatRupiah } from "@/lib/format";

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const { settings } = useStore();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (transaction) {
      document.body.classList.add("receipt-modal-open");
    } else {
      document.body.classList.remove("receipt-modal-open");
    }
    return () => {
      document.body.classList.remove("receipt-modal-open");
    };
  }, [transaction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && transaction) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction || !mounted) return null;

  const methodLabel: Record<Transaction["paymentMethod"], string> = {
    Tunai: "TUNAI",
    QRIS: "QRIS",
    "Kartu Debit": "DEBIT",
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      id="receipt-modal-portal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 print:static print:block print:p-0 print:m-0"
    >
      <div
        className="no-print absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="receipt-modal-panel relative z-10 flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-stone-100 shadow-2xl sm:rounded-3xl print:static print:block print:w-auto print:max-w-none print:max-h-none print:overflow-visible print:bg-transparent print:shadow-none print:rounded-none print:m-0 print:p-0">
        {/* Modal Header (No Print) */}
        <div className="no-print flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5">
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Struk Pembelian</h2>
            <p className="text-xs text-stone-500">Ukuran Thermal POS-58 (58mm)</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="receipt-modal-body flex-1 overflow-y-auto bg-stone-200/70 p-3 sm:p-5 print:static print:block print:p-0 print:m-0 print:bg-transparent print:overflow-visible">
          {/* Dedicated POS-58 Print Area */}
          <div
            id="receipt-print-area"
            className="receipt-paper mx-auto w-full max-w-[280px] bg-white px-3.5 py-4 font-mono text-black shadow-md print:mx-0 print:w-[58mm] print:max-w-[58mm] print:p-0 print:shadow-none"
          >
            {/* Header: Nama Toko, Alamat, Telepon */}
            <div className="text-center">
              <p className="text-[14px] font-black uppercase tracking-wider leading-tight">
                {settings.storeName}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-tight">{settings.address}</p>
              <p className="text-[11px] font-medium leading-tight">Telp: {settings.phone}</p>
            </div>

            <div className="my-1.5 border-t border-dashed border-black" />
            <p className="text-center text-[11.5px] font-extrabold tracking-[0.2em] leading-tight">
              STRUK PEMBELIAN
            </p>
            <div className="my-1.5 border-t border-dashed border-black" />

            {/* Nomor Transaksi, Waktu & Pelanggan / Kasir */}
            <div className="space-y-0.5 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span>No. Nota</span>
                <span className="font-bold">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{formatDateTime(transaction.date)}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span>
                    {transaction.orderedByRole === "pelanggan" ? "Pelanggan" : "Kasir"}
                  </span>
                  <span className="font-bold">{transaction.customerName}</span>
                </div>
              )}
            </div>

            <div className="my-1.5 border-t border-dashed border-black" />

            {/* Daftar Produk */}
            <div className="space-y-1.5">
              {transaction.items.map((item) => (
                <div key={item.productId} className="leading-tight">
                  <p className="text-[11.5px] font-bold break-words">{item.name}</p>
                  <div className="flex justify-between text-[11px]">
                    <span>
                      {item.qty} x {formatRupiah(item.price)}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-1.5 border-t border-dashed border-black" />

            {/* Rincian Pembayaran */}
            <div className="space-y-0.5 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">
                  {formatRupiah(transaction.subtotal)}
                </span>
              </div>
              {transaction.discount ? (
                <div className="flex justify-between">
                  <span>
                    Diskon
                    {transaction.discountType === "percent"
                      ? ` (${transaction.discountValue}%)`
                      : ""}
                  </span>
                  <span className="tabular-nums font-semibold">
                    -{formatRupiah(transaction.discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>PPN {settings.taxRate}%</span>
                <span className="tabular-nums font-semibold">{formatRupiah(transaction.tax)}</span>
              </div>
              <div className="flex justify-between pt-1 text-[13.5px] font-black">
                <span>TOTAL</span>
                <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            <div className="my-1.5 border-t border-dashed border-black" />

            {/* Metode Pembayaran, Bayar & Kembalian */}
            <div className="space-y-0.5 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span>Bayar ({methodLabel[transaction.paymentMethod]})</span>
                <span className="tabular-nums font-bold">
                  {formatRupiah(transaction.cashReceived)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span className="tabular-nums font-bold">
                  {formatRupiah(transaction.change)}
                </span>
              </div>
            </div>

            <div className="my-1.5 border-t border-dashed border-black" />

            {/* Footer Ucapan Terima Kasih & Barcode Vector */}
            <div className="text-center text-[10.5px] leading-tight">
              <p className="font-bold">{settings.receiptFooter}</p>
              <div className="my-2 flex justify-center">
                <svg className="h-6 w-36" viewBox="0 0 144 24" fill="black" aria-hidden>
                  {[
                    0, 3, 5, 8, 11, 13, 16, 19, 21, 24, 27, 29, 33, 36, 38, 41, 44, 48, 51,
                    53, 56, 60, 63, 65, 68, 72, 75, 77, 80, 84, 87, 89, 92, 96, 99, 101, 104,
                    108, 111, 113, 116, 120, 123, 125, 128, 132, 135, 137, 140,
                  ].map((x, i) => (
                    <rect
                      key={i}
                      x={x}
                      y={0}
                      width={i % 4 === 0 ? 3 : i % 2 === 0 ? 2 : 1}
                      height={24}
                    />
                  ))}
                </svg>
              </div>
              <p className="font-bold">** Terima kasih atas kunjungan Anda **</p>
            </div>
          </div>
        </div>

        {/* Modal Actions (No Print) */}
        <div className="no-print flex gap-2 border-t border-stone-200 bg-white px-5 py-4">
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-50"
          >
            <RotateCcw className="h-4 w-4" />
            Transaksi Baru
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Print Struk
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
