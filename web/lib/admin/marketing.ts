"use client";

/**
 * Marketing admin API client — per-tenant SMTP config, newsletter subscriber
 * list, and email campaigns. Talks to the real FastAPI backend under
 * `/api/v1/tenants/{slug}/admin/marketing` with tenant-admin Bearer auth.
 *
 * Mirrors the conventions in `lib/admin/api.ts`: every function catches/logs
 * its own errors and resolves with a typed result — it never throws — so
 * callers (React pages) can stay simple. The SMTP password is NEVER returned
 * by the API and is never logged here.
 */

import { authHeaders, getToken } from "@/lib/admin/api";
import { getCurrentTenant } from "@/lib/admin/session";
import { apiBaseUrl } from "@/lib/api-base";

const API = `${apiBaseUrl()}/api/v1`;

/** Base URL for the current tenant's marketing admin API, or null. */
function marketingBase(): string | null {
  const slug = getCurrentTenant();
  if (!slug) return null;
  return `${API}/tenants/${slug}/admin/marketing`;
}

/** Email settings as returned by the API (password NEVER included). */
export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
  enabled: boolean;
  /** Whether a password is stored (the value itself is never returned). */
  hasPassword: boolean;
  /** Whether the config is complete enough to actually send mail. */
  configured: boolean;
}

/** Patch body for `PUT /email-settings`. Send `smtpPassword` ONLY when the
 * user typed a new one — omit/empty keeps the stored password. */
export interface EmailSettingsPatch {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  fromName: string;
  fromEmail: string;
  useTls: boolean;
  enabled: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  date: string;
  source: string;
}

export interface SendResult {
  ok: boolean;
  sent?: number;
  failed?: number;
  total?: number;
  errors?: string[];
  error?: string;
}

export interface TestResult {
  ok: boolean;
  error?: string;
}

/** Fetch the current tenant's email settings, or null on any error. */
export async function getEmailSettings(): Promise<EmailSettings | null> {
  const base = marketingBase();
  if (!base) {
    console.warn("getEmailSettings: no tenant selected — skipping");
    return null;
  }
  try {
    const res = await fetch(`${base}/email-settings`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as EmailSettings;
  } catch (err) {
    console.error("getEmailSettings failed", err);
    return null;
  }
}

/**
 * Persist the email settings. Include `smtpPassword` in `patch` ONLY when the
 * user entered a new password — an omitted/empty value keeps the stored one.
 * Returns the updated settings, or null on error.
 */
export async function saveEmailSettings(
  patch: EmailSettingsPatch
): Promise<EmailSettings | null> {
  const base = marketingBase();
  if (!base) {
    console.warn("saveEmailSettings: no tenant selected — skipping");
    return null;
  }
  try {
    const res = await fetch(`${base}/email-settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) return null;
    return (await res.json()) as EmailSettings;
  } catch (err) {
    console.error("saveEmailSettings failed", err);
    return null;
  }
}

/** Send a test email to `to`. Returns `{ ok, error? }`. */
export async function sendTestEmail(to: string): Promise<TestResult> {
  const base = marketingBase();
  if (!base) {
    return { ok: false, error: "Niciun site selectat." };
  }
  try {
    const res = await fetch(`${base}/email-settings/test`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ to }),
    });
    if (!res.ok) {
      return { ok: false, error: `Eroare server (${res.status}).` };
    }
    return (await res.json()) as TestResult;
  } catch (err) {
    console.error("sendTestEmail failed", err);
    return { ok: false, error: "Trimiterea a eșuat." };
  }
}

/** Fetch the current tenant's newsletter subscribers (empty list on error). */
export async function getSubscribers(): Promise<Subscriber[]> {
  const base = marketingBase();
  if (!base) {
    console.warn("getSubscribers: no tenant selected — skipping");
    return [];
  }
  try {
    const res = await fetch(`${base}/subscribers`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Subscriber[];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getSubscribers failed", err);
    return [];
  }
}

/** Send a plain-text campaign to ALL subscribers. Returns the send report. */
export async function sendCampaign(
  subject: string,
  body: string
): Promise<SendResult> {
  const base = marketingBase();
  if (!base) {
    return { ok: false, error: "Niciun site selectat." };
  }
  try {
    const res = await fetch(`${base}/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ subject, body }),
    });
    if (!res.ok) {
      return { ok: false, error: `Eroare server (${res.status}).` };
    }
    return (await res.json()) as SendResult;
  } catch (err) {
    console.error("sendCampaign failed", err);
    return { ok: false, error: "Trimiterea a eșuat." };
  }
}

/** Re-export so pages can guard on a missing token if needed. */
export { getToken };
