"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AutoScrollWidget() {
  const [isScrollable, setIsScrollable] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      const scrollable = maxScroll > 120;
      setIsScrollable(scrollable);

      if (!scrollable) {
        setIsScrolling(false);
        return;
      }

      setAtTop(scrollY <= 25);
      setAtBottom(scrollY >= maxScroll - 25);

      // Tandai sedang scrolling
      setIsScrolling(true);

      // Reset timer: jika tidak ada scrolling baru selama 1.4 detik, sembunyikan tombol
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 1400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Cek tinggi konten secara berkala (misal saat produk dimuat atau kategori difilter)
    const interval = window.setInterval(handleScroll, 1200);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.clearInterval(interval);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  // Hanya aktif jika halaman memang memiliki konten panjang yang bisa di-scroll
  if (!isScrollable) return null;

  const isVisible = (isScrolling || isHovered) && isScrollable;
  const showTop = isVisible && !atTop;
  const showBottom = isVisible && !atBottom;

  return (
    <>
      {/* Tombol Tengah Atas: Gulir ke Paling Atas */}
      <div
        className={`no-print fixed top-20 left-1/2 lg:left-[calc(50%+8rem)] -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
          showTop
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => {
            window.setTimeout(() => setIsHovered(false), 1400);
          }}
          title="Gulir ke Paling Atas"
          aria-label="Gulir ke paling atas"
          className="flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-white/95 px-4 py-2 text-stone-700 shadow-xl backdrop-blur-md transition hover:bg-amber-50 hover:text-[var(--color-terracotta)] hover:border-amber-300 hover:shadow-2xl active:scale-95"
        >
          <ChevronUp className="h-4 w-4 text-[var(--color-terracotta)]" />
          <span className="text-xs font-extrabold tracking-tight">Gulir ke Atas</span>
        </button>
      </div>

      {/* Tombol Tengah Bawah: Gulir ke Paling Bawah */}
      <div
        className={`no-print fixed bottom-20 sm:bottom-6 left-1/2 lg:left-[calc(50%+8rem)] -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
          showBottom
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={scrollToBottom}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => {
            window.setTimeout(() => setIsHovered(false), 1400);
          }}
          title="Gulir ke Paling Bawah"
          aria-label="Gulir ke paling bawah"
          className="flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-white/95 px-4 py-2 text-stone-700 shadow-xl backdrop-blur-md transition hover:bg-amber-50 hover:text-[var(--color-terracotta)] hover:border-amber-300 hover:shadow-2xl active:scale-95"
        >
          <span className="text-xs font-extrabold tracking-tight">Gulir ke Bawah</span>
          <ChevronDown className="h-4 w-4 text-[var(--color-terracotta)]" />
        </button>
      </div>
    </>
  );
}
