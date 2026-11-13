"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Crown,
  Download,
  Printer,
  QrCode,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import type { PaymentMethod, Transaction } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import {
  downloadFile,
  formatDateTime,
  formatDateShort,
  formatRupiah,
  toCSV,
} from "@/lib/format";
import { getTotalStock } from "@/lib/stock";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import SalesChart from "./SalesChart";
import ReceiptModal from "@/components/kasir/ReceiptModal";

type RangePreset = "today" | "7" | "30" | "all";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const METHOD_BADGE: Record<PaymentMethod, "terracotta" | "amber" | "choco"> = {
  Tunai: "terracotta",
  QRIS: "amber",
  "Kartu Debit": "choco",
};

export default function ReportsView() {
  const { transactions, products, settings } = useStore();
  const baseDate = useMemo(
    () =>
      settings.workingDate
        ? new Date(`${settings.workingDate}T12:00:00`)
        : new Date(),
    [settings.workingDate]
  );
  const [from, setFrom] = useState(() => toISODate(baseDate));
  const [to, setTo] = useState(() => toISODate(baseDate));
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const fromD = from ? new Date(`${from}T00:00:00`) : null;
    const toD = to ? new Date(`${to}T23:59:59.999`) : null;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    });
  }, [transactions, from, to]);

  const stats = useMemo(() => {
    const totalSales = filtered.reduce((sum, t) => sum + t.total, 0);
    const itemCounts = new Map<string, number>();
    filtered.forEach((t) =>
      t.items.forEach((i) => itemCounts.set(i.name, (itemCounts.get(i.name) ?? 0) + i.qty))
    );
    const bestSeller = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalSales,
      count: filtered.length,
      bestSeller,
      totalStock: getTotalStock(products),
    };
  }, [filtered, products]);

  const setPreset = (preset: RangePreset) => {
    if (preset === "all") {
      setFrom("");
      setTo("");
      return;
    }
    const end = new Date(baseDate);
    const start = new Date(baseDate);
    start.setDate(start.getDate() - (Number(preset) - 1));
    setFrom(toISODate(start));
    setTo(toISODate(end));
  };

  const activePreset: RangePreset | null = (() => {
    if (!from && !to) return "all";
    const today = toISODate(baseDate);
    if (from === today && to === today) return "today";
    const start = new Date(baseDate);
    start.setDate(start.getDate() - 6);
    if (from === toISODate(start) && to === today) return "7";
    start.setDate(start.getDate() - 23);
    if (from === toISODate(start) && to === today) return "30";
    return null;
  })();

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ["No. Transaksi", "Tanggal", "Waktu", "Item Belanja", "Metode Bayar", "Subtotal", "Diskon", "PPN", "Total"],
    ];
    filtered.forEach((t) => {
      rows.push([
        t.id,
        formatDateShort(t.date),
        new Date(t.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        t.items.map((i) => `${i.name} (${i.qty}pcs)`).join(", "),
        t.paymentMethod,
        t.subtotal,
        t.discount ?? 0,
        t.tax,
        t.total,
      ]);
    });
    const filename = `laporan-hailai-bakery-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(filename, "\uFEFF" + toCSV(rows), "text/csv");
  };

  const presetClass = (preset: RangePreset) =>
    `rounded-full px-3.5 py-2 text-xs font-bold transition ${
      activePreset === preset
        ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow"
        : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300"
    }`;

  const rangeLabel = from || to ? `${from ? formatDateShort(from) : "…"} – ${to ? formatDateShort(to) : "…"}` : "Semua waktu";

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Penjualan"
          value={formatRupiah(stats.totalSales)}
          icon={<TrendingUp className="h-6 w-6" />}
          accent="terracotta"
          hint={rangeLabel}
        />
        <StatCard
          label="Total Transaksi"
          value={stats.count}
          icon={<Receipt className="h-6 w-6" />}
          accent="amber"
          hint={`${filtered.length} nota`}
        />
        <StatCard
          label="Produk Terlaris"
          value={stats.bestSeller ? stats.bestSeller[0] : "-"}
          icon={<Crown className="h-6 w-6" />}
          accent="choco"
          hint={
            stats.bestSeller
              ? `${stats.bestSeller[1]} pcs terjual`
              : "belum ada penjualan"
          }
        />
        <StatCard
          label="Sisa Total Stok"
          value={stats.totalStock.toLocaleString("id-ID")}
          icon={<ShoppingBag className="h-6 w-6" />}
          accent="green"
          hint="semua produk"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart transactions={transactions} days={7} today={baseDate} />
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm xl:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[var(--color-terracotta)]" />
              <div>
                <h3 className="text-sm font-extrabold text-stone-800">Filter Riwayat Transaksi</h3>
                <p className="text-xs text-stone-500">Rentang tanggal tabel di bawah</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">Pilihan Cepat</p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["today", "Hari Ini"],
                    ["7", "7 Hari"],
                    ["30", "30 Hari"],
                    ["all", "Semua"],
                  ] as [RangePreset, string][]
                ).map(([key, label]) => (
                  <button key={key} onClick={() => setPreset(key)} className={presetClass(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-stone-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Kustom Tanggal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                <label className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600">
                  <span className="w-14 shrink-0">Dari</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none transition focus:border-[var(--color-terracotta)] focus:ring-1 focus:ring-[var(--color-terracotta)]"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-600">
                  <span className="w-14 shrink-0">Sampai</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none transition focus:border-[var(--color-terracotta)] focus:ring-1 focus:ring-[var(--color-terracotta)]"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>Data terpilih:</span>
            <span className="font-bold text-stone-800">{filtered.length} nota ({rangeLabel})</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-800">Riwayat Transaksi</h3>
            <p className="text-xs text-stone-500">
              {filtered.length} transaksi pada {rangeLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50"
            >
              <Download className="h-4 w-4" />
              Export CSV / Excel
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-3.5 py-2.5 text-xs font-bold text-white shadow transition hover:opacity-90"
            >
              <Printer className="h-4 w-4" />
              Cetak Laporan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-bold uppercase tracking-wide text-stone-500">
                <th className="px-5 py-3">No. Transaksi</th>
                <th className="px-5 py-3">Tanggal / Waktu</th>
                <th className="px-5 py-3">Item Belanja</th>
                <th className="px-5 py-3">Metode Bayar</th>
                <th className="px-5 py-3 text-right">Diskon</th>
                <th className="px-5 py-3 text-right">Total Bayar</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((t) => {
                const MethodIcon =
                  t.paymentMethod === "Tunai" ? Banknote : t.paymentMethod === "QRIS" ? QrCode : CreditCard;
                const itemSummary = t.items
                  .map((i) => `${i.name} ${i.qty > 1 ? `×${i.qty}` : ""}`)
                  .join(", ");
                return (
                  <tr key={t.id} className="transition hover:bg-amber-50/40">
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-bold text-[var(--color-terracotta)]">
                        {t.id}
                      </p>
                      {t.customerName && (
                        <p className="text-[11px] font-medium text-stone-400">
                          {t.orderedByRole === "pelanggan" ? "Pelanggan: " : "Kasir: "}
                          {t.customerName}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-stone-800">{formatDateTime(t.date)}</p>
                    </td>
                    <td className="max-w-[260px] px-5 py-3">
                      <p className="truncate text-stone-600" title={itemSummary}>
                        {itemSummary}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={METHOD_BADGE[t.paymentMethod]}>
                        <MethodIcon className="h-3 w-3" />
                        {t.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold tabular-nums">
                      {t.discount ? (
                        <span className="text-emerald-600">-{formatRupiah(t.discount)}</span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-extrabold tabular-nums text-stone-800">
                      {formatRupiah(t.total)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => setReceipt(t)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-bold text-stone-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Struk
                      </button>
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
              icon={<Receipt className="h-7 w-7" />}
              title="Belum ada transaksi"
              description="Tidak ada transaksi pada rentang tanggal yang dipilih."
            />
          </div>
        )}
      </div>

      <div id="report-print-area" className="print-area">
        <div className="p-8 font-sans text-sm text-black">
          <div className="text-center">
            <h1 className="text-xl font-extrabold">{settings.storeName}</h1>
            <p>{settings.address} — {settings.phone}</p>
            <p className="mt-1 font-semibold">LAPORAN TRANSAKSI ({rangeLabel})</p>
            <p>Dicetak: {new Date().toLocaleString("id-ID")}</p>
          </div>
          <table className="mt-4 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="px-2 py-1 text-left">No.</th>
                <th className="px-2 py-1 text-left">No. Transaksi</th>
                <th className="px-2 py-1 text-left">Tanggal / Waktu</th>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Metode</th>
                <th className="px-2 py-1 text-right">Diskon</th>
                <th className="px-2 py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => (
                <tr key={t.id} className="border-b border-black/30">
                  <td className="px-2 py-1">{idx + 1}</td>
                  <td className="px-2 py-1 font-mono">{t.id}</td>
                  <td className="px-2 py-1">{formatDateTime(t.date)}</td>
                  <td className="px-2 py-1">{t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</td>
                  <td className="px-2 py-1">{t.paymentMethod}</td>
                  <td className="px-2 py-1 text-right">
                    {t.discount ? `-${formatRupiah(t.discount)}` : "-"}
                  </td>
                  <td className="px-2 py-1 text-right">{formatRupiah(t.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-extrabold">
                <td colSpan={6} className="px-2 py-2 text-right">
                  TOTAL ({filtered.length} transaksi)
                </td>
                <td className="px-2 py-2 text-right">{formatRupiah(stats.totalSales)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ReceiptModal transaction={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
