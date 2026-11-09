"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { Camera, ImagePlus, MessageSquarePlus, Trash2, User } from "lucide-react";
import type { CustomerReview } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import StarRating from "./StarRating";

interface ReviewFormModalProps {
  review?: CustomerReview | null;
  onClose: () => void;
  onSave: (data: Omit<CustomerReview, "id" | "date">) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_SIZE = 200; // 200x200 px square crop

const PRESET_AVATARS = [
  {
    label: "Wanita 1",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    label: "Pria 1",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
  {
    label: "Wanita 2",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    label: "Pria 2",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function resizeAvatar(dataUrl: string, size = AVATAR_SIZE, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak didukung");
        // Center-crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Gambar tidak dapat dimuat"));
    img.src = dataUrl;
  });
}

export default function ReviewFormModal({ review, onClose, onSave }: ReviewFormModalProps) {
  const [name, setName] = useState(review?.customerName ?? "");
  const [avatar, setAvatar] = useState(review?.avatar ?? "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("File yang dipilih bukan gambar.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUploadError("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeAvatar(dataUrl);
      setAvatar(resized);
    } catch {
      setUploadError("Gagal memproses gambar. Coba file lain.");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      setAvatar(trimmed);
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama pelanggan wajib diisi.";
    if (rating < 1 || rating > 5) nextErrors.rating = "Pilih rating 1 sampai 5.";
    if (!comment.trim()) nextErrors.comment = "Komentar wajib diisi.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      customerName: name.trim(),
      rating,
      comment: comment.trim(),
      avatar: avatar.trim() || undefined,
    });
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
      title={review ? "Edit Ulasan Pelanggan" : "Tambah Ulasan Pelanggan"}
      subtitle={
        review
          ? `Mengubah ulasan dari ${review.customerName}`
          : "Catat komentar, foto profil, dan rating dari pelanggan"
      }
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 p-5">
        {/* Foto Profil Pelanggan */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Foto Profil Pelanggan (opsional)
          </label>
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-stone-200/80 bg-stone-50/60 p-3.5 sm:flex-row sm:items-center">
            {/* Avatar Preview */}
            <div className="relative mx-auto flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-crust)] bg-white shadow-sm sm:mx-0">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Pratinjau Foto Profil"
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 text-stone-500">
                  {name.trim() ? (
                    <span className="text-xl font-extrabold">{name.trim().charAt(0).toUpperCase()}</span>
                  ) : (
                    <User className="h-7 w-7 text-stone-400" />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)]"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Unggah Foto
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  URL Gambar
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar("");
                      setUploadError("");
                    }}
                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                )}
              </div>

              {/* URL Input Bar */}
              {showUrlInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://contoh.com/foto.jpg"
                    className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-terracotta)]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="rounded-lg bg-[var(--color-terracotta)] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    Pasang
                  </button>
                </div>
              )}

              {/* Preset avatars */}
              <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                <span className="text-[11px] text-stone-400">Pilihan cepat:</span>
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    title={preset.label}
                    className="relative h-6 w-6 overflow-hidden rounded-full border border-stone-200 transition hover:scale-110 hover:border-[var(--color-terracotta)]"
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      fill
                      sizes="24px"
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {uploadError && <p className="mt-1 text-xs font-semibold text-red-600">{uploadError}</p>}
        </div>

        {/* Nama Pelanggan */}
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

        {/* Rating */}
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

        {/* Komentar */}
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
          {review ? "Simpan Perubahan" : "Simpan Ulasan"}
        </button>
      </div>
    </Modal>
  );
}
