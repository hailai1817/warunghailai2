"use client";

import { useEffect, useRef } from "react";

const SPARK_COLORS = [
  "var(--color-terracotta)",
  "var(--color-amber-400)",
  "var(--color-cream)",
  "var(--color-caramel)",
  "#ffffff",
];

export default function ClickSparks() {
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const spawnBurst = (x: number, y: number) => {
      for (let i = 0; i < 9; i++) {
        const spark = document.createElement("span");
        spark.className = "click-spark";
        const size = 4 + Math.random() * 6;
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + Math.random() * 50;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;
        spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * distance - 16}px`);
        spark.style.backgroundColor =
          SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0];
        holder.appendChild(spark);
        window.setTimeout(() => spark.remove(), 700);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest("button")) return;
      if (reduced) return;
      const el = e.target.closest("button") as HTMLButtonElement | null;
      if (el && el.disabled) return;
      spawnBurst(e.clientX, e.clientY);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      holder.querySelectorAll(".click-spark").forEach((node) => node.remove());
    };
  }, []);

  return <div ref={holderRef} aria-hidden className="click-spark-holder" />;
}