import type { ReactNode } from "react";

type BadgeVariant = "amber" | "terracotta" | "choco" | "green" | "yellow" | "red" | "cream" | "gray";

const STYLES: Record<BadgeVariant, string> = {
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  terracotta: "bg-[var(--color-terracotta)] text-white",
  choco: "bg-[var(--color-choco)] text-cream",
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  yellow: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  cream: "bg-[var(--color-cream)] text-[var(--color-choco)] ring-[var(--color-crust)]",
  gray: "bg-stone-100 text-stone-600 ring-stone-200",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "amber", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
