"use client";

import type { ViewKey } from "@/lib/types";
import BrandLogo from "@/components/brand/BrandLogo";
import NavList from "./NavList";

interface SidebarProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

export default function Sidebar({ view, onNavigate }: SidebarProps) {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[var(--color-choco)] text-[var(--color-cream)] lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <BrandLogo className="h-12 w-12 shrink-0 drop-shadow-md" />
        <div>
          <p className="text-base font-extrabold leading-snug tracking-tight sm:text-lg">
            HaiLai&apos;s Bakery &amp; Cafe
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

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-[var(--color-cream)]/50">HaiLai&apos;s Bakery &amp; Cafe v1.0</p>
        <p className="mt-0.5 text-[11px] text-[var(--color-cream)]/40">
          Jl. Melati Raya No. 88, Bandung
        </p>
      </div>
    </aside>
  );
}
