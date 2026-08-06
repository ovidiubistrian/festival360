import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Utensils,
  Clock,
  MapPin,
  Phone,
  Globe,
  Check,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata, tenantPublicUrl } from "@/lib/seo";
import { JsonLd, restaurantJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { AccommodationGallery } from "@/components/public/accommodation-gallery";
import { RestaurantCard } from "@/components/public/cards/restaurant-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const restaurant = (t.content.restaurants ?? []).find(
    (r) => r.slug === slug
  );
  if (!restaurant) return {};
  return tenantMetadata(t, {
    pageTitle: restaurant.name,
    description: restaurant.shortDescription,
    path: `/restaurante/${restaurant.slug}`,
    image: restaurant.image,
  });
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: itemSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  // Restaurante is a resort-only module; other verticals do not expose it.
  if (config.eventType !== "resort") notFound();

  const restaurant = (content.restaurants ?? []).find(
    (r) => r.slug === itemSlug
  );
  if (!restaurant) notFound();

  const related = (content.restaurants ?? [])
    .filter((r) => r.status === "published" && r.id !== restaurant.id)
    .sort(
      (a, b) =>
        (b.cuisine === restaurant.cuisine ? 1 : 0) -
        (a.cuisine === restaurant.cuisine ? 1 : 0)
    )
    .slice(0, 3);

  const facts = [
    restaurant.hours
      ? { icon: Clock, label: restaurant.hours }
      : null,
  ].filter((x): x is { icon: typeof Clock; label: string } => x !== null);

  // Cover first, then the rest of the gallery, deduped and with empties removed.
  const allPhotos = Array.from(
    new Set(
      [restaurant.image, ...restaurant.gallery]
        .map((src) => src?.trim())
        .filter((src): src is string => Boolean(src))
    )
  );

  const base = await tenantPublicUrl(t, "/");
  const itemUrl = `${base}/restaurante/${restaurant.slug}`;
  const jsonLd = [
    restaurantJsonLd(restaurant, itemUrl),
    breadcrumbJsonLd(base, [
      { name: "Acasă", path: "/" },
      { name: "Restaurante", path: "/restaurante" },
      { name: restaurant.name, path: `/restaurante/${restaurant.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        eyebrow={restaurant.cuisine || "Restaurant"}
        title={restaurant.name}
        description={restaurant.shortDescription}
        image={restaurant.image}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Restaurante", href: `/${slug}/restaurante` },
          { label: restaurant.name },
        ]}
      />

      {/* Overview */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {restaurant.cuisine ? (
                  <Badge variant="gold">
                    <Utensils className="h-3.5 w-3.5" />
                    {restaurant.cuisine}
                  </Badge>
                ) : null}
                {facts.map((f) => (
                  <Badge key={f.label} variant="secondary">
                    <f.icon className="h-3.5 w-3.5" />
                    {f.label}
                  </Badge>
                ))}
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Despre restaurant
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {restaurant.name}
              </h2>
              {restaurant.description ? (
                <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-charcoal/75">
                  {restaurant.description}
                </p>
              ) : null}

              {restaurant.amenities.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-serif text-xl font-semibold text-primary">
                    Facilități
                  </h3>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {restaurant.amenities.map((item, j) => (
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
                {restaurant.priceRange ? (
                  <p className="font-serif text-2xl font-semibold text-primary">
                    {restaurant.priceRange}
                  </p>
                ) : (
                  <p className="font-serif text-lg font-semibold text-primary">
                    Contactează pentru rezervări
                  </p>
                )}

                <div className="mt-5 space-y-3 text-sm">
                  {restaurant.hours ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {restaurant.hours}
                    </p>
                  ) : null}
                  {restaurant.address ? (
                    <p className="flex items-start gap-2.5 text-charcoal/75">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {restaurant.address}
                    </p>
                  ) : null}
                  {restaurant.contactPhone ? (
                    <a
                      href={`tel:${restaurant.contactPhone}`}
                      className="flex items-center gap-2.5 text-charcoal/75 hover:text-primary"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-primary" />
                      {restaurant.contactPhone}
                    </a>
                  ) : null}
                  {restaurant.contactWebsite ? (
                    <a
                      href={restaurant.contactWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 break-all text-charcoal/75 hover:text-primary"
                    >
                      <Globe className="h-4 w-4 shrink-0 text-primary" />
                      Website
                    </a>
                  ) : null}
                </div>

                <div className="mt-6 space-y-3">
                  {restaurant.bookingUrl ? (
                    <Button
                      asChild
                      variant="terracotta"
                      size="lg"
                      className="w-full"
                    >
                      <a
                        href={restaurant.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Rezervă o masă
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                  {restaurant.menuUrl ? (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <a
                        href={restaurant.menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <BookOpen className="h-4 w-4" />
                        Vezi meniul
                      </a>
                    </Button>
                  ) : null}
                </div>
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
                name={restaurant.name}
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
              title="Alte restaurante"
              description="Mai multe localuri din zonă."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.id} delayIndex={i % 3}>
                  <RestaurantCard restaurant={r} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
