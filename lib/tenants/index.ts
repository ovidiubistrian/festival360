import type { Tenant } from "./types";
import { prispaTenant } from "./prispa";

/**
 * Tenant registry. Add a festival by importing its Tenant object and adding it
 * here — every public route resolves the tenant from this map by slug.
 */
export const tenants: Record<string, Tenant> = {
  prispa: prispaTenant,
};

export const tenantSlugs = Object.keys(tenants);

export function getTenant(slug: string): Tenant | undefined {
  return tenants[slug];
}

/** All slugs, for generateStaticParams. */
export function getAllTenantSlugs(): { tenant: string }[] {
  return tenantSlugs.map((tenant) => ({ tenant }));
}

export * from "./types";
