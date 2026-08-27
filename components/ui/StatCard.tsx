import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent: "amber" | "terracotta" | "choco" | "green" | "yellow" | "red" | "blue";
  hint?: string;
}

const ACCENTS: Record<StatCardProps["accent"], string> = {
  amber: "from-amber-500 to-orange-500",
  terracotta: "from-[var(--color-terracotta)] to-orange-600",
  choco: "from-[var(--color-choco)] to-[#7A4A2B]",
  green: "from-emerald-500 to-teal-600",
  yellow: "from-yellow-500 to-amber-600",
  red: "from-rose-500 to-red-600",
  blue: "from-sky-500 to-indigo-500",
};

export default function StatCard({ label, value, icon, accent, hint }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${ACCENTS[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <p className="truncate text-xl font-extrabold text-stone-800 sm:text-2xl">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-stone-400">{hint}</p>}
      </div>
    </div>
  );
}
