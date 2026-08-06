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
    pageTitle: "Campinguri",
    description: `Locuri de camping în zona ${info.name} — corturi, rulote și camping în mijlocul naturii.`,
    path: "/campinguri",
  });
}

export default async function CampingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // Campinguri is a resort-only split of accommodations; other verticals do not
  // expose this route.
  if (config.eventType !== "resort") notFound();

  const published = (content.accommodations ?? []).filter(
    (a) => a.status === "published" && a.type === "camping"
  );
  const featured = published.find((a) => a.featured);
  const rest = published.filter((a) => a.id !== featured?.id);
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="În mijlocul naturii"
        title={L("campingsPageTitle", "Campinguri")}
        description={L(
          "campingsPageDescription",
          "Locuri de camping pentru corturi și rulote — natură, liniște și aer curat, aproape de tot."
        )}
        image={config.info.heroImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Campinguri" },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Locuri de camping"
            title="Dormi sub cerul liber"
            description="De la campinguri amenajate la locuri sălbatice — găsește popasul potrivit pentru aventura ta."
          />

          {published.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-border bg-secondary/40 py-20 text-center">
              <p className="text-base font-medium text-primary">În curând</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Lista de campinguri va fi disponibilă în curând. Revino mai
                târziu pentru recomandări.
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
