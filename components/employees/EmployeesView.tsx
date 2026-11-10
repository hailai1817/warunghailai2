"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Info,
  Pencil,
  Phone,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import { useStore } from "@/context/StoreContext";
import { formatDateShort } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import EmployeeFormModal from "./EmployeeFormModal";

type StatusFilter = "semua" | "aktif" | "nonaktif";

export default function EmployeesView() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const stats = useMemo(() => {
    const activeCount = employees.filter((e) => e.active).length;
    return {
      active: activeCount,
      total: employees.length,
      inactive: employees.length - activeCount,
    };
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        (e.shift ?? "").toLowerCase().includes(q) ||
        (e.phone ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "semua"
          ? true
          : statusFilter === "aktif"
            ? e.active
            : !e.active;
      return matchSearch && matchStatus;
    });
  }, [employees, search, statusFilter]);

  const handleSave = (data: Omit<Employee, "id" | "joinedAt">) => {
    const res = editing ? updateEmployee(editing.id, data) : addEmployee(data);
    if (res.ok) {
      setFormOpen(false);
      setEditing(null);
    }
    return res;
  };

  const chipClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${
      active
        ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow"
        : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300"
    }`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Sedang Bekerja Saat Ini"
          value={stats.active}
          icon={<UserCheck className="h-6 w-6" />}
          accent="green"
          hint="diizinkan login sebagai Kasir"
        />
        <StatCard
          label="Total Karyawan Terdaftar"
          value={stats.total}
          icon={<Users className="h-6 w-6" />}
          accent="terracotta"
          hint="seluruh staf warung"
        />
        <StatCard
          label="Nonaktif / Cuti"
          value={stats.inactive}
          icon={<UserX className="h-6 w-6" />}
          accent="amber"
          hint="akses login kasir ditangguhkan"
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 sm:text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p>
          Hanya karyawan yang terdaftar dengan status <b>Sedang Bekerja (Aktif)</b> yang dapat
          masuk melalui halaman login kategori <b>Kasir</b> menggunakan namanya. Anda dapat
          mendaftarkan karyawan baru atau mengubah status kerjanya di sini.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, jabatan, shift..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter("semua")}
              className={chipClass(statusFilter === "semua")}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("aktif")}
              className={chipClass(statusFilter === "aktif")}
            >
              Bekerja Saat Ini ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter("nonaktif")}
              className={chipClass(statusFilter === "nonaktif")}
            >
              Nonaktif ({stats.inactive})
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Daftarkan Karyawan Baru
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                emp.active
                  ? "border-stone-200/80 bg-white"
                  : "border-stone-200/60 bg-stone-50/80 opacity-85"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white shadow ${
                        emp.active
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                          : "bg-gradient-to-br from-stone-400 to-stone-500"
                      }`}
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-stone-800">{emp.name}</p>
                      <p className="flex items-center gap-1 text-xs font-semibold text-stone-500">
                        <Briefcase className="h-3 w-3 text-[var(--color-terracotta)]" />
                        {emp.position}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-500">
                    {emp.id}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={emp.active ? "green" : "red"}>
                    {emp.active ? "Sedang Bekerja" : "Nonaktif"}
                  </Badge>
                  <span className="text-[11px] text-stone-400">
                    Terdaftar: {formatDateShort(emp.joinedAt)}
                  </span>
                </div>

                <div className="mt-3 space-y-1 border-t border-dashed border-stone-100 pt-3 text-xs text-stone-600">
                  {emp.shift && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      {emp.shift}
                    </p>
                  )}
                  {emp.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-stone-400" />
                      {emp.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                <button
                  onClick={() => updateEmployee(emp.id, { active: !emp.active })}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    emp.active
                      ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {emp.active ? "Nonaktifkan" : "Aktifkan Bekerja"}
                </button>
                <button
                  onClick={() => {
                    setEditing(emp);
                    setFormOpen(true);
                  }}
                  aria-label={`Edit ${emp.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-400 transition hover:border-amber-300 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(emp)}
                  aria-label={`Hapus ${emp.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={employees.length === 0 ? "Belum ada karyawan terdaftar" : "Karyawan tidak ditemukan"}
          description={
            employees.length === 0
              ? "Daftarkan karyawan pertama agar mereka dapat login sebagai Kasir."
              : "Coba ubah filter status atau kata kunci pencarian Anda."
          }
          action={
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-terracotta)] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" />
              Daftarkan Karyawan Baru
            </button>
          }
        />
      )}

      {formOpen && (
        <EmployeeFormModal
          employee={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus Data Karyawan"
        message={`Karyawan "${deleting?.name}" akan dihapus permanen dan tidak bisa lagi login sebagai Kasir. Lanjutkan?`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteEmployee(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
