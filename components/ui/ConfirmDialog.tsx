"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--color-terracotta)] hover:bg-[#a84a28]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
