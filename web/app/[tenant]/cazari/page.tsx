import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { PageHero } from "@/components/public/page-hero";
import { AccommodationCard } from "@/components/public/cards/accommodation-card";

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
    pageTitle: "Cazări",
    description: `Unități de cazare recomandate în zona ${info.name}: hoteluri, pensiuni, cabane și vile.`,
    path: "/cazari",
  });
}

export default async function AccommodationsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // On a resort, camping has its own "Campinguri" list, so the Cazări list shows
  // lodging only. Other verticals keep the full list unchanged.
  const isResort = config.eventType === "resort";
  const published = (content.accommodations ?? []).filter(
    (a) => a.status === "published" && (!isResort || a.type !== "camping")
  );
  const featured = published.find((a) => a.featured);
  const rest = published.filter((a) => a.id !== featured?.id);
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="Unde stai"
        title={L("accommodationsPageTitle", "Cazări")}
        description={L(
          "accommodationsPageDescription",
          "Hoteluri, pensiuni, cabane și vile pentru un sejur pe placul tău — alege și rezervă direct."
        )}
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Cazări" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Locuri de cazare"
            title="Un sejur confortabil, aproape de tot"
            description="De la cabane liniștite la pensiuni primitoare — găsește locul potrivit pentru vizita ta."
          />

          {published.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-border bg-secondary/40 py-20 text-center">
              <p className="text-base font-medium text-primary">
                În curând
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Lista de cazări va fi disponibilă în curând. Revino mai târziu
                pentru recomandări.
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mt-10">
                  <Reveal>
                    <AccommodationCard
                      accommodation={featured}
                      slug={slug}
                      large
                    />
                  </Reveal>
                </div>
              )}

              {rest.length > 0 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((a, i) => (
                    <Reveal key={a.id} delayIndex={i % 3}>
                      <AccommodationCard accommodation={a} slug={slug} />
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
