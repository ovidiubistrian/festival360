import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based multi-tenancy. On a custom domain (or a platform subdomain), the
 * tenant's site is served at the ROOT: we resolve the tenant slug from the Host
 * header and internally rewrite `/…` → `/{slug}/…` — the URL the visitor sees
 * stays the custom domain. On the platform domain (and localhost / Vercel),
 * routing is left untouched (marketing site + /{slug} + /demo-admin).
 */

const PLATFORM_DOMAIN = (
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "siteora.ro"
).toLowerCase();

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

// Per-instance host → slug cache (best-effort, short TTL).
const cache = new Map<string, { slug: string | null; expires: number }>();
const TTL_MS = 60_000;

function isPlatformHost(host: string): boolean {
  return (
    host === "" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === PLATFORM_DOMAIN ||
    host === `www.${PLATFORM_DOMAIN}` ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".local")
  );
}

async function resolveSlug(host: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache.get(host);
  if (hit && hit.expires > now) return hit.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/platform/tenant-by-domain?host=${encodeURIComponent(host)}`,
      { headers: { accept: "application/json" } }
    );
    if (res.ok) slug = ((await res.json()) as { slug?: string }).slug ?? null;
  } catch {
    slug = null;
  }
  cache.set(host, { slug, expires: now + TTL_MS });
  return slug;
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  if (isPlatformHost(host)) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // Platform-only paths never get tenant-rewritten.
  if (pathname.startsWith("/demo-admin")) return NextResponse.next();

  const slug = await resolveSlug(host);
  if (!slug) return NextResponse.next();

  // Avoid double-prefixing if already under /{slug}.
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API, media proxy, and static files.
  matcher: [
    "/((?!_next/|api/|media/|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)",
  ],
};
