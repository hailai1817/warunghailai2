"use client";

import { useState } from "react";
import {
  BadgePercent,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Download,
  ExternalLink,
  Info,
  Key,
  Palette,
  RotateCcw,
  Save,
  Store,
  Trash2,
  UploadCloud,
  Wifi,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import type { ColorTheme, StoreSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { BAKERY_THEME, THEME_PRESETS } from "@/lib/color";
import { downloadFile } from "@/lib/format";
import {
  clearFirebaseConfigFromStorage,
  getFirebaseConfig,
  hasFirebaseConfig,
  saveFirebaseConfigToStorage,
  type FirebaseConfigObject,
} from "@/lib/firebase";
import {
  cloudTestConnection,
  pushAllDataToCloud,
  type CloudConnectionStatus,
} from "@/lib/firestore-service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { settings, updateSettings, resetData, clearTransactions, products, transactions, reviews, employees } =
    useStore();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [useRealtime, setUseRealtime] = useState<boolean>(() => {
    return settings.useRealtimeDate !== false && !settings.workingDate;
  });
  const [prevSettings, setPrevSettings] = useState(settings);
  if (prevSettings !== settings) {
    setPrevSettings(settings);
    setForm(settings);
    setUseRealtime(settings.useRealtimeDate !== false && !settings.workingDate);
  }

  const theme = settings.theme ?? DEFAULT_SETTINGS.theme ?? BAKERY_THEME;
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

  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
    const { storeName, address, phone, receiptFooter } = form;
    updateSettings({
      storeName,
      address,
      phone,
      receiptFooter,
      useRealtimeDate: useRealtime,
      workingDate: useRealtime ? undefined : form.workingDate || undefined,
      taxRate,
      discountPresets,
      theme: settings.theme ?? theme,
    });
    setPresetStr(discountPresets.join(", "));
    showToast(
      useRealtime
        ? "Pengaturan disimpan. Tanggal kerja otomatis real-time aktif."
        : "Pengaturan disimpan. Tanggal kerja kustom manual aktif."
    );
  };

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [firebaseForm, setFirebaseForm] = useState<FirebaseConfigObject>(() => getFirebaseConfig());
  const [pasteSnippet, setPasteSnippet] = useState("");
  const [isPushingCloud, setIsPushingCloud] = useState(false);

  const openConfigModal = () => {
    setFirebaseForm(getFirebaseConfig());
    setConfigModalOpen(true);
  };

  const handleParseSnippet = () => {
    if (!pasteSnippet.trim()) return;
    const extract = (key: string) => {
      const match = pasteSnippet.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
      return match ? match[1].trim() : "";
    };
    const apiKey = extract("apiKey");
    const authDomain = extract("authDomain");
    const projectId = extract("projectId");
    const storageBucket = extract("storageBucket");
    const messagingSenderId = extract("messagingSenderId");
    const appId = extract("appId");

    if (apiKey || projectId || appId) {
      setFirebaseForm((prev) => ({
        ...prev,
        apiKey: apiKey || prev.apiKey,
        authDomain: authDomain || prev.authDomain,
        projectId: projectId || prev.projectId,
        storageBucket: storageBucket || prev.storageBucket,
        messagingSenderId: messagingSenderId || prev.messagingSenderId,
        appId: appId || prev.appId,
      }));
      showToast("Konfigurasi Firebase berhasil diekstrak!");
    } else {
      showToast("Gagal membaca format firebaseConfig. Tempel ulang atau isi kolom di bawah.");
    }
  };

  const handleSaveFirebaseConfig = () => {
    if (!firebaseForm.apiKey || !firebaseForm.projectId || !firebaseForm.appId) {
      showToast("Harap isi setidaknya API Key, Project ID, dan App ID.");
      return;
    }
    saveFirebaseConfigToStorage(firebaseForm);
    setConfigModalOpen(false);
    showToast("Konfigurasi Firebase berhasil disimpan.");
  };

  const handleClearFirebaseConfig = () => {
    clearFirebaseConfigFromStorage();
    setFirebaseForm({
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    });
    setPasteSnippet("");
    setConfigModalOpen(false);
    showToast("Konfigurasi Firebase lokal telah dihapus.");
  };

  const handlePushToCloud = async () => {
    if (!hasFirebaseConfig()) {
      showToast("Firebase belum dikonfigurasi. Atur konfigurasi Firebase terlebih dahulu.");
      openConfigModal();
      return;
    }
    setIsPushingCloud(true);
    const res = await pushAllDataToCloud({
      products,
      transactions,
      settings,
      reviews,
      employees,
    });
    setIsPushingCloud(false);
    showToast(res.message);
    setCloudStatus({
      configured: true,
      connected: res.ok,
      message: res.message,
    });
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
      employees,
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
          <div className="sm:col-span-2 rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-700">
                  <Calendar className="h-4 w-4 text-[var(--color-terracotta)]" />
                  Tanggal Kerja Operasional
                </label>
                <p className="text-xs text-stone-500">
                  Menentukan tanggal pencatatan transaksi kasir, struk belanja, dan laporan
                </p>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setUseRealtime(true);
                    setField("workingDate", "");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    useRealtime
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Otomatis Real-Time
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseRealtime(false);
                    if (!form.workingDate) {
                      setField("workingDate", new Date().toLocaleDateString("en-CA"));
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    !useRealtime
                      ? "bg-[var(--color-choco)] text-[var(--color-cream)] shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Kustom Manual
                </button>
              </div>
            </div>

            {useRealtime ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Mode Otomatis Real-Time Aktif (Direkomendasikan)</span>
                  </div>
                  <p className="mt-0.5 text-emerald-700">
                    Hari ini: <span className="font-extrabold underline">{todayFormatted}</span>. Setiap hari tanggal transaksi dan laporan akan berganti otomatis mengikuti waktu nyata tanpa perlu diubah manual.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block mb-1 font-bold text-amber-900">
                      Pilih Tanggal Kerja Khusus (Manual):
                    </label>
                    <input
                      type="date"
                      value={form.workingDate ?? ""}
                      onChange={(e) => setField("workingDate", e.target.value)}
                      className="w-full rounded-xl border-2 border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-800 outline-none transition focus:border-[var(--color-terracotta)]"
                    />
                  </div>
                  <div className="flex sm:flex-col gap-2 pt-1 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => setField("workingDate", new Date().toLocaleDateString("en-CA"))}
                      className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm"
                    >
                      Set ke Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseRealtime(true);
                        setField("workingDate", "");
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Gunakan Real-Time
                    </button>
                  </div>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  ⚠️ Perhatian: Tanggal ini akan mengunci semua transaksi kasir dan laporan pada tanggal di atas sampai Anda mengubahnya atau mengaktifkan kembali mode Real-Time.
                </p>
              </div>
            )}
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
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-800">Penyimpanan Cloud Firestore</h2>
              <p className="text-xs text-stone-500">
                Sinkronisasi produk, transaksi, karyawan, dan ulasan ke Firebase Firestore
              </p>
            </div>
          </div>

          <button
            onClick={openConfigModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <Key className="h-3.5 w-3.5 text-amber-600" />
            Konfigurasi Firebase
          </button>
        </div>

        {hasFirebaseConfig() ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Terkonfigurasi</span>
              <span className="font-mono text-[11px] text-emerald-700 font-normal">
                (Project: {getFirebaseConfig().projectId || "aktif"})
              </span>
            </div>
            <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
              Cloud + Cache Lokal
            </span>
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Mode Lokal Aktif (Firebase Belum Terhubung)</span>
            </div>
            <button
              onClick={openConfigModal}
              className="font-extrabold text-[var(--color-terracotta)] underline hover:text-amber-800"
            >
              Hubungkan Sekarang →
            </button>
          </div>
        )}

        <p className="mb-4 text-xs leading-relaxed text-stone-500">
          Data (produk, transaksi, karyawan, ulasan, pengaturan) otomatis disimpan ke Firestore secara berkala.
          Anda juga dapat menekan tombol <strong>Push Semua Data ke Firestore Sekarang</strong> di bawah untuk langsung mengunggah seluruh data web saat ini ke cloud database.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handlePushToCloud}
            disabled={isPushingCloud || checkingCloud}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-emerald-200 transition hover:opacity-90 disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            {isPushingCloud ? "Mengunggah Data ke Cloud..." : "Push Semua Data ke Firestore Sekarang"}
          </button>

          <button
            onClick={handleTestCloud}
            disabled={checkingCloud || isPushingCloud}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            <Wifi className="h-4 w-4" />
            {checkingCloud ? "Menghubungkan..." : "Uji Koneksi Firebase"}
          </button>
        </div>

        {cloudStatus && (
          <p
            className={`mt-3.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
              cloudStatus.connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {cloudStatus.message}
          </p>
        )}
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

      <Modal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="Konfigurasi Firebase Firestore"
        subtitle="Hubungkan aplikasi HaiLai POS dengan Cloud Firestore untuk sinkronisasi database"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 p-5 sm:p-6">
          {/* Quick Setup / Paste Snippet */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Zap className="h-4 w-4 text-amber-600" />
                Cara Cepat: Tempel Snippet firebaseConfig
              </span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-terracotta)] hover:underline"
              >
                Firebase Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="mb-2.5 text-[11px] leading-relaxed text-amber-800/90">
              Salin kode objek <code className="rounded bg-amber-100 px-1 font-mono">const firebaseConfig = &#123; ... &#125;</code> dari Firebase Console (Project Settings &gt; General &gt; Your apps), lalu tempelkan di sini:
            </p>
            <textarea
              rows={3}
              value={pasteSnippet}
              onChange={(e) => setPasteSnippet(e.target.value)}
              placeholder={'const firebaseConfig = {\n  apiKey: "AIza...",\n  projectId: "warung-hailai",\n  appId: "1:..."\n};'}
              className="w-full rounded-xl border border-amber-300 bg-white p-2.5 font-mono text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-[var(--color-terracotta)]"
            />
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={handleParseSnippet}
                disabled={!pasteSnippet.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Ekstrak &amp; Terapkan
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Rincian Kredensial Firebase
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firebaseForm.apiKey}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="AIzaSy..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firebaseForm.projectId}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, projectId: e.target.value }))}
                  placeholder="warung-hailai-pos"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  App ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firebaseForm.appId}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, appId: e.target.value }))}
                  placeholder="1:123456789:web:abcdef..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={firebaseForm.authDomain}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, authDomain: e.target.value }))}
                  placeholder="project-id.firebaseapp.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  value={firebaseForm.storageBucket}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, storageBucket: e.target.value }))}
                  placeholder="project-id.appspot.com"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={firebaseForm.messagingSenderId}
                  onChange={(e) => setFirebaseForm((p) => ({ ...p, messagingSenderId: e.target.value }))}
                  placeholder="123456789012"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={handleClearFirebaseConfig}
              className="px-2 py-1.5 text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline"
            >
              Hapus Konfigurasi
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFirebaseConfig}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-90"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan &amp; Hubungkan
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
