import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { AnalyticsBeacon } from "@/components/public/analytics-beacon";
import { Toaster } from "@/components/ui/sonner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  return {
    title: {
      default: `${info.name} — ${info.tagline}`,
      template: `%s · ${info.name}`,
    },
    description: info.shortDescription,
    openGraph: {
      title: `${info.name} — ${info.tagline}`,
      description: info.shortDescription,
      images: [info.heroImage],
      locale: "ro_RO",
      type: "website",
    },
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  // Per-tenant branding: map the tenant theme onto the design tokens so each
  // festival/resort renders in its own palette. `display: contents` keeps the
  // flex layout intact while the custom properties cascade to all children.
  const th = t.config.theme;
  const themeVars = {
    display: "contents",
    "--primary": th.primary,
    "--prispa-green": th.primary,
    "--prispa-green-700": th.primary,
    "--prispa-green-600": th.primary,
    "--secondary": th.secondary,
    "--cream": th.secondary,
    "--cream-200": th.secondary,
    "--terracotta": th.terracotta,
    "--terracotta-600": th.terracotta,
    "--gold": th.gold,
    "--gold-600": th.gold,
    "--charcoal": th.charcoal,
    "--foreground": th.charcoal,
    "--warm-white": th.background,
    "--background": th.background,
    "--ring": th.primary,
    "--primary-foreground": th.secondary,
    "--secondary-foreground": th.primary,
  } as React.CSSProperties;

  return (
    <div style={themeVars}>
      <AnalyticsBeacon slug={t.slug} />
      <SiteHeader
        slug={t.slug}
        logoText={t.config.info.logoText}
        navigation={t.config.navigation}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter slug={t.slug} config={t.config} />
      <Toaster />
    </div>
  );
}
