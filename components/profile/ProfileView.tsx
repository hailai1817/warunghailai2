"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Briefcase,
  Calendar,
  Camera,
  Check,
  Clock,
  HeartHandshake,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import type { Employee } from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import { fileToDataUrl, resizeImage, validateImageFile } from "@/lib/image-upload";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

const SHIFT_PRESETS = [
  "Pagi (07:00 - 15:00)",
  "Sore (14:00 - 22:00)",
  "Full Time (08:00 - 17:00)",
  "Full Time (Owner)",
];

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const { employees, updateEmployee, addEmployee } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find matching employee record
  const currentEmployee = useMemo<Employee | null>(() => {
    if (!user) return null;
    if (user.employeeId) {
      const found = employees.find((e) => e.id === user.employeeId);
      if (found) return found;
    }
    return (
      employees.find((e) => e.name.toLowerCase() === user.name.toLowerCase()) ?? null
    );
  }, [user, employees]);

  const [name, setName] = useState(currentEmployee?.name ?? user?.name ?? "");
  const [position, setPosition] = useState(
    currentEmployee?.position ?? (user?.role === "admin" ? "Administrator" : "Kasir")
  );
  const [shift, setShift] = useState(
    currentEmployee?.shift ?? (user?.role === "admin" ? "Full Time (Owner)" : SHIFT_PRESETS[0])
  );
  const [phone, setPhone] = useState(currentEmployee?.phone ?? "");
  const [email, setEmail] = useState(currentEmployee?.email ?? "");
  const [address, setAddress] = useState(currentEmployee?.address ?? "");
  const [birthDate, setBirthDate] = useState(currentEmployee?.birthDate ?? "");
  const [emergencyContact, setEmergencyContact] = useState(
    currentEmployee?.emergencyContact ?? ""
  );
  const [bio, setBio] = useState(currentEmployee?.bio ?? "");
  const [photo, setPhoto] = useState<string | undefined>(
    currentEmployee?.photo ?? user?.photo
  );

  const [uploadError, setUploadError] = useState("");
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [toast, setToast] = useState("");
  const [nameError, setNameError] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

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
      showToast("Foto profil berhasil dipilih!");
    } catch {
      setUploadError("Gagal memproses gambar. Coba gambar lain.");
    } finally {
      setIsProcessingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setPhoto("");
    setUploadError("");
    showToast("Foto profil dihapus.");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setNameError("Nama lengkap wajib diisi.");
      return;
    }
    setNameError("");

    const payload = {
      name: cleanName,
      position: position.trim() || (user?.role === "admin" ? "Administrator" : "Kasir"),
      shift: shift.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      bio: bio.trim() || undefined,
      photo: photo || undefined,
    };

    if (currentEmployee) {
      const res = updateEmployee(currentEmployee.id, payload);
      if (!res.ok) {
        setNameError(res.error);
        return;
      }
    } else {
      const res = addEmployee({
        ...payload,
        active: true,
      });
      if (!res.ok) {
        setNameError(res.error);
        return;
      }
    }

    // Synchronize AuthContext current user session
    updateUser({
      name: cleanName,
      photo: photo || undefined,
      employeeId: currentEmployee?.id ?? user?.employeeId,
    });

    showToast("Data profil karyawan berhasil diperbarui!");
  };

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-xl border-2 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:ring-2 ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
        : "border-stone-200 focus:border-[var(--color-terracotta)] focus:ring-[var(--color-terracotta)]/20"
    }`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {/* Avatar with Camera Overlay */}
          <div className="relative shrink-0">
            <div className="group relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar
                src={photo}
                name={name || user?.name || "Karyawan"}
                size="2xl"
                bordered
                className="shadow-lg transition group-hover:opacity-90"
              />
              <div
                title="Unggah Foto"
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-terracotta)] text-white shadow-md transition group-hover:scale-110"
              >
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-extrabold text-stone-800 sm:text-2xl">
                {name || user?.name}
              </h2>
              <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-bold text-stone-600">
                {currentEmployee?.id ?? (user?.role === "admin" ? "E00" : "Karyawan")}
              </span>
              <Badge variant={user?.role === "admin" ? "choco" : "amber"}>
                {user?.role === "admin" ? "Role: Admin" : "Role: Kasir"}
              </Badge>
              <Badge variant="green">Sedang Bekerja (Aktif)</Badge>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-500 sm:justify-start">
              <Briefcase className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
              {position || (user?.role === "admin" ? "Pemilik / Administrator" : "Staff Kasir")}
              {shift && (
                <>
                  <span className="text-stone-300">•</span>
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  <span>{shift}</span>
                </>
              )}
            </p>

            {bio && (
              <p className="max-w-xl text-xs italic text-stone-600 sm:line-clamp-2">
                &ldquo;{bio}&rdquo;
              </p>
            )}

            {/* Quick Photo Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImg}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5 text-amber-600" />
                {isProcessingImg ? "Memproses..." : photo ? "Ganti Foto Profil" : "Unggah Foto Profil"}
              </button>

              {photo && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus Foto
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-xs font-semibold text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        {currentEmployee?.joinedAt && (
          <div className="mt-4 border-t border-amber-200/60 pt-3 text-center sm:text-right">
            <span className="text-[11px] font-medium text-stone-400">
              Bergabung sejak: {formatDateShort(currentEmployee.joinedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Data Identitas & Pekerjaan */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white shadow">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-800">
                Data Identitas &amp; Pekerjaan
              </h3>
              <p className="text-xs text-stone-500">
                Informasi nama resmi, jabatan, dan jadwal kerja Anda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
                Nama Lengkap Karyawan <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="cth: Salsa Putri"
                className={inputClass(!!nameError)}
              />
              {nameError && (
                <p className="mt-1 text-xs font-semibold text-red-600">{nameError}</p>
              )}
              <p className="mt-1 text-[11px] text-stone-400">
                Nama ini digunakan saat login kategori Kasir dan tercetak pada struk belanja.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
                Posisi / Jabatan
              </label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="cth: Kasir Utama / Barista"
                className={inputClass()}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
                Shift Kerja
              </label>
              <input
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                placeholder="cth: Pagi (07:00 - 15:00)"
                className={inputClass()}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs font-semibold text-stone-400">Pilihan Cepat:</span>
                {SHIFT_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      shift === s
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Data Kontak & Alamat Pribadi */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-800">
                Kontak &amp; Alamat Pribadi
              </h3>
              <p className="text-xs text-stone-500">
                Data komunikasi untuk keperluan operasional dan koordinasi tim
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                <Phone className="h-3.5 w-3.5 text-stone-400" />
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="cth: 0812-3456-7890"
                className={inputClass()}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth: karyawan@gmail.com"
                className={inputClass()}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                Alamat Tempat Tinggal
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth: Jl. Cihampelas No. 42, RT 02 / RW 05, Bandung"
                className={inputClass()}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Informasi Tambahan & Kontak Darurat */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-800">
                Data Darurat &amp; Catatan Khusus
              </h3>
              <p className="text-xs text-stone-500">
                Kontak darurat dan catatan tambahan karyawan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass()}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                <HeartHandshake className="h-3.5 w-3.5 text-stone-400" />
                Kontak Darurat (Keluarga)
              </label>
              <input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="cth: Budi (Ayah) - 0812-9988-7766"
                className={inputClass()}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
                Bio Singkat / Catatan Karyawan
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan catatan, keahlian khusus, atau pesan singkat..."
                className={inputClass()}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            Simpan Perubahan Profil
          </button>
        </div>
      </form>

      {/* Floating Toast Alert */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-2xl">
            <Check className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
