"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Download,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Search,
  Star,
  ThumbsDown,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { CustomerReview } from "@/lib/types";
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

export default function ReviewsView() {
  const { reviews, addReview, updateReview, deleteReview } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RatingFilter>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerReview | null>(null);
  const [deleting, setDeleting] = useState<CustomerReview | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews
      .filter((r) => {
        const matchQuery =
          !q ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q);
        const matchRating = filter === null || r.rating === filter;
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

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ["No", "Nama Pelanggan", "Foto Profil", "Rating", "Komentar", "Tanggal"],
    ];
    filtered.forEach((r, idx) => {
      rows.push([
        idx + 1,
        r.customerName,
        r.avatar ? "Ada" : "Default",
        r.rating,
        r.comment,
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
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-600 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
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
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((review) => (
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
            </div>
          ))}
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
          }
        />
      )}

      {formOpen && (
        <ReviewFormModal
          review={editing}
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
