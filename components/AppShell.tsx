"use client";

import { useState } from "react";
import { Croissant, X } from "lucide-react";
import type { ViewKey } from "@/lib/types";
import { StoreProvider } from "@/context/StoreContext";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import BottomNav from "./layout/BottomNav";
import NavList from "./layout/NavList";
import KasirView from "./kasir/KasirView";
import InventoryView from "./inventory/InventoryView";
import ReportsView from "./reports/ReportsView";
import ReviewsView from "./reviews/ReviewsView";
import SettingsView from "./settings/SettingsView";

export default function AppShell() {
  const [view, setView] = useState<ViewKey>("kasir");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (next: ViewKey) => {
    setView(next);
    setMenuOpen(false);
  };

  return (
    <StoreProvider>
      <div className="min-h-screen bg-[var(--color-bg)] text-stone-800">
        <Sidebar view={view} onNavigate={navigate} />

        {menuOpen && (
          <div className="no-print fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-stone-900/60" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="relative flex h-full w-72 flex-col bg-[var(--color-choco)] text-[var(--color-cream)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white">
                    <Croissant className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold leading-tight">HaiLai&apos;s Bakery</p>
                    <p className="text-xs text-amber-200/80">All-in-One POS &amp; Catalog</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Tutup menu"
                  className="rounded-full p-1.5 text-[var(--color-cream)]/70 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-amber-200/50">
                  Menu Utama
                </p>
                <NavList view={view} onNavigate={navigate} variant="dark" />
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-screen flex-col lg:pl-64">
          <Topbar view={view} onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
          <main className="flex-1 pb-24 lg:pb-6">
            {view === "kasir" && <KasirView />}
            {view === "stok" && <InventoryView />}
            {view === "laporan" && <ReportsView />}
            {view === "ulasan" && <ReviewsView />}
            {view === "pengaturan" && <SettingsView />}
          </main>
        </div>

        <BottomNav view={view} onNavigate={navigate} />
      </div>
    </StoreProvider>
  );
}
