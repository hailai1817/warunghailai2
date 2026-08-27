import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-terracotta)]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-bold text-stone-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
