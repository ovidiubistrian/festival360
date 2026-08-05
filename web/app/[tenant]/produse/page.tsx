import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/public/page-hero";
import { ProductExplorer } from "@/components/public/product-explorer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Produse locale";
  const description = `Gusturi cu origine cunoscută de la ${info.name}: fiecare produs are un producător, un loc și o poveste.`;
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

export default async function ProductsPage({
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
        eyebrow="Gusturi cu origine"
        title={L("productsPageTitle", "Produse locale")}
        description={L(
          "productsPageDescription",
          "Brânzeturi, miere, dulcețuri, siropuri, ceramică și afumături — fiecare cu producătorul și povestea sa."
        )}
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Produse" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Descoperă produsele"
            title="Gusturi cu poveste"
            description="Filtrează după categorie și regiune sau caută produsul ori producătorul preferat."
          />
          <div className="mt-10">
            <ProductExplorer products={content.products} slug={slug} />
          </div>
        </Container>
      </section>
    </>
  );
}
