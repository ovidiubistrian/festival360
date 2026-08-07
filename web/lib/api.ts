import type {
  Tenant,
  Exhibitor,
  FormDefinition,
  Product,
  Accommodation,
  Destination,
  Article,
} from "@/lib/tenants/types";
import { apiBaseUrl } from "@/lib/api-base";

/**
 * API client for the FastAPI backend.
 *
 * The backend returns data in exactly the frontend `Tenant` shape (camelCase,
 * nested config), so responses can be used directly by the existing UI.
 *
 * Set NEXT_PUBLIC_API_BASE_URL to point at the API (defaults to local dev).
 */
export const API_BASE_URL = apiBaseUrl();

const API = `${API_BASE_URL}/api/v1`;

type FetchOpts = { revalidate?: number; noStore?: boolean };

async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  const init: RequestInit & { next?: { revalidate?: number } } = {};
  if (opts.noStore) init.cache = "no-store";
  else init.next = { revalidate: opts.revalidate ?? 30 };

  try {
    const res = await fetch(`${API}${path}`, init);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] GET ${path} failed:`, err);
    return null;
  }
}

/** Full tenant bundle (config + content) — replaces the old local getTenant(). */
export function getTenantBundle(slug: string): Promise<Tenant | null> {
  return apiGet<Tenant>(`/tenants/${slug}`, { noStore: true });
}

export function getExhibitor(
  slug: string,
  itemSlug: string
): Promise<Exhibitor | null> {
  return apiGet<Exhibitor>(`/tenants/${slug}/exhibitors/${itemSlug}`, {
    noStore: true,
  });
}

export function getProduct(
  slug: string,
  itemSlug: string
): Promise<Product | null> {
  return apiGet<Product>(`/tenants/${slug}/products/${itemSlug}`, {
    noStore: true,
  });
}

export function getAccommodation(
  slug: string,
  itemSlug: string
): Promise<Accommodation | null> {
  return apiGet<Accommodation>(`/tenants/${slug}/accommodations/${itemSlug}`, {
    noStore: true,
  });
}

export function getDestination(
  slug: string,
  itemSlug: string
): Promise<Destination | null> {
  return apiGet<Destination>(`/tenants/${slug}/destinations/${itemSlug}`, {
    noStore: true,
  });
}

export function getArticle(
  slug: string,
  itemSlug: string
): Promise<Article | null> {
  return apiGet<Article>(`/tenants/${slug}/articles/${itemSlug}`, {
    noStore: true,
  });
}

/** A published form by its slug; null when missing or still a draft. */
export function getForm(
  slug: string,
  formSlug: string
): Promise<FormDefinition | null> {
  return apiGet<FormDefinition>(`/tenants/${slug}/forms/${formSlug}`, {
    noStore: true,
  });
}

/** Known tenant slugs (used for routing / static params). */
export async function getTenantSlugs(): Promise<string[]> {
  const list = await apiGet<{ slug: string }[]>("/tenants", { revalidate: 300 });
  return (list ?? []).map((t) => t.slug);
}

/**
 * Resolve a custom domain (Host header) to a tenant slug — the same lookup the
 * middleware uses. Returns null when the host maps to no tenant. Used by the
 * host-aware sitemap/robots routes.
 */
export async function getSlugByDomain(host: string): Promise<string | null> {
  const res = await apiGet<{ slug?: string }>(
    `/platform/tenant-by-domain?host=${encodeURIComponent(host)}`,
    { noStore: true }
  );
  return res?.slug ?? null;
}

// --- Public write actions (called from client components) --------------------

export async function submitContactMessage(
  slug: string,
  data: { name: string; email: string; subject: string; message: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/tenants/${slug}/contact-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Rezultatul trimiterii unui formular construit din admin. */
export type FormSubmitResult = { ok: boolean; error?: string };

/**
 * Trimite un formular. Valorile sunt `{idCâmp: valoare}` — validarea „serioasă”
 * (obligatorii, opțiuni permise, total) se face pe server, care întoarce 422 cu
 * un mesaj gata de afișat.
 */
export async function submitForm(
  slug: string,
  formSlug: string,
  values: Record<string, string | boolean | string[]>
): Promise<FormSubmitResult> {
  try {
    const res = await fetch(
      `${API}/tenants/${slug}/forms/${formSlug}/submissions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );
    if (res.ok) return { ok: true };
    const detail = await res
      .json()
      .then((d: { detail?: string }) => d?.detail)
      .catch(() => undefined);
    return { ok: false, error: typeof detail === "string" ? detail : undefined };
  } catch {
    return { ok: false };
  }
}

export async function subscribeNewsletter(
  slug: string,
  email: string,
  source = "Website",
  name = ""
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/tenants/${slug}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source, name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Platform commercial (pricing + signup) ---------------------------------

/** A commercial plan/package shown on the marketing landing. */
export type Package = {
  id: string;
  code: string;
  label: string;
  tagline: string;
  /** Monthly price in MINOR UNITS (bani, 1/100 RON). 0 → "La cerere". */
  priceMonthlyBani: number;
  /** Annual price in MINOR UNITS (bani); may be null. */
  priceAnnualBani: number | null;
  currency: string;
  benefits: string[];
  seats: number | null;
  isFeatured: boolean;
};

/** Public list of commercial packages (revalidated ~5 min). */
export function getPackages(): Promise<Package[] | null> {
  return apiGet<Package[]>("/platform/packages", { revalidate: 300 });
}

/**
 * Marketing landing (siteora.ro) hero configuration. Every field is optional —
 * the landing falls back to its hardcoded defaults for any field left unset, so
 * an empty config renders exactly as the original page.
 */
export type LandingConfig = {
  heroBadge?: string;
  heroTitle?: string;
  heroTaglineEn?: string;
  heroDescription?: string;
  heroImage?: string;
  heroCtaPrimaryLabel?: string;
  heroCtaPrimaryHref?: string;
  heroCtaSecondaryLabel?: string;
  heroCtaSecondaryHref?: string;
};

/** Public landing config. Returns `{}` on any failure (revalidated ~30s). */
export async function getLanding(): Promise<LandingConfig> {
  const config = await apiGet<LandingConfig>("/platform/landing", {
    revalidate: 30,
  });
  return config ?? {};
}

/**
 * Format a minor-unit (bani) amount as an integer RON string, e.g. 24900 →
 * "249 RON". Shows decimals only when the amount isn't a whole RON value.
 */
export function formatBani(bani: number, currency = "RON"): string {
  const value = bani / 100;
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  const amount = value.toLocaleString("ro-RO", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${amount} ${currency}`;
}

/** Submit a signup/lead from the landing page. Client-usable. */
export async function submitSignup(input: {
  name: string;
  email: string;
  organization: string;
  eventType: string;
  plan: string;
  message: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API}/platform/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}
