"use client";

import {
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
  canEdit?: boolean;
}

export default function EmployeeDetailModal({
  employee,
  onClose,
  onEdit,
  canEdit = false,
}: EmployeeDetailModalProps) {
  if (!employee) return null;

  const cleanPhone = employee.phone ? employee.phone.replace(/[^\d+]/g, "") : "";
  const waNumber = cleanPhone.startsWith("0")
    ? `62${cleanPhone.slice(1)}`
    : cleanPhone.startsWith("+")
      ? cleanPhone.slice(1)
      : cleanPhone;

  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title="Profil Lengkap Karyawan"
      subtitle={`Informasi data pribadi dan kontak resmi ${employee.name}`}
      maxWidth="max-w-lg"
    >
      <div className="max-h-[82vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        {/* Header Hero */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 p-5 text-center sm:flex-row sm:text-left">
          <Avatar
            src={employee.photo}
            name={employee.name}
            size="2xl"
            bordered
            className="shadow-md"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h3 className="text-xl font-extrabold text-stone-800">{employee.name}</h3>
              <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-xs font-bold text-stone-600">
                {employee.id}
              </span>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-600 sm:justify-start">
              <Briefcase className="h-3.5 w-3.5 text-[var(--color-terracotta)]" />
              {employee.position}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <Badge variant={employee.active ? "green" : "red"}>
                {employee.active ? "Sedang Bekerja (Aktif)" : "Nonaktif / Cuti"}
              </Badge>
              <span className="text-[11px] text-stone-400">
                Bergabung: {formatDateShort(employee.joinedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Bio if exists */}
        {employee.bio && (
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5 text-xs italic text-stone-700">
            &ldquo;{employee.bio}&rdquo;
          </div>
        )}

        {/* Data Kontak */}
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Informasi Kontak &amp; Komunikasi
          </h4>

          <div className="space-y-2.5 text-xs text-stone-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-dashed border-stone-100 pb-2">
              <span className="flex items-center gap-2 text-stone-500 font-medium">
                <Phone className="h-4 w-4 text-stone-400" />
                Nomor Telepon / WhatsApp:
              </span>
              {employee.phone ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{employee.phone}</span>
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Chat WA
                    </a>
                  )}
                </div>
              ) : (
                <span className="italic text-stone-400">Belum diisi</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-dashed border-stone-100 pb-2">
              <span className="flex items-center gap-2 text-stone-500 font-medium">
                <Mail className="h-4 w-4 text-stone-400" />
                Alamat Email:
              </span>
              {employee.email ? (
                <a
                  href={`mailto:${employee.email}`}
                  className="font-bold text-[var(--color-terracotta)] hover:underline inline-flex items-center gap-1"
                >
                  {employee.email}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="italic text-stone-400">Belum diisi</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pt-0.5">
              <span className="flex items-center gap-2 text-stone-500 font-medium shrink-0">
                <MapPin className="h-4 w-4 text-stone-400" />
                Alamat Tinggal:
              </span>
              <span className="font-semibold text-stone-800 sm:text-right max-w-xs">
                {employee.address || <span className="italic text-stone-400 font-normal">Belum diisi</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Data Pribadi & Darurat */}
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Data Pribadi &amp; Jadwal Kerja
          </h4>

          <div className="space-y-2.5 text-xs text-stone-700">
            <div className="flex items-center justify-between gap-2 border-b border-dashed border-stone-100 pb-2">
              <span className="flex items-center gap-2 text-stone-500 font-medium">
                <Clock className="h-4 w-4 text-stone-400" />
                Shift Kerja:
              </span>
              <span className="font-bold text-stone-800">
                {employee.shift || <span className="italic text-stone-400 font-normal">Fleksibel / Sesuai Jadwal</span>}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-dashed border-stone-100 pb-2">
              <span className="flex items-center gap-2 text-stone-500 font-medium">
                <Calendar className="h-4 w-4 text-stone-400" />
                Tanggal Lahir:
              </span>
              <span className="font-bold text-stone-800">
                {employee.birthDate ? formatDateShort(employee.birthDate) : <span className="italic text-stone-400 font-normal">Belum diisi</span>}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pt-0.5">
              <span className="flex items-center gap-2 text-stone-500 font-medium shrink-0">
                <HeartHandshake className="h-4 w-4 text-stone-400" />
                Kontak Darurat:
              </span>
              <span className="font-bold text-stone-800 sm:text-right">
                {employee.emergencyContact || <span className="italic text-stone-400 font-normal">Belum diisi</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
          >
            Tutup
          </button>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Data
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
