"use client";

import { BarChart3, Package, Settings, ShoppingBasket, Star } from "lucide-react";
import type { ViewKey } from "@/lib/types";
import { useStore } from "@/context/StoreContext";

const ITEMS: { key: ViewKey; label: string; icon: typeof ShoppingBasket }[] = [
  { key: "kasir", label: "Kasir", icon: ShoppingBasket },
  { key: "stok", label: "Stok", icon: Package },
  { key: "laporan", label: "Laporan", icon: BarChart3 },
  { key: "ulasan", label: "Ulasan", icon: Star },
  { key: "pengaturan", label: "Setting", icon: Settings },
];

interface BottomNavProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export default function BottomNav({ view, onNavigate }: BottomNavProps) {
  const { cart } = useStore();
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                active ? "text-[var(--color-terracotta)]" : "text-stone-400"
              }`}
            >
              {item.key === "kasir" && cartCount > 0 && (
                <span className="absolute right-[calc(50%-18px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-terracotta)] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
