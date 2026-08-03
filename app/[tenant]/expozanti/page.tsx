import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenant, getAllTenantSlugs } from "@/lib/tenants";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/public/page-hero";
import { ExhibitorExplorer } from "@/components/public/exhibitor-explorer";

export function generateStaticParams() {
  return getAllTenantSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = getTenant(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Expozanți";
  const description = `Producători, meșteșugari și povești din toată țara, prezenți la ${info.name}. Caută după categorie și regiune.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${info.name}`,
      description,
      images: [info.heroImage],
    },
  };
}

export default async function ExhibitorsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = getTenant(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;

  return (
    <>
      <PageHero
        eyebrow="Oameni cu poveste"
        title="Expozanți și producători"
        description="Peste 100 de producători și meșteșugari aleși pe sprânceană — brânzeturi, miere, ceramică, afumături și multe altele."
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
