import type { MetadataRoute } from "next";
import { getSlugByDomain, getTenantBundle, getTenantSlugs } from "@/lib/api";
import { isPlatformHost, requestHost } from "@/lib/seo";
import { isExternalHref } from "@/lib/utils";
import type { PublishStatus, Tenant } from "@/lib/tenants/types";

/**
 * Host-aware, multi-tenant sitemap.
 *
 * - Platform domain / localhost / previews → the marketing homepage plus each
 *   known tenant's homepage (`/{slug}`).
 * - A tenant custom domain → the tenant's site served at the ROOT: homepage,
 *   every navigation section, and every PUBLISHED content detail page.
 *
 * Every URL is absolute (`https://<host>/…`) so the file is valid on whichever
 * host serves it.
 */

function originFor(rawHost: string): string {
  const bare = rawHost.split(":")[0].toLowerCase();
  const proto = bare === "localhost" || bare === "127.0.0.1" ? "http" : "https";
  return `${proto}://${rawHost}`;
}

function published<T extends { status: PublishStatus; slug: string }>(
  items: T[] | undefined
): T[] {
  return (items ?? []).filter((x) => x.status === "published");
}

/** Full URL set for a tenant served at the root of `origin`. */
function tenantEntries(t: Tenant, origin: string): MetadataRoute.Sitemap {
  const { config, content } = t;
  const url = (path: string) =>
    `${origin}${path.startsWith("/") ? path : `/${path}`}`;

  const entries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
  ];

  // Section pages come from the tenant's own (vertical-aware) navigation.
  for (const item of config.navigation) {
    // Linkurile personalizate pot duce în afara site-ului — nu au ce căuta aici.
    if (item.href && item.href !== "/" && !isExternalHref(item.href)) {
      entries.push({
        url: url(item.href),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  const details: { prefix: string; items: { slug: string }[] }[] = [
    { prefix: "/cazari", items: published(content.accommodations) },
    { prefix: "/restaurante", items: published(content.restaurants) },
    { prefix: "/evenimente", items: published(content.events) },
    { prefix: "/destinatii", items: published(content.destinations) },
    { prefix: "/produse", items: published(content.products) },
    { prefix: "/expozanti", items: published(content.exhibitors) },
    { prefix: "/noutati", items: published(content.articles) },
  ];
  for (const group of details) {
    for (const it of group.items) {
      entries.push({
        url: url(`${group.prefix}/${it.slug}`),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawHost = await requestHost();
  const bare = rawHost.split(":")[0].toLowerCase();
  const origin = originFor(rawHost);

  // Platform domain (and localhost / previews): marketing + tenant homepages.
  if (isPlatformHost(bare)) {
    const entries: MetadataRoute.Sitemap = [
      { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    ];
    const slugs = await getTenantSlugs();
    for (const slug of slugs) {
      entries.push({
        url: `${origin}/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    return entries;
  }

  // Custom domain: resolve the tenant and emit its full page map at the root.
  const slug = await getSlugByDomain(rawHost);
  const homeOnly: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
  ];
  if (!slug) return homeOnly;

  const t = await getTenantBundle(slug);
  if (!t) return homeOnly;
  // A tenant hidden from search engines gets only its homepage listed.
  if (t.config.seo?.noindex) return homeOnly;

  return tenantEntries(t, origin);
}
