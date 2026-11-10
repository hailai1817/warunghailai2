"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Save, UserPlus } from "lucide-react";
import type { Employee } from "@/lib/types";
import type { EmployeeMutationResult } from "@/context/StoreContext";
import Modal from "@/components/ui/Modal";

interface EmployeeFormModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSave: (data: Omit<Employee, "id" | "joinedAt">) => EmployeeMutationResult;
}

const POSITION_PRESETS = ["Kasir", "Kasir Utama", "Kasir & Barista", "Staff Bakery"];
const SHIFT_PRESETS = [
  "Pagi (07:00 - 15:00)",
  "Sore (14:00 - 22:00)",
  "Full Time (08:00 - 17:00)",
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
  const [active, setActive] = useState(employee?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          ? `Perbarui data dan status kerja ${employee.name}`
          : "Karyawan aktif terdaftar otomatis bisa login menggunakan role Kasir"
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
            Nama Karyawan
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
            Jabatan / Posisi
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Shift Kerja (opsional)
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
              No. HP / WhatsApp (opsional)
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="cth: 0812-xxxx-xxxx"
              className={inputClass()}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
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

        <div className="flex justify-end gap-2 pt-2">
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
