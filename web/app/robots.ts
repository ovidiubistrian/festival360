import type { MetadataRoute } from "next";
import { getSlugByDomain, getTenantBundle } from "@/lib/api";
import { isPlatformHost, requestHost } from "@/lib/seo";

/**
 * Host-aware robots. Always allows crawling, always keeps the admin out, and
 * points at the host's own sitemap. On a tenant custom domain that has opted
 * into `noindex`, the whole site is disallowed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const rawHost = await requestHost();
  const bare = rawHost.split(":")[0].toLowerCase();
  const proto = bare === "localhost" || bare === "127.0.0.1" ? "http" : "https";
  const origin = `${proto}://${rawHost}`;

  const disallow = ["/admin"];

  // On a custom domain, respect the tenant's "hide from search engines" toggle.
  if (!isPlatformHost(bare)) {
    const slug = await getSlugByDomain(rawHost);
    if (slug) {
      const t = await getTenantBundle(slug);
      if (t?.config.seo?.noindex) disallow.push("/");
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
