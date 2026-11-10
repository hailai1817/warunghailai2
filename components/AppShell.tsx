"use client";

import { useState } from "react";
import { LogOut, X } from "lucide-react";
import type { ViewKey } from "@/lib/types";
import { ROLE_ALLOWED_VIEWS } from "@/lib/types";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StoreProvider, useStore } from "@/context/StoreContext";
import BrandLogo from "./brand/BrandLogo";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";
import BottomNav from "./layout/BottomNav";
import NavList from "./layout/NavList";
import LoginView from "./auth/LoginView";
import KasirView from "./kasir/KasirView";
import PurchaseHistoryView from "./orders/PurchaseHistoryView";
import InventoryView from "./inventory/InventoryView";
import ReportsView from "./reports/ReportsView";
import ReviewsView from "./reviews/ReviewsView";
import SettingsView from "./settings/SettingsView";

function AppContent() {
  const { user, authReady, logout } = useAuth();
  const { clearCart, settings } = useStore();
  const [view, setView] = useState<ViewKey>("kasir");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearCart();
    setView("kasir");
    setMenuOpen(false);
    logout();
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo className="h-14 w-14 animate-pulse" />
          <p className="text-xs font-bold text-stone-400">Memuat warung...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const allowedViews = ROLE_ALLOWED_VIEWS[user.role];
  const activeView = allowedViews.includes(view) ? view : allowedViews[0];

  const navigate = (next: ViewKey) => {
    if (!allowedViews.includes(next)) return;
    setView(next);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-stone-800">
      <Sidebar view={activeView} onNavigate={navigate} onLogout={handleLogout} />

      {menuOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/60" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="relative flex h-full w-72 flex-col bg-[var(--color-choco)] text-[var(--color-cream)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <BrandLogo className="h-10 w-10 shrink-0" />
                <div>
                  <p className="font-extrabold leading-tight">{settings.storeName}</p>
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
              <NavList view={activeView} onNavigate={navigate} variant="dark" />
            </div>
            <div className="border-t border-white/10 p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-xs font-extrabold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-white">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200/80">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-cream)] transition hover:bg-red-500/20 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar
          view={activeView}
          onOpenMenu={() => setMenuOpen(true)}
          menuOpen={menuOpen}
          onCloseMenu={() => setMenuOpen(false)}
          onLogout={handleLogout}
        />
        <main className="flex-1 pb-24 lg:pb-6">
          {activeView === "kasir" && <KasirView />}
          {activeView === "riwayat" && user.role === "pelanggan" && (
            <PurchaseHistoryView onGoToMenu={() => navigate("kasir")} />
          )}
          {activeView === "stok" && user.role !== "pelanggan" && <InventoryView />}
          {activeView === "laporan" && user.role !== "pelanggan" && <ReportsView />}
          {activeView === "ulasan" && <ReviewsView />}
          {activeView === "pengaturan" && user.role !== "pelanggan" && <SettingsView />}
        </main>
      </div>

      <BottomNav view={activeView} onNavigate={navigate} />
    </div>
  );
}

export default function AppShell() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}
