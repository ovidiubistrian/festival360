"use client";

/**
 * Admin API client. Talks to the real FastAPI backend (JWT auth + Postgres).
 * All functions catch/log their own errors and resolve — they never throw
 * uncaught — returning a boolean or parsed JSON so callers can stay simple.
 */

import { getCurrentTenant, type SessionUser } from "@/lib/admin/session";
import { apiBaseUrl } from "@/lib/api-base";

const API = `${apiBaseUrl()}/api/v1`;

const TOKEN_KEY = "festival-hub:token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken() ?? ""}`,
    "Content-Type": "application/json",
  };
}

/** Valid content collection identifiers accepted by the admin API. */
export type ApiCollection =
  | "exhibitors"
  | "products"
  | "accommodations"
  | "destinations"
  | "program"
  | "partners"
  | "gallery"
  | "articles";

/**
 * Base URL for the current tenant's content-admin API. Built from
 * `getCurrentTenant()` per call so it always follows the selected tenant.
 * Returns null when no tenant is selected yet (super-admin, pre-selection).
 */
function adminBase(): string | null {
  const slug = getCurrentTenant();
  if (!slug) return null;
  return `${API}/tenants/${slug}/admin`;
}

export type LoginResult = { token: string; user: SessionUser };

/**
 * Authenticate against the backend. On success returns the access token plus
 * the resolved user (role + tenant) so the store can open a session and route
 * by role. The caller — not this function — persists the session.
 */
export async function apiLogin(
  email: string,
  password: string
): Promise<LoginResult | null> {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      accessToken?: string;
      user?: SessionUser;
    };
    if (data?.accessToken && data.user) {
      return { token: data.accessToken, user: data.user };
    }
    return null;
  } catch (err) {
    console.error("apiLogin failed", err);
    return null;
  }
}

/** Fetch the currently-authenticated user (role + tenant). */
export async function apiMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionUser;
  } catch (err) {
    console.error("apiMe failed", err);
    return null;
  }
}

export async function fetchBundle(): Promise<unknown> {
  const slug = getCurrentTenant();
  // No tenant selected yet (super-admin pre-selection) — nothing to fetch.
  if (!slug) return null;
  try {
    const res = await fetch(`${API}/tenants/${slug}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("fetchBundle failed", err);
    return null;
  }
}

export async function apiCreate(
  collection: ApiCollection,
  item: unknown
): Promise<unknown> {
  const base = adminBase();
  if (!base) {
    console.warn("apiCreate: no tenant selected — skipping");
    return null;
  }
  try {
    const res = await fetch(`${base}/${collection}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("apiCreate failed", err);
    return null;
  }
}

export async function apiUpdate(
  collection: ApiCollection,
  id: string,
  item: unknown
): Promise<unknown> {
  const base = adminBase();
  if (!base) {
    console.warn("apiUpdate: no tenant selected — skipping");
    return null;
  }
  try {
    const res = await fetch(`${base}/${collection}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("apiUpdate failed", err);
    return null;
  }
}

export async function apiDelete(
  collection: ApiCollection,
  id: string
): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiDelete: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/${collection}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiDelete failed", err);
    return false;
  }
}

export async function apiMove(
  collection: ApiCollection,
  id: string,
  direction: -1 | 1
): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiMove: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/${collection}/${id}/move`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ direction }),
    });
    return res.ok;
  } catch (err) {
    console.error("apiMove failed", err);
    return false;
  }
}

export async function apiToggleStatus(
  collection: ApiCollection,
  id: string
): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiToggleStatus: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/${collection}/${id}/toggle-status`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiToggleStatus failed", err);
    return false;
  }
}

export async function apiUpdateSettings(patch: unknown): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiUpdateSettings: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch (err) {
    console.error("apiUpdateSettings failed", err);
    return false;
  }
}

export async function apiUpdateSections(sections: unknown): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiUpdateSections: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/sections`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ sections }),
    });
    return res.ok;
  } catch (err) {
    console.error("apiUpdateSections failed", err);
    return false;
  }
}

export async function apiSetMessageRead(
  id: string,
  read: boolean
): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiSetMessageRead: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/messages/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ read }),
    });
    return res.ok;
  } catch (err) {
    console.error("apiSetMessageRead failed", err);
    return false;
  }
}

export async function apiDeleteMessage(id: string): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiDeleteMessage: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/messages/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiDeleteMessage failed", err);
    return false;
  }
}

export async function apiAddSubscriber(
  email: string,
  source: string
): Promise<unknown> {
  const base = adminBase();
  if (!base) {
    console.warn("apiAddSubscriber: no tenant selected — skipping");
    return null;
  }
  try {
    const res = await fetch(`${base}/newsletter`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, source }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("apiAddSubscriber failed", err);
    return null;
  }
}

export async function apiDeleteSubscriber(id: string): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiDeleteSubscriber: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/newsletter/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiDeleteSubscriber failed", err);
    return false;
  }
}

export async function apiReset(): Promise<boolean> {
  const base = adminBase();
  if (!base) {
    console.warn("apiReset: no tenant selected — skipping");
    return false;
  }
  try {
    const res = await fetch(`${base}/reset`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiReset failed", err);
    return false;
  }
}
