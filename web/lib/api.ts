import type {
  Tenant,
  Exhibitor,
  Product,
  Destination,
  Article,
} from "@/lib/tenants/types";

/**
 * API client for the FastAPI backend.
 *
 * The backend returns data in exactly the frontend `Tenant` shape (camelCase,
 * nested config), so responses can be used directly by the existing UI.
 *
 * Set NEXT_PUBLIC_API_BASE_URL to point at the API (defaults to local dev).
 */
// On the server (SSR) prefer the internal service URL (fast, no public hop);
// in the browser only NEXT_PUBLIC_* is available, so it falls back to that.
export const API_BASE_URL =
  process.env.API_INTERNAL_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

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

/** Known tenant slugs (used for routing / static params). */
export async function getTenantSlugs(): Promise<string[]> {
  const list = await apiGet<{ slug: string }[]>("/tenants", { revalidate: 300 });
  return (list ?? []).map((t) => t.slug);
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

export async function subscribeNewsletter(
  slug: string,
  email: string,
  source = "Website"
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/tenants/${slug}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
