import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  ExternalLink,
} from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata, tenantPublicUrl } from "@/lib/seo";
import { JsonLd, eventJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { AccommodationGallery } from "@/components/public/accommodation-gallery";
import { EventCard, eventDateLabel } from "@/components/public/cards/event-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const event = (t.content.events ?? []).find((e) => e.slug === slug);
  if (!event) return {};
  return tenantMetadata(t, {
    pageTitle: event.title,
    description: event.shortDescription,
    path: `/evenimente/${event.slug}`,
    image: event.coverImage,
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: itemSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // Evenimente is a resort-only module; other verticals do not expose it.
  if (config.eventType !== "resort") notFound();

  const event = (content.events ?? []).find((e) => e.slug === itemSlug);
  if (!event) notFound();

  const related = (content.events ?? [])
    .filter((e) => e.status === "published" && e.id !== event.id)
    .slice(0, 3);

  const dateLabel = eventDateLabel(event);
  const program = (event.program ?? []).filter(
    (p) => p.time?.trim() || p.title?.trim() || p.description?.trim()
  );
  const ticketLabel = event.ticketLabel?.trim() || "Cumpără bilete";
  const hasTickets = !!event.ticketUrl?.trim();

  // Cover first, then the rest of the gallery, deduped and with empties removed.
  const allPhotos = Array.from(
    new Set(
      [event.coverImage, ...event.gallery]
        .map((src) => src?.trim())
        .filter((src): src is string => Boolean(src))
    )
  );

  const base = await tenantPublicUrl(t, "/");
  const itemUrl = `${base}/evenimente/${event.slug}`;
  const jsonLd = [
    eventJsonLd(event, itemUrl),
    breadcrumbJsonLd(base, [
      { name: "Acasă", path: "/" },
      { name: "Evenimente", path: "/evenimente" },
      { name: event.title, path: `/evenimente/${event.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        eyebrow="Eveniment"
        title={event.title}
        description={event.shortDescription}
        image={event.coverImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Evenimente", href: `/${slug}/evenimente` },
          { label: event.title },
        ]}
      />

      {/* Overview */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {dateLabel ? (
                  <Badge variant="gold">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dateLabel}
                  </Badge>
                ) : null}
                {event.timeLabel?.trim() ? (
                  <Badge variant="secondary">
                    <Clock className="h-3.5 w-3.5" />
                    {event.timeLabel}
                  </Badge>
                ) : null}
                {event.location?.trim() ? (
                  <Badge variant="secondary">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </Badge>
                ) : null}
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Despre eveniment
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {event.title}
              </h2>
              {event.description ? (
                <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-charcoal/75">
                  {event.description}
                </p>
              ) : null}

              {program.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-serif text-xl font-semibold text-primary">
                    Program
                  </h3>
                  <ol className="mt-5 space-y-0">
                    {program.map((p, j) => (
                      <li
                        key={j}
                        className="relative flex gap-5 pb-6 last:pb-0"
                      >
                        {/* Timeline rail */}
                        <div className="relative flex flex-col items-center">
                          <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-terracotta bg-warm-white" />
                          {j < program.length - 1 ? (
                            <span
                              aria-hidden
                              className="mt-1 w-px flex-1 bg-border"
                            />
                          ) : null}
                        </div>
                        <div className="pb-1">
                          {p.time?.trim() ? (
                            <p className="text-sm font-semibold text-terracotta">
                              {p.time}
                            </p>
                          ) : null}
                          {p.title?.trim() ? (
                            <p className="mt-0.5 font-serif text-lg font-semibold text-primary">
                              {p.title}
                            </p>
                          ) : null}
                          {p.description?.trim() ? (
                            <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
                              {p.description}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Tickets / info card */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                <div className="space-y-3 text-sm">
                  {dateLabel ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {dateLabel}
                    </p>
                  ) : null}
                  {event.timeLabel?.trim() ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {event.timeLabel}
                    </p>
                  ) : null}
                  {event.location?.trim() ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {event.location}
                    </p>
                  ) : null}
                </div>

                {hasTickets ? (
                  <div className="mt-6">
                    <Button
                      asChild
                      variant="terracotta"
                      size="lg"
                      className="w-full"
                    >
                      <a
                        href={event.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Ticket className="h-4 w-4" />
                        {ticketLabel}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Intrare liberă sau detalii despre bilete în curând.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* Gallery */}
      {allPhotos.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading eyebrow="Galerie" title="Imagini" />
            <div className="mt-8">
              <AccommodationGallery images={allPhotos} name={event.title} />
            </div>
          </Container>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-warm-white py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Vezi și"
              title="Alte evenimente"
              description="Mai multe momente din stațiune."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e, i) => (
                <Reveal key={e.id} delayIndex={i % 3}>
                  <EventCard event={e} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
