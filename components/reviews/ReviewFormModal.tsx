"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import type { CustomerReview } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import StarRating from "./StarRating";

interface ReviewFormModalProps {
  onClose: () => void;
  onSave: (data: Omit<CustomerReview, "id" | "date">) => void;
}

export default function ReviewFormModal({ onClose, onSave }: ReviewFormModalProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama pelanggan wajib diisi.";
    if (rating < 1 || rating > 5) nextErrors.rating = "Pilih rating 1 sampai 5.";
    if (!comment.trim()) nextErrors.comment = "Komentar wajib diisi.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({ customerName: name.trim(), rating, comment: comment.trim() });
  };

  const inputClass = (hasError?: string) =>
    `w-full rounded-xl border-2 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:ring-2 ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
        : "border-stone-200 focus:border-[var(--color-terracotta)] focus:ring-[var(--color-terracotta)]/20"
    }`;

  return (
    <Modal
      open
      onClose={onClose}
      title="Tambah Ulasan Pelanggan"
      subtitle="Catat komentar dan rating dari pelanggan"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Nama Pelanggan
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="cth: Siti Rahayu"
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Rating
          </label>
          <div className="flex items-center gap-3 rounded-xl border-2 border-stone-200 bg-white px-3.5 py-2.5">
            <StarRating value={rating} onChange={setRating} size={24} />
            <span className="ml-auto text-sm font-extrabold tabular-nums text-stone-700">
              {rating}/5
            </span>
          </div>
          {errors.rating && <p className="mt-1 text-xs font-semibold text-red-600">{errors.rating}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Komentar
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setErrors((prev) => ({ ...prev, comment: "" }));
            }}
            rows={4}
            placeholder="Tuliskan komentar atau masukan pelanggan..."
            className={inputClass(errors.comment)}
          />
          {errors.comment && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.comment}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-4">
        <button
          onClick={onClose}
          className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
        >
          Batal
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Simpan Ulasan
        </button>
      </div>
    </Modal>
  );
}
