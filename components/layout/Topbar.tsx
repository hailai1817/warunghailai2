"use client";

import { useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import type { ViewKey } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import BrandLogo from "@/components/brand/BrandLogo";

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

let cachedNow: Date | null = null;

function getClockSnapshot(): Date {
  const d = new Date();
  if (!cachedNow || d.getTime() !== cachedNow.getTime()) cachedNow = d;
  return cachedNow;
}

function subscribeToClock(callback: () => void) {
  const timer = window.setInterval(callback, 1000);
  return () => window.clearInterval(timer);
}

export default function Topbar({ view, onOpenMenu, menuOpen, onCloseMenu }: TopbarProps) {
  const now = useSyncExternalStore(subscribeToClock, getClockSnapshot, () => new Date());
  const { settings } = useStore();

  const meta = VIEW_TITLES[view];
  const displayDate = settings.workingDate
    ? new Date(`${settings.workingDate}T12:00:00`)
    : now;
  const dateLabel = displayDate.toLocaleDateString("id-ID", {
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
            <div className="lg:hidden">
              <BrandLogo className="h-10 w-10 drop-shadow" />
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
