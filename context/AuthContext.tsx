"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser, Employee, UserRole } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";

interface AuthSnapshot {
  ready: boolean;
  user: AuthUser | null;
}

const SERVER_SNAPSHOT: AuthSnapshot = { ready: false, user: null };
let cachedClientSnapshot: AuthSnapshot | null = null;
const listeners = new Set<() => void>();

function isValidRole(role: unknown): role is UserRole {
  return role === "pelanggan" || role === "kasir" || role === "admin";
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.auth);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      typeof parsed?.name === "string" &&
      parsed.name.trim().length > 0 &&
      isValidRole(parsed?.role)
    ) {
      return {
        name: parsed.name.trim(),
        role: parsed.role,
        loginAt:
          typeof parsed.loginAt === "string"
            ? parsed.loginAt
            : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getClientSnapshot(): AuthSnapshot {
  if (!cachedClientSnapshot) {
    cachedClientSnapshot = { ready: true, user: readStoredUser() };
  }
  return cachedClientSnapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

function refreshAndNotify(): void {
  cachedClientSnapshot = { ready: true, user: readStoredUser() };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.auth) {
      refreshAndNotify();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export type LoginResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  authReady: boolean;
  login: (
    name: string,
    password: string,
    role: UserRole,
    employees?: Employee[]
  ) => LoginResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const login = useCallback(
    (
      name: string,
      password: string,
      role: UserRole,
      employees: Employee[] = []
    ): LoginResult => {
      const cleanName = name.trim();
      if (!cleanName) {
        return { ok: false, error: "Nama pengguna wajib diisi." };
      }
      if (!password.trim()) {
        return { ok: false, error: "Password wajib diisi." };
      }
      if (!isValidRole(role)) {
        return { ok: false, error: "Pilih kategori pengguna terlebih dahulu." };
      }

      let resolvedName = cleanName;

      if (role === "admin") {
        if (cleanName.toLowerCase() !== "hailai" || password !== "admin123") {
          return {
            ok: false,
            error: "Login Admin gagal! Nama pengguna atau password Admin salah.",
          };
        }
        resolvedName = "Hailai";
      } else if (role === "kasir") {
        const matched = employees.find(
          (emp) => emp.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (!matched) {
          return {
            ok: false,
            error: `Nama "${cleanName}" tidak terdaftar di data karyawan. Silakan hubungi Admin untuk mendaftarkan karyawan terlebih dahulu.`,
          };
        }
        if (!matched.active) {
          return {
            ok: false,
            error: `Karyawan "${matched.name}" sedang berstatus nonaktif / tidak bekerja saat ini. Hubungi Admin untuk mengaktifkan status kerja.`,
          };
        }
        resolvedName = matched.name;
      }

      const nextUser: AuthUser = {
        name: resolvedName,
        role,
        loginAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(nextUser));
      } catch {
        // Ignore storage quota errors
      }
      cachedClientSnapshot = { ready: true, user: nextUser };
      listeners.forEach((listener) => listener());
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.auth);
    } catch {
      // Ignore
    }
    cachedClientSnapshot = { ready: true, user: null };
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: snapshot.user,
      authReady: snapshot.ready,
      login,
      logout,
    }),
    [snapshot.user, snapshot.ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return ctx;
}
