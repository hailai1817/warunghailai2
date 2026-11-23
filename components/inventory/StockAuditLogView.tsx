"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  PackagePlus,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { ProductActionType, UserRole } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { formatDateTime } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";

interface StockAuditLogViewProps {
  onBackToCatalog?: () => void;
}

type ActionFilter = "Semua" | ProductActionType;
type RoleFilter = "Semua" | UserRole;

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: number[] = [];
  pages.push(1);
  if (current > 3) {
    pages.push(-1);
  }
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push(-1);
  }
  pages.push(total);
  return pages;
}

export default function StockAuditLogView({ onBackToCatalog }: StockAuditLogViewProps) {
  const { user } = useAuth();
  const { productLogs, clearProductLogs } = useStore();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("Semua");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Semua");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [prevQuery, setPrevQuery] = useState({ search, actionFilter, roleFilter, pageSize });

  // Reset page when filters change (React 19 render-time state adjustment)
  if (
    prevQuery.search !== search ||
    prevQuery.actionFilter !== actionFilter ||
    prevQuery.roleFilter !== roleFilter ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({ search, actionFilter, roleFilter, pageSize });
    setCurrentPage(1);
  }

  const isAdmin = user?.role === "admin";

  // Filter logs
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productLogs.filter((log) => {
      const matchQuery =
        !q ||
        log.actorName.toLowerCase().includes(q) ||
        log.productName.toLowerCase().includes(q) ||
        log.productId.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);

      const matchAction = actionFilter === "Semua" || log.action === actionFilter;
      const matchRole = roleFilter === "Semua" || log.actorRole === roleFilter;

      return matchQuery && matchAction && matchRole;
    });
  }, [productLogs, search, actionFilter, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const tambah = productLogs.filter((l) => l.action === "tambah").length;
    const edit = productLogs.filter((l) => l.action === "edit").length;
    const hapus = productLogs.filter((l) => l.action === "hapus").length;
    return { total: productLogs.length, tambah, edit, hapus };
  }, [productLogs]);

  // Pagination calculations
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  // Strict Admin Role Guard: only admin may view this component
  if (!isAdmin) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8 text-rose-500" />}
          title="Akses Ditolak"
          description="Halaman riwayat perubahan stok hanya dapat diakses oleh akun Administrator."
          action={
            onBackToCatalog ? (
              <button
                type="button"
                onClick={onBackToCatalog}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-terracotta)] px-4 py-2 text-sm font-bold text-white shadow"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Katalog
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Admin Notice Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 via-amber-50/70 to-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900 sm:text-lg">
                Riwayat Perubahan Stok (Log Aktivitas Kasir)
              </h2>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                Khusus Admin
              </span>
            </div>
            <p className="text-xs text-stone-600 sm:text-sm mt-0.5">
              Catatan lengkap aktivitas kasir dan staf yang menambah, mengedit, atau menghapus produk di katalog warung.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onBackToCatalog && (
            <button
              type="button"
              onClick={onBackToCatalog}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Katalog
            </button>
          )}
          {productLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:text-rose-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan Riwayat
            </button>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Riwayat Perubahan"
          value={stats.total}
          icon={<History className="h-6 w-6" />}
          accent="choco"
          hint="aktivitas tercatat"
        />
        <StatCard
          label="Produk Baru Ditambah"
          value={stats.tambah}
          icon={<PackagePlus className="h-6 w-6" />}
          accent="green"
          hint="produk ditambahkan"
        />
        <StatCard
          label="Produk Diedit"
          value={stats.edit}
          icon={<Pencil className="h-6 w-6" />}
          accent="amber"
          hint="perubahan stok / harga"
        />
        <StatCard
          label="Produk Dihapus"
          value={stats.hapus}
          icon={<Trash2 className="h-6 w-6" />}
          accent="red"
          hint="produk dikeluarkan"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kasir, produk, rincian..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            >
              <option value="Semua">Semua Aksi</option>
              <option value="tambah">Tambah Produk</option>
              <option value="edit">Edit Produk</option>
              <option value="hapus">Hapus Produk</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-600 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            >
              <option value="Semua">Semua Peran</option>
              <option value="kasir">Khusus Kasir</option>
              <option value="admin">Khusus Admin</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-stone-500">
          Ditemukan <b className="text-stone-800">{filteredLogs.length}</b> riwayat
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-bold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Waktu &amp; Tanggal</th>
                <th className="px-4 py-3">Petugas (Kasir/Admin)</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Produk Terkait</th>
                <th className="px-4 py-3">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedLogs.map((log) => {
                const isAdd = log.action === "tambah";
                const isEdit = log.action === "edit";
                const isDelete = log.action === "hapus";

                return (
                  <tr
                    key={log.id}
                    className="transition hover:bg-amber-50/40"
                  >
                    {/* Waktu & Tanggal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-stone-800 text-xs">
                        {formatDateTime(log.date)}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {log.id}
                      </p>
                    </td>

                    {/* Petugas */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={log.actorPhoto}
                          name={log.actorName}
                          size="sm"
                          bordered
                        />
                        <div>
                          <p className="font-bold text-stone-800 text-xs">
                            {log.actorName}
                          </p>
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                              log.actorRole === "kasir"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {log.actorRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Aksi Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isAdd && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                          <PackagePlus className="h-3.5 w-3.5" />
                          Tambah Produk
                        </span>
                      )}
                      {isEdit && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Produk
                        </span>
                      )}
                      {isDelete && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700">
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Produk
                        </span>
                      )}
                    </td>

                    {/* Produk Terkait */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-400">
                          {log.productId}
                        </span>
                        <p className="font-bold text-stone-800 text-xs truncate max-w-[180px]">
                          {log.productName}
                        </p>
                      </div>
                    </td>

                    {/* Rincian Perubahan */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-stone-700 font-medium">
                        {log.details}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<History className="h-8 w-8 text-stone-400" />}
              title="Tidak ada riwayat ditemukan"
              description="Belum ada catatan aktivitas perubahan produk yang cocok dengan filter atau kata kunci pencarian."
            />
          </div>
        )}

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-stone-200/80 bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
              <span>
                Menampilkan <b>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</b> dari <b>{totalItems}</b> riwayat
              </span>
              <span className="hidden text-stone-300 sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-bold text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
                >
                  <option value={5}>5 riwayat</option>
                  <option value={8}>8 riwayat</option>
                  <option value={10}>10 riwayat</option>
                  <option value={15}>15 riwayat</option>
                  <option value={20}>20 riwayat</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 self-center sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  title="Halaman Pertama"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  title="Halaman Sebelumnya"
                  className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) =>
                    p === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-stone-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                          safeCurrentPage === p
                            ? "bg-[var(--color-terracotta)] text-white shadow-sm"
                            : "border border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  title="Halaman Berikutnya"
                  className="flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  title="Halaman Terakhir"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog Konfirmasi Pembersihan Riwayat */}
      <ConfirmDialog
        open={confirmClearOpen}
        title="Bersihkan Semua Riwayat Kasir"
        message="Seluruh catatan riwayat perubahan stok yang telah tercatat akan dikosongkan. Aksi ini tidak dapat dibatalkan. Lanjutkan?"
        confirmLabel="Ya, Bersihkan"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearProductLogs();
          setConfirmClearOpen(false);
        }}
      />
    </div>
  );
}
