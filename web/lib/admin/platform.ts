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

// --- Custom domains (per-tenant) --------------------------------------------

export type DomainStatus = {
  domain: string | null;
  active: boolean;
  verifyToken: string;
  verifyRecordName: string;
  verifyRecordValue: string;
  dnsTargetHint: string;
};

/**
 * Read a tenant's current custom-domain status. Returns null on any failure
 * (network / non-ok) so callers can render an empty state.
 */
export async function getDomain(slug: string): Promise<DomainStatus | null> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/domain`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as DomainStatus;
  } catch (err) {
    console.error("getDomain failed", err);
    return null;
  }
}

/**
 * Read the backend's JSON `detail` from a non-ok response, falling back to a
 * status-coded generic message.
 */
async function readDetail(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    if (typeof data?.detail === "string" && data.detail.trim()) {
      return data.detail;
    }
  } catch {
    // non-JSON body — keep the generic message
  }
  return fallback;
}

/**
 * Set (or replace) a tenant's custom domain. On failure surfaces the backend
 * `detail` as `error` — covers 402 (plan gate), 400 (invalid) and 409 (taken).
 */
export async function setDomain(
  slug: string,
  domain: string
): Promise<{ ok: boolean; status?: DomainStatus; error?: string }> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/domain`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: await readDetail(
          res,
          `Setarea domeniului a eșuat (${res.status}).`
        ),
      };
    }
    return { ok: true, status: (await res.json()) as DomainStatus };
  } catch (err) {
    console.error("setDomain failed", err);
    return { ok: false, error: "Eroare de rețea. Încearcă din nou." };
  }
}

/**
 * Trigger DNS verification of a tenant's domain. On 422 surfaces the backend
 * `detail` (which TXT record is still missing) as `error`.
 */
export async function verifyDomain(
  slug: string
): Promise<{ ok: boolean; status?: DomainStatus; error?: string }> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/domain/verify`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: await readDetail(
          res,
          `Verificarea a eșuat (${res.status}).`
        ),
      };
    }
    return { ok: true, status: (await res.json()) as DomainStatus };
  } catch (err) {
    console.error("verifyDomain failed", err);
    return { ok: false, error: "Eroare de rețea. Încearcă din nou." };
  }
}

/** Remove a tenant's custom domain. Returns true on success (204). */
export async function removeDomain(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/domain`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("removeDomain failed", err);
    return false;
  }
}

// --- Subscriptions & leads (super-admin commercial views) -------------------

export type SubscriptionRow = {
  tenantId: string;
  tenantName: string;
  eventType: string;
  plan: string;
  status: string;
  billingCycle: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  organization: string;
  eventType: string;
  plan: string;
  message: string;
  status: string;
  createdAt: string;
};

/** List every tenant's subscription (plan + status + billing). */
export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  try {
    const res = await fetch(`${PLATFORM}/subscriptions`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return (await res.json()) as SubscriptionRow[];
  } catch (err) {
    console.error("listSubscriptions failed", err);
    return [];
  }
}

/** Set a tenant's plan + subscription status. Returns true on success. */
export async function setTenantPlan(
  slug: string,
  plan: string,
  status: string
): Promise<boolean> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/plan`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ plan, status }),
    });
    return res.ok;
  } catch (err) {
    console.error("setTenantPlan failed", err);
    return false;
  }
}

/** List the signup/lead requests from the marketing landing. */
export async function listLeads(): Promise<Lead[]> {
  try {
    const res = await fetch(`${PLATFORM}/leads`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return (await res.json()) as Lead[];
  } catch (err) {
    console.error("listLeads failed", err);
    return [];
  }
}

/** Update a lead's status (new|contacted|converted|closed). */
export async function setLeadStatus(
  id: string,
  status: string
): Promise<boolean> {
  try {
    const res = await fetch(`${PLATFORM}/leads/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.error("setLeadStatus failed", err);
    return false;
  }
}

// --- Stripe billing (platform-level payment configuration) ------------------

export type BillingPlan = "pro" | "cultural";
export type BillingCycle = "monthly" | "annual";

/**
 * Read whether the platform's Stripe account is configured. Returns
 * `{ configured: false }` on any failure so the UI can render a safe default.
 */
export async function getStripeStatus(): Promise<{ configured: boolean }> {
  try {
    const res = await fetch(`${PLATFORM}/settings/stripe`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { configured: false };
    const data = (await res.json()) as { configured?: unknown };
    return { configured: data?.configured === true };
  } catch (err) {
    console.error("getStripeStatus failed", err);
    return { configured: false };
  }
}

/**
 * Store the platform's Stripe secret + webhook signing keys. On a 400 (keys
 * malformed) surfaces the backend `detail` as `error`.
 */
export async function setStripeConfig(
  secretKey: string,
  webhookSecret: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${PLATFORM}/settings/stripe`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ secretKey, webhookSecret }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: await readDetail(
          res,
          `Salvarea cheilor Stripe a eșuat (${res.status}).`
        ),
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("setStripeConfig failed", err);
    return { ok: false, error: "Eroare de rețea. Încearcă din nou." };
  }
}

/**
 * Start a Stripe Checkout session for a tenant's paid plan. On success returns
 * the hosted-checkout `url` to redirect to. On 503 (Stripe not configured) sets
 * `notConfigured: true` and surfaces the backend `detail`; other failures
 * (400 non-payable plan, 502 Stripe error) come back as `error`.
 */
export async function createCheckout(
  slug: string,
  plan: BillingPlan,
  cycle: BillingCycle
): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
  notConfigured?: boolean;
}> {
  try {
    const res = await fetch(`${PLATFORM}/tenants/${slug}/checkout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ plan, cycle }),
    });
    if (!res.ok) {
      const error = await readDetail(
        res,
        `Nu s-a putut porni plata (${res.status}).`
      );
      if (res.status === 503) {
        return { ok: false, notConfigured: true, error };
      }
      return { ok: false, error };
    }
    const data = (await res.json()) as { url?: unknown };
    if (typeof data?.url !== "string" || !data.url) {
      return { ok: false, error: "Răspuns invalid de la server (fără URL)." };
    }
    return { ok: true, url: data.url };
  } catch (err) {
    console.error("createCheckout failed", err);
    return { ok: false, error: "Eroare de rețea. Încearcă din nou." };
  }
}
