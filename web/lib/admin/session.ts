"use client";

import * as React from "react";

/**
 * Session module — the single source of truth for auth and for *which tenant*
 * is currently being edited in the admin.
 *
 * It is reactive: a module-level snapshot + a `Set` of listeners drive a
 * `useSession()` hook (via `useSyncExternalStore`), mirroring the pattern in
 * `store.ts`. Non-React code (the API clients) reads the plain getters
 * (`getToken`, `getCurrentTenant`, …) which always reflect the latest state.
 *
 * Persistence (localStorage):
 *   - token           → `festival-hub:token`   (EXISTING key, shared with api.ts)
 *   - user            → `festival-hub:user`
 *   - selected tenant → `festival-hub:current-tenant` (super-admin only)
 */

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  tenantId: string | null;
  isSuperuser: boolean;
};

const TOKEN_KEY = "festival-hub:token";
const USER_KEY = "festival-hub:user";
const CURRENT_TENANT_KEY = "festival-hub:current-tenant";

type SessionState = {
  token: string | null;
  user: SessionUser | null;
  currentTenant: string | null;
};

const EMPTY: SessionState = { token: null, user: null, currentTenant: null };

/** Parse a persisted user blob defensively — never throw. */
function parseUser(raw: string | null): SessionUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Partial<SessionUser> | null;
    if (
      u &&
      typeof u.id === "string" &&
      typeof u.email === "string" &&
      typeof u.isSuperuser === "boolean"
    ) {
      return {
        id: u.id,
        email: u.email,
        fullName: typeof u.fullName === "string" ? u.fullName : "",
        tenantId: typeof u.tenantId === "string" ? u.tenantId : null,
        isSuperuser: u.isSuperuser,
      };
    }
  } catch {
    // corrupt blob — ignore
  }
  return null;
}

/** Read the initial state from localStorage (client only). */
function readInitial(): SessionState {
  if (typeof window === "undefined") return { ...EMPTY };
  return {
    token: window.localStorage.getItem(TOKEN_KEY),
    user: parseUser(window.localStorage.getItem(USER_KEY)),
    currentTenant: window.localStorage.getItem(CURRENT_TENANT_KEY),
  };
}

// --- module-level reactive store --------------------------------------------
let snap: SessionState = readInitial();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// --- getters (usable from non-React code) -----------------------------------
export function getToken(): string | null {
  return snap.token;
}

export function getUser(): SessionUser | null {
  return snap.user;
}

export function isSuperadmin(): boolean {
  return snap.user?.isSuperuser === true;
}

/**
 * The tenant slug the admin currently operates on:
 *   - tenant-admin → always their own `user.tenantId`
 *   - super-admin  → the persisted selected slug (may be null until chosen)
 */
export function getCurrentTenant(): string | null {
  const user = snap.user;
  if (!user) return null;
  if (!user.isSuperuser) return user.tenantId;
  return snap.currentTenant;
}

// --- setters ----------------------------------------------------------------
export function setSession(token: string, user: SessionUser) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  snap = { ...snap, token, user };
  notify();
}

export function setCurrentTenant(slug: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_TENANT_KEY, slug);
  }
  snap = { ...snap, currentTenant: slug };
  notify();
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(CURRENT_TENANT_KEY);
  }
  snap = { ...EMPTY };
  notify();
}

// --- React hook -------------------------------------------------------------
export function useSession(): SessionState {
  return React.useSyncExternalStore(
    subscribe,
    () => snap,
    () => EMPTY
  );
}
