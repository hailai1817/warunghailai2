"use client";

import { useSyncExternalStore } from "react";
import { LogOut, Menu, X } from "lucide-react";
import type { UserRole, ViewKey } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import BrandLogo from "@/components/brand/BrandLogo";

interface TopbarProps {
  view: ViewKey;
  onOpenMenu: () => void;
  menuOpen: boolean;
  onCloseMenu: () => void;
  onLogout: () => void;
}

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  kasir: { title: "Katalog Menu & Kasir", subtitle: "Pilih produk dan proses pesanan pelanggan" },
  riwayat: { title: "Riwayat Pembelian", subtitle: "Pantau pesanan dan lihat kembali struk belanja Anda" },
  stok: { title: "Manajemen Stok", subtitle: "Kelola produk, harga, dan ketersediaan barang" },
  laporan: { title: "Laporan Transaksi", subtitle: "Pantau penjualan dan riwayat transaksi" },
  ulasan: { title: "Ulasan Pelanggan", subtitle: "Komentar, rating, dan masukan pelanggan" },
  pengaturan: { title: "Pengaturan Toko", subtitle: "Konfigurasi profil dan data toko" },
};

const ROLE_BADGE_STYLE: Record<UserRole, string> = {
  pelanggan: "bg-emerald-100 text-emerald-700 border-emerald-200",
  kasir: "bg-amber-100 text-amber-800 border-amber-200",
  admin: "bg-rose-100 text-rose-700 border-rose-200",
};

const ROLE_LABEL: Record<UserRole, string> = {
  pelanggan: "Pelanggan",
  kasir: "Kasir",
  admin: "Admin",
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

export default function Topbar({ view, onOpenMenu, menuOpen, onCloseMenu, onLogout }: TopbarProps) {
  const now = useSyncExternalStore(subscribeToClock, getClockSnapshot, () => new Date());
  const { user } = useAuth();
  const { settings } = useStore();

  const meta =
    view === "kasir" && user?.role === "pelanggan"
      ? {
          title: "Katalog Menu",
          subtitle: "Pilih roti, kue, dan minuman favorit untuk dipesan",
        }
      : VIEW_TITLES[view];
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

        <div className="flex items-center gap-3">
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

          {user && (
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white/90 py-1.5 pl-2.5 pr-1.5 shadow-sm">
              <div className="hidden text-right sm:block">
                <p className="max-w-[110px] truncate text-xs font-extrabold text-stone-800">
                  {user.name}
                </p>
                <span
                  className={`inline-block rounded-full border px-1.5 py-0 text-[9px] font-bold uppercase ${ROLE_BADGE_STYLE[user.role]}`}
                >
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase sm:hidden ${ROLE_BADGE_STYLE[user.role]}`}
              >
                {ROLE_LABEL[user.role]}
              </span>
              <button
                onClick={onLogout}
                title="Logout / Keluar"
                aria-label="Logout"
                className="flex h-8 items-center gap-1 rounded-lg bg-stone-100 px-2.5 text-xs font-bold text-stone-600 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
