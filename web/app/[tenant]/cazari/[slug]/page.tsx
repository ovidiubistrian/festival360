import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BedDouble,
  Users,
  DoorOpen,
  MapPin,
  Phone,
  Globe,
  Check,
  ExternalLink,
} from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata, tenantPublicUrl } from "@/lib/seo";
import {
  JsonLd,
  accommodationJsonLd,
  breadcrumbJsonLd,
} from "@/lib/jsonld";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { AccommodationGallery } from "@/components/public/accommodation-gallery";
import {
  AccommodationCard,
  accommodationTypeLabel,
} from "@/components/public/cards/accommodation-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const accommodation = (t.content.accommodations ?? []).find(
    (a) => a.slug === slug
  );
  if (!accommodation) return {};
  return tenantMetadata(t, {
    pageTitle: accommodation.name,
    description: accommodation.shortDescription,
    path: `/cazari/${accommodation.slug}`,
    image: accommodation.image,
  });
}

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: itemSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { content, slug } = t;
  const accommodation = (content.accommodations ?? []).find(
    (a) => a.slug === itemSlug
  );
  if (!accommodation) notFound();

  const related = (content.accommodations ?? [])
    .filter((a) => a.status === "published" && a.id !== accommodation.id)
    .sort(
      (a, b) =>
        (b.type === accommodation.type ? 1 : 0) -
        (a.type === accommodation.type ? 1 : 0)
    )
    .slice(0, 3);

  const facts = [
    accommodation.capacity > 0
      ? { icon: Users, label: `${accommodation.capacity} persoane` }
      : null,
    accommodation.rooms > 0
      ? { icon: DoorOpen, label: `${accommodation.rooms} camere` }
      : null,
  ].filter((x): x is { icon: typeof Users; label: string } => x !== null);

  const bookHref = accommodation.bookingUrl || accommodation.contactWebsite;

  const base = await tenantPublicUrl(t, "/");
  const itemUrl = `${base}/cazari/${accommodation.slug}`;
  const jsonLd = [
    accommodationJsonLd(accommodation, itemUrl),
    breadcrumbJsonLd(base, [
      { name: "Acasă", path: "/" },
      { name: "Cazări", path: "/cazari" },
      { name: accommodation.name, path: `/cazari/${accommodation.slug}` },
    ]),
  ];

  // Cover first, then the rest of the gallery, deduped and with empties removed.
  const allPhotos = Array.from(
    new Set(
      [accommodation.image, ...accommodation.gallery]
        .map((src) => src?.trim())
        .filter((src): src is string => Boolean(src))
    )
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        eyebrow={accommodationTypeLabel(accommodation.type)}
        title={accommodation.name}
        description={accommodation.shortDescription}
        image={accommodation.image}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Cazări", href: `/${slug}/cazari` },
          { label: accommodation.name },
        ]}
      />

      {/* Overview */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">
                  <BedDouble className="h-3.5 w-3.5" />
                  {accommodationTypeLabel(accommodation.type)}
                </Badge>
                {facts.map((f) => (
                  <Badge key={f.label} variant="secondary">
                    <f.icon className="h-3.5 w-3.5" />
                    {f.label}
                  </Badge>
                ))}
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Despre cazare
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {accommodation.name}
              </h2>
              {accommodation.description ? (
                <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-charcoal/75">
                  {accommodation.description}
                </p>
              ) : null}

              {accommodation.amenities.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-serif text-xl font-semibold text-primary">
                    Facilități
                  </h3>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {accommodation.amenities.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                        <span className="capitalize text-charcoal/75">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Booking / contact card */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                {accommodation.priceFrom ? (
                  <p className="font-serif text-2xl font-semibold text-primary">
                    {accommodation.priceFrom}
                  </p>
                ) : (
                  <p className="font-serif text-lg font-semibold text-primary">
                    Contactează pentru preț
                  </p>
                )}

                <div className="mt-5 space-y-3 text-sm">
                  {accommodation.address ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {accommodation.address}
                    </p>
                  ) : null}
                  {accommodation.contactPhone ? (
                    <a
                      href={`tel:${accommodation.contactPhone}`}
                      className="flex items-center gap-2.5 text-charcoal/75 hover:text-primary"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-primary" />
                      {accommodation.contactPhone}
                    </a>
                  ) : null}
                  {accommodation.contactWebsite ? (
                    <a
                      href={accommodation.contactWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 break-all text-charcoal/75 hover:text-primary"
                    >
                      <Globe className="h-4 w-4 shrink-0 text-primary" />
                      Website
                    </a>
                  ) : null}
                </div>

                {bookHref ? (
                  <Button
                    asChild
                    variant="terracotta"
                    size="lg"
                    className="mt-6 w-full"
                  >
                    <a href={bookHref} target="_blank" rel="noopener noreferrer">
                      Rezervă acum
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
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
              <AccommodationGallery
                images={allPhotos}
                name={accommodation.name}
              />
            </div>
          </Container>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-warm-white py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Alte opțiuni"
              title="Alte cazări"
              description="Mai multe locuri de cazare din zonă."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a, i) => (
                <Reveal key={a.id} delayIndex={i % 3}>
                  <AccommodationCard accommodation={a} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
