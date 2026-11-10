"use client";

import { BarChart3, History, Package, Settings, ShoppingBasket, Star } from "lucide-react";
import type { UserRole, ViewKey } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

export interface NavItemConfig {
  key: ViewKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof ShoppingBasket;
}

export function getNavItemsForRole(role?: UserRole): NavItemConfig[] {
  if (role === "pelanggan") {
    return [
      {
        key: "kasir",
        label: "Pesan Menu",
        shortLabel: "Menu",
        description: "Pilih Roti & Minuman",
        icon: ShoppingBasket,
      },
      {
        key: "riwayat",
        label: "Riwayat Pembelian",
        shortLabel: "Riwayat",
        description: "Pesanan & Nota Saya",
        icon: History,
      },
      {
        key: "ulasan",
        label: "Ulasan Pelanggan",
        shortLabel: "Ulasan",
        description: "Tulis & Lihat Komentar",
        icon: Star,
      },
    ];
  }

  return [
    {
      key: "kasir",
      label: "Katalog Menu",
      shortLabel: "Kasir",
      description: "Kasir & Pesanan",
      icon: ShoppingBasket,
    },
    {
      key: "stok",
      label: "Manajemen Stok",
      shortLabel: "Stok",
      description: "Inventory Control",
      icon: Package,
    },
    {
      key: "laporan",
      label: "Laporan Transaksi",
      shortLabel: "Laporan",
      description: "Sales Report",
      icon: BarChart3,
    },
    {
      key: "ulasan",
      label: "Ulasan Pelanggan",
      shortLabel: "Ulasan",
      description:
        role === "admin" ? "Balas & Kelola Ulasan" : "Lihat Komentar & Rating",
      icon: Star,
    },
    {
      key: "pengaturan",
      label: "Pengaturan",
      shortLabel: "Setting",
      description: role === "admin" ? "Full Admin Settings" : "Store Settings",
      icon: Settings,
    },
  ];
}

interface NavListProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  variant?: "dark" | "light";
}

export default function NavList({ view, onNavigate, variant = "dark" }: NavListProps) {
  const { user } = useAuth();
  const { cart, reviews } = useStore();
  const navItems = getNavItemsForRole(user?.role);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const reviewCount = reviews.length;
  const dark = variant === "dark";

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const active = view === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              active
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md"
                : dark
                  ? "text-[var(--color-cream)]/75 hover:bg-white/10 hover:text-[var(--color-cream)]"
                  : "text-stone-600 hover:bg-amber-50"
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${active ? "" : dark ? "text-amber-300/70" : "text-stone-400"}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.label}</span>
              <span
                className={`block truncate text-[11px] ${active ? "text-white/85" : dark ? "text-[var(--color-cream)]/50" : "text-stone-400"}`}
              >
                {item.description}
              </span>
            </span>
            {item.key === "kasir" && cartCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[var(--color-terracotta)] shadow">
                {cartCount}
              </span>
            )}
            {item.key === "ulasan" && reviewCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[var(--color-terracotta)] shadow">
                {reviewCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
