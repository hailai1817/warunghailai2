"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Calculator,
  Dices,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { USER_ROLES } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import BrandLogo from "@/components/brand/BrandLogo";

const ROLE_ICONS: Record<UserRole, typeof ShoppingBag> = {
  pelanggan: ShoppingBag,
  kasir: Calculator,
  admin: ShieldCheck,
};

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  pelanggan: "bg-emerald-100 text-emerald-700",
  kasir: "bg-amber-100 text-amber-800",
  admin: "bg-rose-100 text-rose-700",
};

function generateRandomPassword(): string {
  const words = ["Roti", "Kue", "Kopi", "HaiLai", "Manis", "Cafe"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

export default function LoginView() {
  const { login } = useAuth();
  const { settings } = useStore();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateRandom = () => {
    setPassword(generateRandomPassword());
    setShowPassword(true);
    setErrors((prev) => ({ ...prev, password: "" }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama pengguna wajib diisi.";
    if (!password.trim()) {
      nextErrors.password = "Masukkan password apa saja atau klik tombol Acak.";
    }
    if (!role) nextErrors.role = "Pilih kategori pengguna terlebih dahulu.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (role) {
      login(name, password, role);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-8 text-stone-800">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-crust)]/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[var(--color-terracotta)]/15 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-2xl">
        <div className="bg-[var(--color-choco)] px-6 py-6 text-center text-[var(--color-cream)] sm:px-8">
          <div className="mx-auto mb-3 flex w-fit items-center justify-center rounded-2xl bg-white/10 p-2.5 shadow-inner backdrop-blur">
            <BrandLogo className="h-14 w-14 drop-shadow" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            {settings.storeName}
          </h1>
          <p className="mt-1 text-xs text-amber-200/80 sm:text-sm">
            {settings.address} • Portal Masuk Warung &amp; POS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
          <div>
            <label
              htmlFor="login-name"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500"
            >
              Nama Pengguna
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Masukkan nama Anda..."
                autoComplete="name"
                className={`w-full rounded-xl border-2 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 outline-none transition focus:ring-2 ${
                  errors.name
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-stone-200 focus:border-[var(--color-terracotta)] focus:ring-[var(--color-terracotta)]/20"
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wide text-stone-500"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-[var(--color-terracotta)] transition hover:bg-amber-100"
              >
                <Dices className="h-3.5 w-3.5" />
                Buat Password Acak
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="Ketik password apa saja (bebas / acak)..."
                autoComplete="current-password"
                className={`w-full rounded-xl border-2 bg-white py-2.5 pl-10 pr-11 text-sm text-stone-800 outline-none transition focus:ring-2 ${
                  errors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : "border-stone-200 focus:border-[var(--color-terracotta)] focus:ring-[var(--color-terracotta)]/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Password bersifat bebas/acak — apa saja yang Anda ketik langsung diterima untuk masuk ke warung.
            </p>
            {errors.password && (
              <p className="mt-1 text-xs font-semibold text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <p className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Pilih Kategori Pengguna
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {USER_ROLES.map((item) => {
                const Icon = ROLE_ICONS[item.key];
                const selected = role === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setRole(item.key);
                      setErrors((prev) => ({ ...prev, role: "" }));
                    }}
                    aria-pressed={selected}
                    className={`flex flex-col items-start rounded-2xl border-2 p-3.5 text-left transition ${
                      selected
                        ? "border-[var(--color-terracotta)] bg-amber-50/80 shadow-md ring-2 ring-[var(--color-terracotta)]/20"
                        : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                    }`}
                  >
                    <div className="mb-2 flex w-full items-center justify-between gap-2">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-[var(--color-terracotta)] text-white shadow"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_BADGE_CLASS[item.key]}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-stone-800">{item.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.role}</p>
            )}
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-terracotta)] to-amber-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-95 active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" />
            Masuk ke Warung
          </button>
        </form>
      </div>
    </div>
  );
}
