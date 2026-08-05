import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { PageHero } from "@/components/public/page-hero";
import { DestinationCard } from "@/components/public/cards/destination-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Destinații turistice";
  const description = `Sate autentice, destinații de munte și experiențe în natură din regiunile festivalului ${info.name}.`;
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

export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const published = content.destinations.filter(
    (d) => d.status === "published"
  );
  const editorial = published.find((d) => d.editorial);
  const rest = published.filter((d) => d.id !== editorial?.id);
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="Turism și natură"
        title={L("destinationsPageTitle", "Destinații turistice")}
        description={L(
          "destinationsPageDescription",
          "Descoperă regiunile din spatele produselor: sate de poveste, peisaje de munte și experiențe autentice."
        )}
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Destinații" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Explorează regiunile"
            title="România autentică, dincolo de festival"
            description="Fiecare destinație vine cu atracții, experiențe și gusturi locale — inspirație pentru următoarea ta călătorie."
          />

          {editorial && (
            <div className="mt-10">
              <Reveal>
                <DestinationCard
                  destination={editorial}
                  slug={slug}
                  large
                />
              </Reveal>
            </div>
          )}

          {rest.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((d, i) => (
                <Reveal key={d.id} delayIndex={i % 3}>
                  <DestinationCard destination={d} slug={slug} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
