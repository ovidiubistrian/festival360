"use client";

/**
 * Admin API client. Talks to the real FastAPI backend (JWT auth + Postgres).
 * All functions catch/log their own errors and resolve — they never throw
 * uncaught — returning a boolean or parsed JSON so callers can stay simple.
 */

const API =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") + "/api/v1";

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
  | "destinations"
  | "program"
  | "partners"
  | "gallery"
  | "articles";

const ADMIN = `${API}/tenants/prispa/admin`;

export async function apiLogin(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.accessToken) {
      setToken(data.accessToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error("apiLogin failed", err);
    return false;
  }
}

export async function fetchBundle(): Promise<unknown> {
  try {
    const res = await fetch(`${API}/tenants/prispa`, {
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
  try {
    const res = await fetch(`${ADMIN}/${collection}`, {
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
  try {
    const res = await fetch(`${ADMIN}/${collection}/${id}`, {
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
  try {
    const res = await fetch(`${ADMIN}/${collection}/${id}`, {
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
  try {
    const res = await fetch(`${ADMIN}/${collection}/${id}/move`, {
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
  try {
    const res = await fetch(`${ADMIN}/${collection}/${id}/toggle-status`, {
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
  try {
    const res = await fetch(`${ADMIN}/settings`, {
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
  try {
    const res = await fetch(`${ADMIN}/sections`, {
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
  try {
    const res = await fetch(`${ADMIN}/messages/${id}`, {
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
  try {
    const res = await fetch(`${ADMIN}/messages/${id}`, {
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
  try {
    const res = await fetch(`${ADMIN}/newsletter`, {
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
  try {
    const res = await fetch(`${ADMIN}/newsletter/${id}`, {
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
  try {
    const res = await fetch(`${ADMIN}/reset`, {
      method: "POST",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("apiReset failed", err);
    return false;
  }
}
