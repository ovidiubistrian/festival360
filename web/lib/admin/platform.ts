"use client";

/**
 * Platform (multi-tenant) API client. Talks to the FastAPI backend
 * `/platform/*` endpoints as a superuser (JWT auth). Like `lib/admin/api.ts`,
 * every function catches/logs its own errors and resolves — it never throws —
 * so callers stay simple.
 */

import { getToken } from "@/lib/admin/api";

const API =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") + "/api/v1";

const PLATFORM = `${API}/platform`;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken() ?? ""}`,
    "Content-Type": "application/json",
  };
}

export type PresetTheme = {
  primary: string;
  secondary: string;
  terracotta: string;
  gold: string;
  charcoal: string;
  background: string;
};

export type Preset = {
  key: string;
  name: string;
  description: string;
  theme: PresetTheme;
};

export type TenantSummary = {
  slug: string;
  name: string;
  eventType: string;
  tagline: string;
  themePrimary: string;
};

/** List the available site presets (festival, resort, museum, conference). */
export async function listPresets(): Promise<Preset[]> {
  try {
    const res = await fetch(`${PLATFORM}/presets`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return (await res.json()) as Preset[];
  } catch (err) {
    console.error("listPresets failed", err);
    return [];
  }
}

/** List every tenant (site) on the platform. */
export async function listTenants(): Promise<TenantSummary[]> {
  try {
    const res = await fetch(`${PLATFORM}/tenants`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return (await res.json()) as TenantSummary[];
  } catch (err) {
    console.error("listTenants failed", err);
    return [];
  }
}

/**
 * Create a tenant from a preset (`eventType`). On failure, reads the JSON
 * `detail` from the backend (400 bad slug / 409 slug taken) and returns it as
 * `error` so the UI can surface it.
 */
export async function createTenant(input: {
  name: string;
  slug: string;
  eventType: string;
}): Promise<{ ok: boolean; error?: string; tenant?: TenantSummary }> {
  try {
    const res = await fetch(`${PLATFORM}/tenants`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      let error = `Crearea site-ului a eșuat (${res.status}).`;
      try {
        const data = (await res.json()) as { detail?: unknown };
        if (typeof data?.detail === "string" && data.detail.trim()) {
          error = data.detail;
        }
      } catch {
        // non-JSON body — keep the generic message
      }
      return { ok: false, error };
    }
    const tenant = (await res.json()) as TenantSummary;
    return { ok: true, tenant };
  } catch (err) {
    console.error("createTenant failed", err);
    return { ok: false, error: "Eroare de rețea. Încearcă din nou." };
  }
}

/** Delete a tenant by slug. Returns true on success (204). */
export async function deleteTenant(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("deleteTenant failed", err);
    return false;
  }
}
