"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  hideClose?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="no-print absolute inset-0 bg-choco/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`no-print relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${maxWidth}`}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-stone-200 px-5 py-4">
            <div>
              {title && (
                <h2 className="text-lg font-bold text-stone-800">{title}</h2>
              )}
              {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
