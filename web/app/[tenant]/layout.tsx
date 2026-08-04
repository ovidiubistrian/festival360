import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
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

  return (
    <>
      <SiteHeader
        slug={t.slug}
        logoText={t.config.info.logoText}
        navigation={t.config.navigation}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter slug={t.slug} config={t.config} />
      <Toaster />
    </>
  );
}
