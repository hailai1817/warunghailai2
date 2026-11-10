"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { AuthUser, UserRole } from "@/lib/types";
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

interface AuthContextValue {
  user: AuthUser | null;
  authReady: boolean;
  login: (name: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const login = useCallback((name: string, password: string, role: UserRole) => {
    const cleanName = name.trim();
    if (!cleanName || !password.trim() || !isValidRole(role)) return;

    // Any user-typed or randomly generated password grants entry for the selected role
    const nextUser: AuthUser = {
      name: cleanName,
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
  }, []);

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
