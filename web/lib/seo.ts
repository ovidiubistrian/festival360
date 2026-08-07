import { headers } from "next/headers";
import type { Metadata } from "next";
import type { Tenant } from "@/lib/tenants/types";

/**
 * Shared, multi-tenant SEO helpers.
 *
 * Every public tenant page builds its `Metadata` through `tenantMetadata()`, so
 * title / description / canonical / Open Graph / Twitter / robots stay
 * consistent and per-tenant configurable (`config.seo`), while empty keys fall
 * back to sensible defaults derived from the tenant's own info.
 *
 * The catch with this codebase is host-based multi-tenancy: on a custom domain a
 * tenant lives at the ROOT (`/cazari`), but on the platform domain (and
 * localhost / Vercel previews) the same page is served under `/{slug}/cazari`.
 * The public URL therefore has to be resolved from the request `Host` header.
 */

const PLATFORM_DOMAIN = (
  process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "siteora.ro"
).toLowerCase();

/** ~155 chars is the sweet spot for a meta/OG description. */
const MAX_DESCRIPTION = 155;

/** Mirror of middleware's platform-host test (host is served under /{slug}). */
export function isPlatformHost(bareHost: string): boolean {
  return (
    bareHost === "" ||
    bareHost === "localhost" ||
    bareHost === "127.0.0.1" ||
    bareHost === PLATFORM_DOMAIN ||
    bareHost === `www.${PLATFORM_DOMAIN}` ||
    bareHost.endsWith(".vercel.app") ||
    bareHost.endsWith(".local")
  );
}

function protocolFor(bareHost: string): "http" | "https" {
  return bareHost === "localhost" || bareHost === "127.0.0.1"
    ? "http"
    : "https";
}

/** Raw `Host` header (may include a port), defaulting to the platform domain. */
export async function requestHost(): Promise<string> {
  const h = await headers();
  return h.get("host") || PLATFORM_DOMAIN;
}

/** Absolute origin for the current request, e.g. `https://prispa.ro`. */
export async function requestOrigin(): Promise<string> {
  const host = await requestHost();
  const bare = host.split(":")[0].toLowerCase();
  return `${protocolFor(bare)}://${host}`;
}

/** Trim a description to ~155 chars on a word boundary, adding an ellipsis. */
export function clampDescription(text: string, max = MAX_DESCRIPTION): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

/**
 * Resolve a tenant-relative path (e.g. "/cazari", or "/" for the homepage) into
 * the public path the visitor actually sees, honoring the platform vs. custom
 * domain distinction. Returns a path starting with "/".
 */
function publicPath(t: Tenant, host: string, path: string): string {
  const bare = host.split(":")[0].toLowerCase();
  const prefix = isPlatformHost(bare) ? `/${t.slug}` : "";
  const rel = path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${rel}` || "/";
}

/** Absolute public URL for a tenant-relative path (used for JSON-LD, etc.). */
export async function tenantPublicUrl(t: Tenant, path: string): Promise<string> {
  const host = await requestHost();
  const bare = host.split(":")[0].toLowerCase();
  const origin = `${protocolFor(bare)}://${host}`;
  return `${origin}${publicPath(t, host, path)}`;
}

export interface TenantMetadataOptions {
  /** Sub-page title; when set the title becomes "{pageTitle} · {name}". */
  pageTitle?: string;
  /** Page-specific description; falls back to config.seo / shortDescription. */
  description?: string;
  /** Tenant-relative path, e.g. "/cazari" or "/cazari/slug" ("/" = home). */
  path: string;
  /** Page-specific share image; falls back to config.seo.ogImage / heroImage. */
  image?: string;
  /** Open Graph object type; defaults to "website". */
  ogType?: "website" | "article";
}

/**
 * Build a complete Next `Metadata` object for a tenant page. Site-level fields
 * come from `config.seo` with graceful fallbacks; per-page overrides win.
 */
export async function tenantMetadata(
  t: Tenant,
  opts: TenantMetadataOptions
): Promise<Metadata> {
  const { info } = t.config;
  const seo = t.config.seo ?? {};
  const host = await requestHost();
  const bare = host.split(":")[0].toLowerCase();
  const origin = `${protocolFor(bare)}://${host}`;

  const siteTitle = seo.title?.trim() || `${info.name} — ${info.tagline}`;
  const title = opts.pageTitle?.trim()
    ? `${opts.pageTitle.trim()} · ${info.name}`
    : siteTitle;

  const description = clampDescription(
    opts.description?.trim() ||
      seo.description?.trim() ||
      info.shortDescription ||
      ""
  );

  const image = (opts.image?.trim() || seo.ogImage?.trim() || info.heroImage || "").trim();
  const canonical = publicPath(t, host, opts.path);

  const keywords = seo.keywords
    ? seo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;

  const metadata: Metadata = {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: info.name,
      locale: "ro_RO",
      type: opts.ogType ?? "website",
      // Lățimea/înălțimea contează: fără ele Facebook nu redă poza la prima
      // accesare a linkului. Le știm doar pentru imaginea de share încărcată
      // în admin (API-ul le citește din fișier), nu și pentru cele externe.
      ...(image
        ? {
            images: [
              {
                url: image,
                alt: title,
                ...(image === seo.ogImage?.trim() &&
                seo.ogImageWidth &&
                seo.ogImageHeight
                  ? { width: seo.ogImageWidth, height: seo.ogImageHeight }
                  : {}),
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots:
      seo.noindex === true
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };

  if (keywords && keywords.length > 0) {
    metadata.keywords = keywords;
  }
  if (seo.googleSiteVerification?.trim()) {
    // Din Search Console se copiază adesea tot tag-ul sau perechea
    // `google-site-verification=TOKEN`; Google așteaptă în `content` DOAR
    // tokenul, altfel verificarea eșuează.
    const token = seo.googleSiteVerification
      .trim()
      .replace(/^<meta[^>]*content=["']?/i, "")
      .replace(/^google-site-verification[=:]\s*/i, "")
      .replace(/["'\s/>]+$/g, "")
      .trim();
    if (token) metadata.verification = { google: token };
  }

  return metadata;
}
