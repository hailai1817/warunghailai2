"use client";

import type { ViewKey } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { getNavItemsForRole } from "./NavList";

interface BottomNavProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export default function BottomNav({ view, onNavigate }: BottomNavProps) {
  const { user } = useAuth();
  const { cart, unreadAdminCsCount, setCustomerChatOpen } = useStore();
  const items = getNavItemsForRole(user?.role);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                if (user?.role === "pelanggan" && item.key === "chat_cs") {
                  setCustomerChatOpen(true);
                } else {
                  onNavigate(item.key);
                }
              }}
              className={`relative flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition ${
                active ? "text-[var(--color-terracotta)]" : "text-stone-400"
              }`}
            >
              {item.key === "kasir" && cartCount > 0 && (
                <span className="absolute right-[calc(50%-18px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-terracotta)] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
              {item.key === "chat_cs" && unreadAdminCsCount > 0 && (
                <span className="absolute right-[calc(50%-18px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow animate-pulse">
                  {unreadAdminCsCount}
                </span>
              )}
              <Icon className="h-5 w-5" />
              {item.shortLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
