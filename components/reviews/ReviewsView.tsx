"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Download,
  Eye,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Star,
  ThumbsDown,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { CustomerReview } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { downloadFile, formatDateTime, toCSV } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import StarRating from "./StarRating";
import ReviewFormModal from "./ReviewFormModal";

type RatingFilter = number | null;

function formatAverage(avg: number): string {
  return avg.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function ReviewAvatar({
  name,
  avatar,
  rating,
}: {
  name: string;
  avatar?: string;
  rating: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const avatarColor = (r: number) =>
    r >= 4
      ? "bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)]"
      : r === 3
        ? "bg-gradient-to-br from-stone-400 to-stone-500"
        : "bg-gradient-to-br from-stone-500 to-stone-700";

  if (avatar && !imgFailed) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-crust)] bg-white shadow">
        <Image
          src={avatar}
          alt={name}
          fill
          sizes="44px"
          unoptimized
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white shadow ${avatarColor(
        rating
      )}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

type ReviewFilter = RatingFilter | "unreplied";

export default function ReviewsView() {
  const { user } = useAuth();
  const { reviews, addReview, updateReview, deleteReview } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerReview | null>(null);
  const [deleting, setDeleting] = useState<CustomerReview | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const isAdmin = user?.role === "admin";
  const isKasir = user?.role === "kasir";
  const canWriteReview = user?.role === "pelanggan" || isAdmin;
  const canExport = isAdmin || isKasir;

  const canModifyReview = (review: CustomerReview) => {
    if (isAdmin) return true;
    if (user?.role === "pelanggan") {
      return review.customerName.trim().toLowerCase() === user.name.trim().toLowerCase();
    }
    return false;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews
      .filter((r) => {
        const matchQuery =
          !q ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          (r.adminReply ?? "").toLowerCase().includes(q);
        const matchRating =
          filter === null
            ? true
            : filter === "unreplied"
              ? !r.adminReply
              : r.rating === filter;
        return matchQuery && matchRating;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, search, filter]);

  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: 0, total: 0, five: 0, low: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: sum / reviews.length,
      total: reviews.length,
      five: reviews.filter((r) => r.rating === 5).length,
      low: reviews.filter((r) => r.rating <= 3).length,
    };
  }, [reviews]);

  const handleSaveReview = (data: Omit<CustomerReview, "id" | "date">) => {
    if (editing) {
      updateReview(editing.id, data);
    } else {
      addReview(data);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const startReply = (review: CustomerReview) => {
    setReplyingId(review.id);
    setReplyDraft(review.adminReply ?? "");
  };

  const submitReply = (reviewId: string) => {
    if (!isAdmin) return;
    const text = replyDraft.trim();
    if (!text) return;
    updateReview(reviewId, {
      adminReply: text,
      adminReplyBy: user?.name || "Admin",
      adminReplyDate: new Date().toISOString(),
    });
    setReplyingId(null);
    setReplyDraft("");
  };

  const clearReply = (reviewId: string) => {
    if (!isAdmin) return;
    updateReview(reviewId, {
      adminReply: undefined,
      adminReplyBy: undefined,
      adminReplyDate: undefined,
    });
  };

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ["No", "Nama Pelanggan", "Foto Profil", "Rating", "Komentar", "Balasan Admin", "Tanggal"],
    ];
    filtered.forEach((r, idx) => {
      rows.push([
        idx + 1,
        r.customerName,
        r.avatar ? "Ada" : "Default",
        r.rating,
        r.comment,
        r.adminReply ?? "-",
        formatDateTime(r.date),
      ]);
    });
    const filename = `ulasan-hailai-bakery-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(filename, "\uFEFF" + toCSV(rows), "text/csv");
  };

  const chipClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${
      active
        ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow"
        : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300"
    }`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rating Rata-rata"
          value={
            stats.total > 0 ? (
              <span className="flex items-center gap-1.5">
                {formatAverage(stats.avg)}
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </span>
            ) : (
              "-"
            )
          }
          icon={<Star className="h-6 w-6" />}
          accent="amber"
          hint={stats.total > 0 ? `dari ${stats.total} ulasan` : "belum ada ulasan"}
        />
        <StatCard
          label="Total Ulasan"
          value={stats.total}
          icon={<MessageSquare className="h-6 w-6" />}
          accent="terracotta"
          hint="komentar pelanggan"
        />
        <StatCard
          label="Ulasan 5 Bintang"
          value={stats.five}
          icon={<TrendingUp className="h-6 w-6" />}
          accent="green"
          hint="pelanggan sangat puas"
        />
        <StatCard
          label="Rating ≤ 3"
          value={stats.low}
          icon={<ThumbsDown className="h-6 w-6" />}
          accent="red"
          hint="perlu tindak lanjut"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / komentar..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 shadow-sm outline-none transition focus:border-[var(--color-terracotta)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {([null, 5, 4, 3, 2, 1] as RatingFilter[]).map((r) => (
              <button
                key={r ?? "semua"}
                onClick={() => setFilter(r)}
                className={chipClass(filter === r)}
              >
                {r === null ? "Semua" : `${r} ★`}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => setFilter("unreplied")}
                className={chipClass(filter === "unreplied")}
              >
                Belum Dibalas
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isKasir && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              <Eye className="h-3.5 w-3.5" />
              Mode Lihat Ulasan (Kasir)
            </span>
          )}
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
          {canWriteReview && (
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Tambah Ulasan
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((review) => {
            const modifiable = canModifyReview(review);
            const isReplying = replyingId === review.id;
            return (
              <div
                key={review.id}
                className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <ReviewAvatar
                    name={review.customerName}
                    avatar={review.avatar}
                    rating={review.rating}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-stone-800">{review.customerName}</p>
                        <p className="text-xs text-stone-400">{formatDateTime(review.date)}</p>
                      </div>
                      {modifiable && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditing(review);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ulasan ${review.customerName}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition hover:border-amber-300 hover:bg-amber-50 hover:text-[var(--color-terracotta)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(review)}
                            aria-label={`Hapus ulasan ${review.customerName}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StarRating value={review.rating} />
                      <Badge variant={review.rating >= 4 ? "green" : review.rating === 3 ? "yellow" : "red"}>
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="mt-3 border-t border-dashed border-stone-100 pt-3 text-sm leading-relaxed text-stone-600">
                  “{review.comment}”
                </p>

                {review.adminReply && !isReplying && (
                  <div className="mt-3 rounded-xl border-l-4 border-[var(--color-terracotta)] bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-terracotta)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Balasan Admin {review.adminReplyBy ? `(${review.adminReplyBy})` : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        {review.adminReplyDate && (
                          <span className="text-[10px] text-stone-400">
                            {formatDateTime(review.adminReplyDate)}
                          </span>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startReply(review)}
                              title="Edit balasan"
                              className="rounded p-1 text-stone-400 transition hover:bg-white hover:text-[var(--color-terracotta)]"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => clearReply(review.id)}
                              title="Hapus balasan"
                              className="rounded p-1 text-stone-400 transition hover:bg-white hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-stone-700">
                      {review.adminReply}
                    </p>
                  </div>
                )}

                {isAdmin && !review.adminReply && !isReplying && (
                  <div className="mt-3 flex justify-end border-t border-stone-100 pt-2.5">
                    <button
                      onClick={() => startReply(review)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-[var(--color-terracotta)] transition hover:bg-amber-100"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Balas Ulasan
                    </button>
                  </div>
                )}

                {isAdmin && isReplying && (
                  <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-terracotta)]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Tulis Balasan Admin untuk {review.customerName}
                    </p>
                    <textarea
                      rows={2}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Tulis balasan resmi toko untuk pelanggan..."
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-[var(--color-terracotta)]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(null);
                          setReplyDraft("");
                        }}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => submitReply(review.id)}
                        disabled={!replyDraft.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-terracotta)] px-3 py-1.5 text-xs font-bold text-white shadow transition hover:opacity-90 disabled:opacity-40"
                      >
                        <Send className="h-3 w-3" />
                        Kirim Balasan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="h-7 w-7" />}
          title={reviews.length === 0 ? "Belum ada ulasan" : "Tidak ada ulasan yang cocok"}
          description={
            reviews.length === 0
              ? "Tambahkan komentar dan ulasan pelanggan pertama untuk mulai."
              : "Coba ubah kata kunci pencarian atau filter rating."
          }
          action={
            canWriteReview ? (
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-terracotta)] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:opacity-90"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Tambah Ulasan
              </button>
            ) : undefined
          }
        />
      )}

      {formOpen && canWriteReview && (
        <ReviewFormModal
          review={editing}
          defaultCustomerName={!editing ? user?.name : undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSaveReview}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus Ulasan"
        message={`Ulasan dari "${deleting?.customerName}" akan dihapus permanen. Lanjutkan?`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteReview(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
