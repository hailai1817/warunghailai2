"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
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
  const [position, setPosition] = useState<"top" | "bottom">("bottom");
  const [isIdle, setIsIdle] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const autoScrollRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(0);
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
        const isNearTop = scrollY <= 30;
        const isNearBottom = scrollY >= maxScroll - 35;

        setAtTop(isNearTop);
        setAtBottom(isNearBottom);

        const percent = Math.min(100, Math.max(0, Math.round((scrollY / maxScroll) * 100)));
        setProgress(percent);

        // Calculate scroll delta to determine direction
        const delta = scrollY - lastScrollYRef.current;
        const SCROLL_THRESHOLD = 10; // Avoid jitter from tiny micro-scrolls

        if (isNearTop) {
          // At top of page: position at bottom so user can inspect top header & search without obstruction
          setPosition("bottom");
        } else if (isNearBottom) {
          // At bottom of page: position at top so user can see bottom buttons, footer, and pagination
          setPosition("top");
        } else if (delta > SCROLL_THRESHOLD) {
          // User is scrolling DOWN: move button to TOP to keep reading content clear
          setPosition("top");
        } else if (delta < -SCROLL_THRESHOLD) {
          // User is scrolling UP: move button to BOTTOM to keep upper content clear
          setPosition("bottom");
        }

        lastScrollYRef.current = scrollY;
        resetIdleTimer();
      } else {
        setAtTop(true);
        setAtBottom(true);
        setProgress(0);
      }
    };

    handleScroll();
    resetIdleTimer();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Periodic check in case dynamic content (e.g. loaded products) changes height
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
    // Move widget to top during auto-scroll so reading area at the bottom stays completely clear
    setPosition("top");

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

  const togglePosition = () => {
    setPosition((prev) => (prev === "top" ? "bottom" : "top"));
  };

  // Only render when the page actually has long scrollable content
  if (!isScrollable) return null;

  const isTop = position === "top";

  return (
    <div
      aria-label="Kontrol Gulir Otomatis Halaman"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        window.setTimeout(() => setIsHovered(false), 2000);
      }}
      className={`no-print fixed right-3.5 sm:right-6 z-40 flex flex-col items-center gap-1.5 transition-all duration-500 ease-in-out ${
        isTop
          ? "top-20"
          : "top-[calc(100dvh-14.5rem)] sm:top-[calc(100dvh-11rem)]"
      } ${
        isIdle && !isHovered && !isAutoScrolling
          ? "opacity-35 hover:opacity-100"
          : "opacity-100"
      }`}
    >
      {/* Active Auto-scroll status pill */}
      {isAutoScrolling && (
        <button
          type="button"
          onClick={stopAutoScroll}
          className="flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white shadow-xl animate-pulse"
        >
          <Pause className="h-3 w-3 fill-white" />
          <span>Gulir Berjalan...</span>
        </button>
      )}

      {/* Floating Controller Container */}
      <div className="flex flex-col items-center rounded-2xl border border-stone-200/90 bg-white/90 p-1 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:shadow-xl hover:shadow-orange-200/40">
        {/* Scroll To Top Button */}
        <button
          type="button"
          onClick={scrollToTop}
          disabled={atTop}
          title="Gulir ke Paling Atas"
          aria-label="Gulir ke paling atas"
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            atTop
              ? "cursor-not-allowed text-stone-300"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        {/* Continuous Auto-scroll Toggle Button */}
        <button
          type="button"
          onClick={toggleAutoScroll}
          title={isAutoScrolling ? "Jeda Gulir Otomatis" : "Mulai Gulir Otomatis Berjalan"}
          aria-label="Mulai atau jeda gulir otomatis"
          className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
            isAutoScrolling
              ? "bg-[var(--color-terracotta)] text-white shadow-inner"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          {isAutoScrolling ? (
            <Pause className="h-3.5 w-3.5 fill-white" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
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
          title="Gulir ke Paling Bawah"
          aria-label="Gulir ke paling bawah"
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            atBottom
              ? "cursor-not-allowed text-stone-300"
              : "text-stone-700 hover:bg-amber-100/70 hover:text-[var(--color-terracotta)] active:scale-95"
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Manual Flip Position Button (Top <-> Bottom) */}
        <div className="mt-0.5 border-t border-stone-200/70 pt-0.5">
          <button
            type="button"
            onClick={togglePosition}
            title={isTop ? "Pindahkan ke Bawah" : "Pindahkan ke Atas"}
            aria-label="Tukar posisi tombol atas/bawah"
            className="flex h-7 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 active:scale-90"
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
