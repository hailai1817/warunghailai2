"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  HeartHandshake,
  Info,
  Mail,
  MapPin,
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
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatDateShort } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import EmployeeFormModal from "./EmployeeFormModal";
import EmployeeDetailModal from "./EmployeeDetailModal";

type StatusFilter = "semua" | "aktif" | "nonaktif";

export default function EmployeesView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
        (e.phone ?? "").toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.address ?? "").toLowerCase().includes(q);
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
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Sedang Bekerja Saat Ini"
          value={stats.active}
          icon={<UserCheck className="h-6 w-6" />}
          accent="green"
          hint="staf aktif siap melayani"
        />
        <StatCard
          label="Total Karyawan Terdaftar"
          value={stats.total}
          icon={<Users className="h-6 w-6" />}
          accent="terracotta"
          hint="seluruh staf & admin warung"
        />
        <StatCard
          label="Nonaktif / Cuti"
          value={stats.inactive}
          icon={<UserX className="h-6 w-6" />}
          accent="amber"
          hint="akses login kasir ditangguhkan"
        />
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 sm:text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p>
          {isAdmin ? (
            <>
              <b>Direktori &amp; Manajemen Karyawan:</b> Anda dapat mendaftarkan karyawan baru,
              mengatur status aktif/nonaktif, memperbarui profil, serta melihat data pribadi dan
              kontak darurat seluruh tim.
            </>
          ) : (
            <>
              <b>Direktori Profil Karyawan:</b> Anda dapat melihat profil, jadwal shift, dan data
              kontak seluruh staf untuk koordinasi operasional kerja di toko.
            </>
          )}
        </p>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, jabatan, shift, email..."
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

        {isAdmin ? (
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
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-900">
            <UserCheck className="h-3.5 w-3.5 text-amber-600" />
            Mode Direktori Karyawan
          </div>
        )}
      </div>

      {/* Grid of Employee Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((emp) => {
            const isCurrentUser =
              emp.id === user?.employeeId ||
              emp.name.toLowerCase() === user?.name.toLowerCase();

            return (
              <div
                key={emp.id}
                className={`flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                  emp.active
                    ? isCurrentUser
                      ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-300"
                      : "border-stone-200/80 bg-white"
                    : "border-stone-200/60 bg-stone-50/80 opacity-85"
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div
                    onClick={() => setSelectedEmployee(emp)}
                    className="flex cursor-pointer items-start justify-between gap-2 group"
                    title="Klik untuk melihat profil lengkap"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={emp.photo}
                        name={emp.name}
                        size="lg"
                        className="shadow-sm transition group-hover:scale-105"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-extrabold text-stone-800 group-hover:text-[var(--color-terracotta)] transition">
                            {emp.name}
                          </p>
                          {isCurrentUser && (
                            <span className="rounded bg-amber-200/70 px-1.5 py-0.2 text-[9px] font-bold text-amber-900">
                              Saya
                            </span>
                          )}
                        </div>
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

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={emp.active ? "green" : "red"}>
                      {emp.active ? "Sedang Bekerja" : "Nonaktif"}
                    </Badge>
                    <span className="text-[11px] text-stone-400">
                      Terdaftar: {formatDateShort(emp.joinedAt)}
                    </span>
                  </div>

                  {/* Personal details summary */}
                  <div className="mt-3 space-y-1.5 border-t border-dashed border-stone-100 pt-3 text-xs text-stone-600">
                    {emp.shift && (
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">{emp.shift}</span>
                      </p>
                    )}
                    {emp.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{emp.phone}</span>
                      </p>
                    )}
                    {emp.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">{emp.email}</span>
                      </p>
                    )}
                    {emp.address && (
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">{emp.address}</span>
                      </p>
                    )}
                    {emp.emergencyContact && (
                      <p className="flex items-center gap-1.5 truncate text-[11px] text-stone-500">
                        <HeartHandshake className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">Darurat: {emp.emergencyContact}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(emp)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-600" />
                    Lihat Profil
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => updateEmployee(emp.id, { active: !emp.active })}
                        className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                          emp.active
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {emp.active ? "Nonaktifkan" : "Aktifkan"}
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
                    </>
                  )}

                  {!isAdmin && isCurrentUser && (
                    <button
                      onClick={() => {
                        setEditing(emp);
                        setFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                    >
                      <Pencil className="h-3.5 w-3.5 text-amber-600" />
                      Edit Profil Saya
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
            isAdmin ? (
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
            ) : undefined
          }
        />
      )}

      {/* Detail Modal */}
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        canEdit={Boolean(
          isAdmin ||
            (selectedEmployee &&
              (selectedEmployee.id === user?.employeeId ||
                selectedEmployee.name.toLowerCase() === user?.name.toLowerCase()))
        )}
        onEdit={(emp) => {
          setEditing(emp);
          setFormOpen(true);
        }}
      />

      {/* Edit / Create Form Modal */}
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

      {/* Delete Confirmation Dialog */}
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
