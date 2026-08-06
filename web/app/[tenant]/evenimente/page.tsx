import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { PageHero } from "@/components/public/page-hero";
import { EventCard } from "@/components/public/cards/event-card";

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
    pageTitle: "Evenimente",
    description: `Evenimente și concerte din ${info.name} — programe, bilete și detalii.`,
    path: "/evenimente",
  });
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // Evenimente is a resort-only module; other verticals do not expose it.
  if (config.eventType !== "resort") notFound();

  const published = (content.events ?? []).filter(
    (e) => e.status === "published"
  );
  const featured = published.find((e) => e.featured);
  const rest = published.filter((e) => e.id !== featured?.id);
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow={L("eventsEyebrow", "Ce se întâmplă")}
        title={L("eventsTitle", "Evenimente")}
        description={L(
          "eventsDescription",
          "Concerte, festivaluri și întâlniri din stațiune — vezi programul și cumpără bilete."
        )}
        image={config.info.heroImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Evenimente" },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Agenda"
            title="Ce se întâmplă în stațiune"
            description="De la concerte și festivaluri la ateliere și întâlniri — alege un eveniment și rezervă-ți locul."
          />

          {published.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-border bg-secondary/40 py-20 text-center">
              <p className="text-base font-medium text-primary">În curând</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Lista de evenimente va fi disponibilă în curând. Revino mai
                târziu pentru programul complet.
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div className="mt-10">
                  <Reveal>
                    <EventCard event={featured} slug={slug} large />
                  </Reveal>
                </div>
              )}

              {rest.length > 0 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((e, i) => (
                    <Reveal key={e.id} delayIndex={i % 3}>
                      <EventCard event={e} slug={slug} />
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
