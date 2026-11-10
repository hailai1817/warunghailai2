"use client";

import { LogOut } from "lucide-react";
import type { UserRole, ViewKey } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import BrandLogo from "@/components/brand/BrandLogo";
import NavList from "./NavList";

const ROLE_LABEL: Record<UserRole, string> = {
  pelanggan: "Pelanggan",
  kasir: "Kasir",
  admin: "Admin",
};

const ROLE_PILL: Record<UserRole, string> = {
  pelanggan: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30",
  kasir: "bg-amber-400/20 text-amber-200 border-amber-400/30",
  admin: "bg-rose-400/20 text-rose-200 border-rose-400/30",
};

interface SidebarProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onLogout: () => void;
}

export default function Sidebar({ view, onNavigate, onLogout }: SidebarProps) {
  const { user } = useAuth();
  const { settings } = useStore();

  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[var(--color-choco)] text-[var(--color-cream)] lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <BrandLogo className="h-12 w-12 shrink-0 drop-shadow-md" />
        <div>
          <p className="text-base font-extrabold leading-snug tracking-tight sm:text-lg">
            {settings.storeName}
          </p>
          <p className="text-xs font-medium text-amber-200/80">Bakery &amp; Cafe - POS &amp; Catalog</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-200/50">
          Menu Utama
        </p>
        <NavList view={view} onNavigate={onNavigate} variant="dark" />
      </div>

      <div className="border-t border-white/10 p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-sm font-extrabold text-white shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-white">{user.name}</p>
              <span
                className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ROLE_PILL[user.role]}`}
              >
                {ROLE_LABEL[user.role]}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-cream)] transition hover:border-red-300/40 hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar / Ganti Akun
        </button>
        <div className="pt-1">
          <p className="text-xs text-[var(--color-cream)]/50">{settings.storeName} v1.0</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--color-cream)]/40">
            {settings.address}
          </p>
        </div>
      </div>
    </aside>
  );
}
