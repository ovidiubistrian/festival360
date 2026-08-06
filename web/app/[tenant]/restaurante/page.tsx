import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { PageHero } from "@/components/public/page-hero";
import { RestaurantCard } from "@/components/public/cards/restaurant-card";

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
    pageTitle: "Restaurante",
    description: `Restaurante și localuri din zona ${info.name} — bucătărie locală, terase și rezervări.`,
    path: "/restaurante",
  });
}

export default async function RestaurantsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // Restaurante is a resort-only module; other verticals do not expose it.
  if (config.eventType !== "resort") notFound();

  const published = (content.restaurants ?? []).filter(
    (r) => r.status === "published"
  );
  const featured = published.find((r) => r.featured);
  const rest = published.filter((r) => r.id !== featured?.id);
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="Unde mănânci"
        title={L("restaurantsPageTitle", "Restaurante")}
        description={L(
          "restaurantsPageDescription",
          "Restaurante și localuri din zonă — bucătărie locală, terase primitoare și rezervări directe."
        )}
        image={config.info.heroImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Restaurante" },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Gastronomie"
            title="Gusturi din inima locului"
            description="De la bucătărie tradițională la localuri moderne — alege unde mănânci și rezervă-ți masa."
          />

          {published.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-border bg-secondary/40 py-20 text-center">
              <p className="text-base font-medium text-primary">În curând</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Lista de restaurante va fi disponibilă în curând. Revino mai
                târziu pentru recomandări.
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mt-10">
                  <Reveal>
                    <RestaurantCard restaurant={featured} slug={slug} large />
                  </Reveal>
                </div>
              )}

              {rest.length > 0 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((r, i) => (
                    <Reveal key={r.id} delayIndex={i % 3}>
                      <RestaurantCard restaurant={r} slug={slug} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
