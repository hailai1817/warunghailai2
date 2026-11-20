"use client";

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });
}

export function resizeImage(
  dataUrl: string,
  maxWidth = 360,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(dataUrl);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas tidak didukung di peramban ini");
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

export function validateImageFile(file?: File | null): string | null {
  if (!file) return "Pilih file gambar terlebih dahulu.";
  if (!file.type.startsWith("image/")) {
    return "File yang dipilih bukan gambar valid (harus JPG, PNG, atau WebP).";
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return "Ukuran file terlalu besar (maksimal 5MB).";
  }
  return null;
}
