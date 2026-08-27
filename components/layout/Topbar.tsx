"use client";

import { useEffect, useState } from "react";
import { Croissant, Menu, X } from "lucide-react";
import type { ViewKey } from "@/lib/types";

interface TopbarProps {
  view: ViewKey;
  onOpenMenu: () => void;
  menuOpen: boolean;
  onCloseMenu: () => void;
}

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  kasir: { title: "Katalog Menu & Kasir", subtitle: "Pilih produk dan proses pesanan pelanggan" },
  stok: { title: "Manajemen Stok", subtitle: "Kelola produk, harga, dan ketersediaan barang" },
  laporan: { title: "Laporan Transaksi", subtitle: "Pantau penjualan dan riwayat transaksi" },
  ulasan: { title: "Ulasan Pelanggan", subtitle: "Komentar, rating, dan masukan pelanggan" },
  pengaturan: { title: "Pengaturan Toko", subtitle: "Konfigurasi profil dan data toko" },
};

export default function Topbar({ view, onOpenMenu, menuOpen, onCloseMenu }: TopbarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const meta = VIEW_TITLES[view];
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="no-print sticky top-0 z-20 border-b border-stone-200/80 bg-[var(--color-cream)]/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={menuOpen ? onCloseMenu : onOpenMenu}
            aria-label="Buka menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white shadow lg:hidden">
              <Croissant className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight text-stone-800 sm:text-lg">
                {meta.title}
              </h1>
              <p className="hidden text-xs text-stone-500 sm:block">{meta.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="hidden flex-col items-end md:flex">
          <p
            suppressHydrationWarning
            className="text-sm font-bold tabular-nums text-stone-700"
          >
            {now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
            <span className="ml-1 font-medium text-stone-400">
              WIB
            </span>
          </p>
          <p suppressHydrationWarning className="text-xs text-stone-500">{dateLabel}</p>
        </div>
      </div>
    </header>
  );
}
