"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Camera,
  Check,
  Save,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import type { EmployeeMutationResult } from "@/context/StoreContext";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import { fileToDataUrl, resizeImage, validateImageFile } from "@/lib/image-upload";

interface EmployeeFormModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSave: (data: Omit<Employee, "id" | "joinedAt">) => EmployeeMutationResult;
}

const POSITION_PRESETS = [
  "Kasir",
  "Kasir Utama",
  "Kasir & Barista",
  "Staff Bakery",
  "Pemilik & Administrator",
];

const SHIFT_PRESETS = [
  "Pagi (07:00 - 15:00)",
  "Sore (14:00 - 22:00)",
  "Full Time (08:00 - 17:00)",
  "Full Time (Owner)",
];

export default function EmployeeFormModal({
  employee,
  onClose,
  onSave,
}: EmployeeFormModalProps) {
  const [name, setName] = useState(employee?.name ?? "");
  const [position, setPosition] = useState(employee?.position ?? "Kasir");
  const [shift, setShift] = useState(employee?.shift ?? SHIFT_PRESETS[0]);
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [address, setAddress] = useState(employee?.address ?? "");
  const [birthDate, setBirthDate] = useState(employee?.birthDate ?? "");
  const [emergencyContact, setEmergencyContact] = useState(
    employee?.emergencyContact ?? ""
  );
  const [bio, setBio] = useState(employee?.bio ?? "");
  const [photo, setPhoto] = useState<string | undefined>(employee?.photo);
  const [active, setActive] = useState(employee?.active ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationErr = validateImageFile(file);
    if (validationErr) {
      setUploadError(validationErr);
      return;
    }

    setUploadError("");
    setIsProcessingImg(true);

    try {
      const rawData = await fileToDataUrl(file);
      const optimized = await resizeImage(rawData, 360, 0.78);
      setPhoto(optimized);
    } catch {
      setUploadError("Gagal memproses gambar. Coba gambar lain.");
    } finally {
      setIsProcessingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama karyawan wajib diisi.";
    if (!position.trim()) nextErrors.position = "Posisi / jabatan wajib diisi.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const res = onSave({
      name: name.trim(),
      position: position.trim(),
      shift: shift.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      bio: bio.trim() || undefined,
      photo: photo || undefined,
      active,
    });

    if (!res.ok) {
      setErrors({ name: res.error });
    }
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
      title={employee ? "Edit Data Karyawan" : "Daftarkan Karyawan Baru"}
      subtitle={
        employee
          ? `Perbarui profil, foto, dan status kerja ${employee.name}`
          : "Karyawan aktif terdaftar otomatis bisa login menggunakan role Kasir"
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="max-h-[82vh] space-y-4 overflow-y-auto p-1 pr-2">
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 sm:flex-row">
          <div className="relative shrink-0">
            <Avatar
              src={photo}
              name={name || "Karyawan"}
              size="xl"
              bordered
              className="shadow-sm"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah Foto"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-terracotta)] text-white shadow"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <p className="text-xs font-bold text-stone-700">Foto Profil Karyawan</p>
            <p className="text-[11px] text-stone-500">
              Format JPG, PNG, atau WebP (maksimal 5MB). Foto akan dioptimalkan otomatis.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImg}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5 text-amber-600" />
                {isProcessingImg ? "Memproses..." : photo ? "Ganti Foto" : "Unggah Foto"}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto("")}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus
                </button>
              )}
            </div>
            {uploadError && (
              <p className="text-xs font-semibold text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Nama Karyawan <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="cth: Salsa Putri"
            className={inputClass(errors.name)}
          />
          {errors.name && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Jabatan / Posisi <span className="text-red-500">*</span>
          </label>
          <input
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              setErrors((prev) => ({ ...prev, position: "" }));
            }}
            placeholder="cth: Kasir"
            className={inputClass(errors.position)}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {POSITION_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPosition(p);
                  setErrors((prev) => ({ ...prev, position: "" }));
                }}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  position === p
                    ? "border-[var(--color-terracotta)] bg-amber-50 text-[var(--color-terracotta)]"
                    : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {errors.position && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.position}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Shift Kerja
            </label>
            <input
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              placeholder="cth: Pagi (07:00 - 15:00)"
              className={inputClass()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              No. HP / WhatsApp
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="cth: 0812-xxxx-xxxx"
              className={inputClass()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cth: nama@gmail.com"
              className={inputClass()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Tanggal Lahir
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass()}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Alamat Lengkap
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="cth: Jl. Cihampelas No. 42, Bandung"
              className={inputClass()}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Kontak Darurat
            </label>
            <input
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="cth: Budi Kusuma (Ayah) - 0812-9988-7766"
              className={inputClass()}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Bio / Catatan Pribadi
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Catatan keahlian, prestasi, atau informasi staf..."
              className={inputClass()}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 transition hover:border-amber-300">
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((prev) => !prev)}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
              active
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-stone-300 bg-white text-transparent"
            }`}
          >
            <Check className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-bold text-stone-800">
              Status Sedang Bekerja (Aktif)
            </p>
            <p className="text-xs text-stone-500">
              {active
                ? "Aktif — Karyawan dapat langsung login ke sistem menggunakan role Kasir."
                : "Nonaktif — Karyawan sementara tidak bisa login sebagai Kasir."}
            </p>
          </div>
        </label>

        <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            {employee ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {employee ? "Simpan Perubahan" : "Daftarkan Karyawan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
