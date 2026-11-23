"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AutoScrollWidget() {
  const [isScrollable, setIsScrollable] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, 2500);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      const scrollable = maxScroll > 140;
      setIsScrollable(scrollable);

      if (scrollable) {
        setAtTop(scrollY <= 25);
        setAtBottom(scrollY >= maxScroll - 25);
        resetIdleTimer();
      } else {
        setAtTop(true);
        setAtBottom(true);
      }
    };

    handleScroll();
    resetIdleTimer();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Periodic check in case dynamic content (e.g. loaded products, expand/collapse) changes height
    const interval = window.setInterval(handleScroll, 1200);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.clearInterval(interval);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
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

  // Only render when the page actually has scrollable content
  if (!isScrollable) return null;

  return (
    <div
      aria-label="Tombol Navigasi Gulir Halaman"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        window.setTimeout(() => setIsHovered(false), 2000);
      }}
      className={`no-print fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center transition-all duration-300 ease-in-out ${
        isIdle && !isHovered
          ? "opacity-35 hover:opacity-100"
          : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-stone-200/90 bg-white/90 p-1 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:shadow-xl hover:shadow-orange-200/40">
        {/* Tombol Gulir ke Atas */}
        <button
          type="button"
          onClick={scrollToTop}
          disabled={atTop}
          title="Gulir ke Paling Atas"
          aria-label="Gulir ke paling atas"
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            atTop
              ? "cursor-not-allowed text-stone-300"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        {/* Separator tipis */}
        <div className="h-px w-5 bg-stone-200/80" />

        {/* Tombol Gulir ke Bawah */}
        <button
          type="button"
          onClick={scrollToBottom}
          disabled={atBottom}
          title="Gulir ke Paling Bawah"
          aria-label="Gulir ke paling bawah"
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            atBottom
              ? "cursor-not-allowed text-stone-300"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
