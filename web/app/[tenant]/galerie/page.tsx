import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/public/page-hero";
import { GalleryGrid } from "@/components/public/gallery-grid";

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
    pageTitle: "Galerie",
    description: `${info.name} în imagini: gastronomie, tradiții, concerte, produse și natură.`,
    path: "/galerie",
  });
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;

  return (
    <>
      <PageHero
        eyebrow="Festivalul în imagini"
        title="Galerie foto"
        description="Momente din edițiile trecute: gastronomie, tradiții, concerte, meșteșuguri și peisaje de poveste."
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Galerie" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Galerie"
            title="Atmosfera VATRA, cadru cu cadru"
            description="Filtrează după categorie și deschide imaginile pentru a le vedea la dimensiune completă."
          />
          <div className="mt-10">
            <GalleryGrid images={content.gallery} filterable />
          </div>
        </Container>
      </section>
    </>
  );
}
