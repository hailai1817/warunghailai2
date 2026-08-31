"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { Croissant, ImagePlus, PackagePlus, Save, Trash2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (data: Omit<Product, "id">) => void;
}

const EMPTY_FORM = {
  name: "",
  category: "Roti Manis" as Category,
  price: "",
  stock: "",
  image: "",
  barcode: "",
  description: "",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 800;

function initForm(product: Product | null): typeof EMPTY_FORM {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    image: product.image,
    barcode: product.barcode ?? "",
    description: product.description ?? "",
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function resizeImage(dataUrl: string, maxWidth = MAX_IMAGE_WIDTH, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak didukung");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Gambar tidak dapat dimuat"));
    img.src = dataUrl;
  });
}

export default function ProductFormModal({ product, onClose, onSave }: ProductFormModalProps) {
  const [form, setForm] = useState(() => initForm(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

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
      const resized = await resizeImage(dataUrl);
      setForm((prev) => ({ ...prev, image: resized }));
      setPreviewFailed(false);
    } catch {
      setUploadError("Gagal memproses gambar. Coba file lain.");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const price = parseInt(form.price, 10);
    const stock = parseInt(form.stock, 10);

    if (!form.name.trim()) nextErrors.name = "Nama produk wajib diisi.";
    if (Number.isNaN(price) || price <= 0) nextErrors.price = "Harga harus lebih dari 0.";
    if (Number.isNaN(stock) || stock < 0) nextErrors.stock = "Stok tidak boleh negatif.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      name: form.name.trim(),
      category: form.category,
      price,
      stock,
      image: form.image.trim() || product?.image || "",
      barcode: form.barcode.trim() || undefined,
      description: form.description.trim() || undefined,
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
      title={product ? "Edit Produk" : "Tambah Produk Baru"}
      subtitle={
        product
          ? `Mengubah data ${product.name} (${product.id})`
          : "Lengkapi detail produk untuk ditampilkan di katalog kasir"
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Nama Produk
          </label>
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="cth: Roti Sobek Pandan"
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Barcode (opsional)
          </label>
          <input
            value={form.barcode}
            onChange={(e) => setField("barcode", e.target.value)}
            placeholder="cth: 8990037282383"
            className={inputClass()}
          />
          <p className="mt-1 text-xs text-stone-400">
            Dibaca langsung oleh scanner di halaman Kasir. Kosongkan jika produk tidak memakai barcode.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Kategori
            </label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className={inputClass()}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Harga Jual (Rp)
            </label>
            <input
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setField("price", e.target.value.replace(/\D/g, ""))}
              placeholder="15000"
              className={inputClass(errors.price)}
            />
            {errors.price && <p className="mt-1 text-xs font-semibold text-red-600">{errors.price}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Stok (pcs)
            </label>
            <input
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value.replace(/\D/g, ""))}
              placeholder="10"
              className={inputClass(errors.stock)}
            />
            {errors.stock && <p className="mt-1 text-xs font-semibold text-red-600">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Foto Produk
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex items-start gap-3 rounded-2xl border-2 border-dashed p-3 transition ${
              dragOver
                ? "border-[var(--color-terracotta)] bg-amber-50"
                : "border-stone-300 bg-stone-50"
            }`}
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--color-crust)]/60">
              {form.image && !previewFailed ? (
                <Image
                  src={form.image}
                  alt="Pratinjau produk"
                  fill
                  sizes="80px"
                  unoptimized
                  onError={() => setPreviewFailed(true)}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--color-terracotta)]">
                  <Croissant className="h-9 w-9" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-700">
                {form.image ? "Foto produk sudah dipilih" : "Belum ada foto"}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                Pilih gambar dari perangkat, atau seret &amp; letakkan di sini. Format PNG / JPG,
                maks. 5MB.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-terracotta)] px-3 py-2 text-xs font-bold text-white shadow transition hover:opacity-90"
                >
                  <ImagePlus className="h-4 w-4" />
                  {form.image ? "Ganti Gambar" : "Pilih Gambar"}
                </button>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, image: "" }));
                      setPreviewFailed(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Foto
                  </button>
                )}
              </div>
              {uploadError && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{uploadError}</p>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Deskripsi (opsional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={2}
            placeholder="Deskripsi singkat produk..."
            className={inputClass()}
          />
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
          {product ? <Save className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
          {product ? "Simpan Perubahan" : "Tambah Produk"}
        </button>
      </div>
    </Modal>
  );
}
