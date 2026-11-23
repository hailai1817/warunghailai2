"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
} from "lucide-react";

export default function AutoScrollWidget() {
  const [isScrollable, setIsScrollable] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoScrollRef = useRef<number | null>(null);

  useEffect(() => {
    const checkScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      const scrollable = maxScroll > 140;
      setIsScrollable(scrollable);

      if (scrollable) {
        setAtTop(scrollY <= 20);
        setAtBottom(scrollY >= maxScroll - 25);
        const percent = Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100)));
        setProgress(percent);
      } else {
        setAtTop(true);
        setAtBottom(true);
        setProgress(0);
      }
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    // Recheck periodically in case dynamic content (e.g. loaded products) changes height
    const interval = window.setInterval(checkScroll, 1200);

    return () => {
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      window.clearInterval(interval);
    };
  }, []);

  const stopAutoScroll = () => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    setIsAutoScrolling(false);
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    setIsAutoScrolling(true);

    const step = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;

      if (window.scrollY >= maxScroll - 5) {
        stopAutoScroll();
        return;
      }

      window.scrollBy({ top: 2, behavior: "auto" });
      autoScrollRef.current = requestAnimationFrame(step);
    };

    autoScrollRef.current = requestAnimationFrame(step);
  };

  // Stop auto-scroll if user manually touches or scrolls with wheel
  useEffect(() => {
    const handleUserInteraction = () => {
      if (autoScrollRef.current !== null) {
        stopAutoScroll();
      }
    };

    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchmove", handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchmove", handleUserInteraction);
      if (autoScrollRef.current !== null) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    stopAutoScroll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    stopAutoScroll();
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  // Only render when the page actually has long scrollable content
  if (!isScrollable) return null;

  return (
    <div
      aria-label="Kontrol Gulir Otomatis Halaman"
      className="no-print fixed bottom-20 right-3.5 z-40 flex flex-col items-center gap-1.5 sm:bottom-6 sm:right-6"
    >
      {/* Active Auto-scroll status pill */}
      {isAutoScrolling && (
        <button
          onClick={stopAutoScroll}
          className="flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white shadow-xl animate-pulse"
        >
          <Pause className="h-3 w-3 fill-white" />
          <span>Gulir Otomatis Berjalan</span>
        </button>
      )}

      {/* Floating Controller Container */}
      <div className="flex flex-col items-center rounded-2xl border border-stone-200/90 bg-white/95 p-1 shadow-2xl backdrop-blur-md transition-all hover:shadow-orange-200/50">
        {/* Scroll To Top Button */}
        <button
          type="button"
          onClick={scrollToTop}
          disabled={atTop}
          title="Gulir Otomatis ke Paling Atas"
          aria-label="Gulir ke paling atas"
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            atTop
              ? "cursor-not-allowed text-stone-300"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        {/* Continuous Auto-scroll Toggle Button */}
        <button
          type="button"
          onClick={toggleAutoScroll}
          title={isAutoScrolling ? "Jeda Gulir Otomatis" : "Mulai Gulir Otomatis Berjalan"}
          aria-label="Mulai atau jeda gulir otomatis"
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
            isAutoScrolling
              ? "bg-[var(--color-terracotta)] text-white shadow-inner"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          {isAutoScrolling ? (
            <Pause className="h-4 w-4 fill-white" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Scroll Progress Indicator */}
        <div
          title={`Posisi halaman: ${progress}%`}
          className="my-0.5 flex items-center justify-center py-0.5"
        >
          <span className="font-mono text-[9px] font-extrabold text-stone-500 tabular-nums">
            {progress}%
          </span>
        </div>

        {/* Scroll To Bottom Button */}
        <button
          type="button"
          onClick={scrollToBottom}
          disabled={atBottom}
          title="Gulir Otomatis ke Paling Bawah"
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
