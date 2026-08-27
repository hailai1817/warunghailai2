"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/format";

interface SalesChartProps {
  transactions: Transaction[];
  days?: number;
}

export default function SalesChart({ transactions, days = 7 }: SalesChartProps) {
  const data = useMemo(() => {
    const result: { label: string; total: number; date: Date }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const total = transactions
        .filter((t) => {
          const td = new Date(t.date);
          return (
            td.getFullYear() === d.getFullYear() &&
            td.getMonth() === d.getMonth() &&
            td.getDate() === d.getDate()
          );
        })
        .reduce((sum, t) => sum + t.total, 0);
      result.push({
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        total,
        date: d,
      });
    }
    return result;
  }, [transactions, days]);

  const max = Math.max(...data.map((d) => d.total), 1);
  const today = new Date();

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-stone-800">Penjualan {days} Hari Terakhir</h3>
          <p className="text-xs text-stone-500">Total pendapatan harian</p>
        </div>
        <span className="text-xs font-semibold text-stone-400">
          {data[data.length - 1].date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
          })}
          {" - "}
          {today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {data.map((d, idx) => {
          const isToday = idx === data.length - 1;
          const height = d.total > 0 ? Math.max((d.total / max) * 100, 6) : 3;
          return (
            <div key={idx} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <div
                  title={`${d.label} — ${formatRupiah(d.total)}`}
                  className={`w-full max-w-12 rounded-t-lg transition-all duration-500 ${
                    isToday
                      ? "bg-gradient-to-t from-[var(--color-terracotta)] to-amber-500"
                      : "bg-[var(--color-crust)] group-hover:bg-[var(--color-caramel)]"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-white group-hover:block">
                  {formatRupiah(d.total)}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase ${isToday ? "text-[var(--color-terracotta)]" : "text-stone-400"}`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
