import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/public/page-hero";
import { ExhibitorExplorer } from "@/components/public/exhibitor-explorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  return tenantMetadata(t, {
    pageTitle: "Expozanți",
    description: `Producători, meșteșugari și povești din toată țara, prezenți la ${info.name}. Caută după categorie și regiune.`,
    path: "/expozanti",
  });
}

export default async function ExhibitorsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="Oameni cu poveste"
        title={L("exhibitorsPageTitle", "Expozanți și producători")}
        description={L(
          "exhibitorsPageDescription",
          "Peste 100 de producători și meșteșugari aleși pe sprânceană — brânzeturi, miere, ceramică, afumături și multe altele."
        )}
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Expozanți" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Descoperă expozanții"
            title="Fiecare stand, o poveste"
            description="Filtrează după categorie și regiune sau caută direct producătorul care te interesează."
          />
          <div className="mt-10">
            <ExhibitorExplorer exhibitors={content.exhibitors} slug={slug} />
          </div>
        </Container>
      </section>
    </>
  );
}
