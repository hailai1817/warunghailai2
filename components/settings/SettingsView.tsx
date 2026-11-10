"use client";

import { useState } from "react";
import {
  BadgePercent,
  Check,
  Cloud,
  Database,
  Download,
  Info,
  Palette,
  Save,
  Store,
  Trash2,
  RotateCcw,
  Wifi,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import type { ColorTheme, StoreSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { BAKERY_THEME, THEME_PRESETS } from "@/lib/color";
import { downloadFile } from "@/lib/format";
import { hasFirebaseConfig } from "@/lib/firebase";
import { cloudTestConnection, type CloudConnectionStatus } from "@/lib/firestore-service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { settings, updateSettings, resetData, clearTransactions, products, transactions, reviews } =
    useStore();
  const [form, setForm] = useState<StoreSettings>(settings);
  const theme = settings.theme ?? DEFAULT_SETTINGS.theme ?? BAKERY_THEME;
  const cloudEnabled = hasFirebaseConfig();
  const [cloudStatus, setCloudStatus] = useState<CloudConnectionStatus | null>(null);
  const [checkingCloud, setCheckingCloud] = useState(false);
  const [presetStr, setPresetStr] = useState(
    (settings.discountPresets && settings.discountPresets.length > 0
      ? settings.discountPresets
      : DEFAULT_SETTINGS.discountPresets ?? []
    ).join(", ")
  );
  const [toast, setToast] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearTx, setConfirmClearTx] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const setField = (key: keyof StoreSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const taxRate = Math.max(0, Math.min(100, Number(form.taxRate) || 0));
    const discountPresets = presetStr
      .split(",")
      .map((s) => Number(s.trim().replace(/[^\d.]/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
      .map((n) => Math.round(n));
    const { storeName, address, phone, receiptFooter, workingDate } = form;
    updateSettings({
      storeName,
      address,
      phone,
      receiptFooter,
      workingDate: workingDate || undefined,
      taxRate,
      discountPresets,
      theme: settings.theme ?? theme,
    });
    setPresetStr(discountPresets.join(", "));
    showToast("Pengaturan berhasil disimpan.");
  };

  const handleTestCloud = async () => {
    setCheckingCloud(true);
    setCloudStatus(null);
    const status = await cloudTestConnection();
    setCloudStatus(status);
    setCheckingCloud(false);
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      products,
      transactions,
      reviews,
    };
    downloadFile(
      `data-hailai-bakery-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
    showToast("Data berhasil diekspor.");
  };

  const inputClass =
    "w-full rounded-xl border-2 border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:border-[var(--color-terracotta)] focus:ring-2 focus:ring-[var(--color-terracotta)]/20";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white shadow">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Profil Toko &amp; Struk</h2>
            <p className="text-xs text-stone-500">Informasi yang tampil pada struk dan laporan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Nama Toko
            </label>
            <input
              value={form.storeName}
              onChange={(e) => setField("storeName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Nomor Telepon
            </label>
            <input
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Alamat Toko
            </label>
            <input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Pajak PPN (%)
            </label>
            <input
              inputMode="decimal"
              value={form.taxRate}
              onChange={(e) => setField("taxRate", e.target.value.replace(/[^\d.]/g, ""))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Tanggal Kerja (opsional)
            </label>
            <input
              type="date"
              value={form.workingDate ?? ""}
              onChange={(e) => setField("workingDate", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-400">
              Kosongkan untuk memakai tanggal sistem. Tanggal ini dipakai pada halaman Kasir, struk, dan laporan.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Pesan Penutup Struk
            </label>
            <textarea
              rows={2}
              value={form.receiptFooter}
              onChange={(e) => setField("receiptFooter", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white shadow">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Kustomisasi Diskon</h2>
            <p className="text-xs text-stone-500">
              Daftar tombol cepat diskon yang tersedia di halaman Kasir
            </p>
          </div>
        </div>

        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500">
          Preset Diskon Persen (%)
        </label>
        <input
          value={presetStr}
          onChange={(e) => setPresetStr(e.target.value)}
          placeholder="cth: 5, 10, 15, 20, 25"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-stone-400">
          Pisahkan dengan koma. Nilai hanya 1-100%. Di kasir tetap bisa memasukkan diskon bebas (persen
          atau nominal) selain preset ini.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-400">Pratinjau:</span>
          {presetStr
            .split(",")
            .map((s) => Number(s.trim().replace(/[^\d.]/g, "")))
            .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
            .slice(0, 8)
            .map((n) => (
              <span
                key={n}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
              >
                {Math.round(n)}%
              </span>
            ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-[var(--color-terracotta)] text-white shadow">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Tema Warna</h2>
            <p className="text-xs text-stone-500">
              Ganti warna suasana aplikasi, atau kustom warna sendiri
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const active = theme.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => updateSettings({ theme: preset })}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
                  active
                    ? "border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-white shadow"
                    : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                }`}
              >
                <span className="flex -space-x-1">
                  <span
                    className="h-5 w-5 rounded-full border border-white/70"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-white/70"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-white/70"
                    style={{ backgroundColor: preset.dark }}
                  />
                </span>
                {preset.name}
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
          <button
            onClick={() => updateSettings({ theme: { ...theme, id: "custom" } })}
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
              theme.id === "custom"
                ? "border-[var(--color-terracotta)] bg-[var(--color-terracotta)] text-white shadow"
                : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-current">
              <span className="h-3 w-3 rounded-full bg-[conic-gradient(from_0deg,#bd6a55,#d9a359,#56403a,#bd6a55)]" />
            </span>
            Kustom
            {theme.id === "custom" && <Check className="h-3.5 w-3.5" />}
          </button>
        </div>

        {theme.id === "custom" && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:grid-cols-2">
            {([
              ["primary", "Warna Utama"],
              ["secondary", "Warna Pendukung"],
              ["dark", "Warna Gelap"],
              ["bg", "Latar Belakang"],
            ] as [keyof ColorTheme, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) =>
                    updateSettings({ theme: { ...theme, id: "custom", [key]: e.target.value } })
                  }
                  className="h-10 w-14 cursor-pointer rounded-lg border border-stone-200 bg-white p-1"
                />
                <span className="flex-1 text-sm font-bold text-stone-700">{label}</span>
                <code className="rounded bg-white px-2 py-1 font-mono text-xs text-stone-500">
                  {theme[key]}
                </code>
              </label>
            ))}
            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="text-xs font-semibold text-stone-400">Pratinjau utama:</span>
              <span className="h-6 w-6 rounded-full border border-stone-200" style={{ backgroundColor: "var(--color-terracotta)" }} />
              <span className="h-6 w-6 rounded-full border border-stone-200" style={{ backgroundColor: "var(--color-amber-400)" }} />
              <span className="h-6 w-6 rounded-full border border-stone-200" style={{ backgroundColor: "var(--color-choco)" }} />
              <span className="h-6 w-6 rounded-full border border-stone-200" style={{ backgroundColor: "var(--color-cream)" }} />
              <span className="h-6 w-6 rounded-full border border-stone-200" style={{ backgroundColor: "var(--color-bg)" }} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Penyimpanan Data</h2>
            <p className="text-xs text-stone-500">
              Simpan data di Firebase Firestore secara request/response
            </p>
          </div>
        </div>

        {cloudEnabled ? (
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Mode Cloud aktif
            <span className="font-normal text-stone-400">(Firestore + cache lokal)</span>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            Mode Lokal aktif
            <span className="font-normal text-stone-400">(Firebase belum dikonfigurasi)</span>
          </div>
        )}

        <p className="mb-4 text-xs leading-relaxed text-stone-500">
          Data (produk, transaksi, review, pengaturan) otomatis disimpan ke Firestore sebagai
          sumber data utama, dengan cache localStorage sebagai cadangan saat offline. Selama
          Firebase tidak dikonfigurasi, aplikasi tetap berjalan penuh dengan penyimpanan lokal.
        </p>

        <button
          onClick={handleTestCloud}
          disabled={checkingCloud}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 px-4 py-2 text-xs font-extrabold text-white shadow transition hover:opacity-90"
        >
          <Wifi className="h-4 w-4" />
          {checkingCloud ? "Menghubungkan..." : "Uji Koneksi Firebase"}
        </button>

        {cloudStatus && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${
              cloudStatus.connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {cloudStatus.message}
          </p>
        )}

        <ol className="mt-4 list-inside list-decimal space-y-1 text-xs text-stone-500">
          <li>Cantumkan konfigurasi Firebase di file <code className="rounded bg-stone-100 px-1">.env.local</code> (sudah tersedia template placeholder).</li>
          <li>Deploy aturan <code className="rounded bg-stone-100 px-1">firestore.rules</code>: <code className="rounded bg-stone-100 px-1">firebase deploy --only firestore</code>.</li>
          <li>Jalankan ulang <code className="rounded bg-stone-100 px-1">npm run build</code> lalu buka aplikasi.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-stone-500 to-stone-700 text-white shadow">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">Manajemen Data</h2>
            <p className="text-xs text-stone-500">
              Data tersimpan lokal di browser (LocalStorage) secara real-time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={handleExport}
            className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/60 p-5 text-sm font-bold text-stone-700 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Download className="h-6 w-6 text-[var(--color-terracotta)]" />
            Export Data JSON
            <span className="text-[11px] font-medium text-stone-400">
              Backup produk, transaksi, ulasan &amp; pengaturan
            </span>
          </button>
          <button
            onClick={() => isAdmin && setConfirmClearTx(true)}
            disabled={!isAdmin}
            className={`flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/60 p-5 text-sm font-bold text-stone-700 transition ${
              isAdmin
                ? "hover:border-red-300 hover:bg-red-50"
                : "cursor-not-allowed opacity-55"
            }`}
          >
            <Trash2 className="h-6 w-6 text-red-500" />
            Hapus Riwayat Transaksi
            <span className="text-[11px] font-medium text-stone-400">
              {isAdmin ? "Kosongkan laporan & statistik" : "Khusus akses Admin"}
            </span>
          </button>
          <button
            onClick={() => isAdmin && setConfirmReset(true)}
            disabled={!isAdmin}
            className={`flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/60 p-5 text-sm font-bold text-stone-700 transition ${
              isAdmin
                ? "hover:border-amber-300 hover:bg-amber-50"
                : "cursor-not-allowed opacity-55"
            }`}
          >
            <RotateCcw className="h-6 w-6 text-amber-600" />
            Reset Data Demo
            <span className="text-[11px] font-medium text-stone-400">
              {isAdmin ? "Kembalikan ke data awal mockup" : "Khusus akses Admin"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p>
          Aplikasi <b>HaiLai&apos;s Bakery &amp; Cafe POS</b> bekerja 100% di sisi browser. Semua perubahan
          produk, stok, transaksi, dan ulasan disimpan otomatis ke <code className="rounded bg-amber-100 px-1">localStorage</code>{" "}
          sehingga tetap ada saat halaman dimuat ulang.
        </p>
      </div>

      <ConfirmDialog
        open={confirmClearTx}
        title="Hapus Riwayat Transaksi"
        message="Seluruh riwayat transaksi akan dihapus permanen. Data produk dan stok tidak terpengaruh."
        confirmLabel="Ya, Hapus"
        onCancel={() => setConfirmClearTx(false)}
        onConfirm={() => {
          clearTransactions();
          setConfirmClearTx(false);
          showToast("Riwayat transaksi berhasil dihapus.");
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset Data Demo"
        message="Semua data (produk, transaksi, ulasan, pengaturan) akan dikembalikan ke kondisi awal mockup."
        confirmLabel="Ya, Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetData();
          setForm(DEFAULT_SETTINGS);
          setPresetStr((DEFAULT_SETTINGS.discountPresets ?? []).join(", "));
          setConfirmReset(false);
          showToast("Data berhasil direset ke kondisi awal.");
        }}
      />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-[70] -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
            <Check className="h-4 w-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
