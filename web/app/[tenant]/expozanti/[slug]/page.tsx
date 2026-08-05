import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  BadgeCheck,
  Phone,
  ExternalLink,
  Compass,
} from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHero } from "@/components/public/page-hero";
import { ProductCard } from "@/components/public/cards/product-card";
import { ExhibitorCard } from "@/components/public/cards/exhibitor-card";
import { BookingInquiry } from "@/components/public/booking-inquiry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const exhibitor = t.content.exhibitors.find((e) => e.slug === slug);
  if (!exhibitor) return {};
  return {
    title: exhibitor.name,
    description: exhibitor.shortDescription,
    openGraph: {
      title: `${exhibitor.name} · ${t.config.info.name}`,
      description: exhibitor.shortDescription,
      images: [exhibitor.image],
    },
  };
}

export default async function ExhibitorDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: exhibitorSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const isResort = config.eventType === "resort";
  const exhibitor = content.exhibitors.find((e) => e.slug === exhibitorSlug);
  if (!exhibitor) notFound();

  const products = content.products.filter(
    (p) => p.exhibitorId === exhibitor.id && p.status === "published"
  );

  const related = content.exhibitors
    .filter((e) => e.status === "published" && e.id !== exhibitor.id)
    .sort((a, b) => {
      const score = (e: typeof exhibitor) =>
        (e.region === exhibitor.region ? 2 : 0) +
        (e.category === exhibitor.category ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={exhibitor.category}
        title={exhibitor.name}
        description={exhibitor.shortDescription}
        image={exhibitor.image}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Expozanți", href: `/${slug}/expozanti` },
          { label: exhibitor.name },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            {/* Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Despre expozant
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {exhibitor.name}
              </h2>
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-charcoal/75">
                {exhibitor.description}
              </p>
            </div>

            {/* Details card */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold text-primary">
                  Detalii
                </h3>
                <Separator className="my-4" />
                <dl className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                    <div>
                      <dt className="text-muted-foreground">Localitate</dt>
                      <dd className="font-medium text-charcoal">
                        {exhibitor.town}, {exhibitor.county}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                    <div>
                      <dt className="text-muted-foreground">Regiune</dt>
                      <dd className="font-medium text-charcoal">
                        {exhibitor.region}
                      </dd>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary">{exhibitor.category}</Badge>
                    {exhibitor.certified && (
                      <Badge variant="gold">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Certificat
                      </Badge>
                    )}
                  </div>
                </dl>

                {(exhibitor.contact?.phone || exhibitor.contact?.website) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      {exhibitor.contact?.phone && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <a
                            href={`tel:${exhibitor.contact.phone.replace(
                              /\s+/g,
                              ""
                            )}`}
                          >
                            <Phone className="h-4 w-4" />
                            {exhibitor.contact.phone}
                          </a>
                        </Button>
                      )}
                      {exhibitor.contact?.website && (
                        <Button
                          asChild
                          variant="terracotta"
                          className="w-full justify-start"
                        >
                          <a
                            href={exhibitor.contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Vizitează site-ul
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isResort && (
                <div className="mt-6">
                  <BookingInquiry
                    accommodationName={exhibitor.name}
                    slug={slug}
                  />
                </div>
              )}
            </aside>
          </div>

          {/* Gallery */}
          {exhibitor.gallery.length > 0 && (
            <div className="mt-16">
              <SectionHeading eyebrow="Galerie" title="Din atelier și de la stand" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exhibitor.gallery.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border"
                  >
                    <ImageWithFallback
                      src={src}
                      alt={`${exhibitor.name} — imagine ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackLabel={exhibitor.name}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Produsele expozantului"
              title="Ce vei găsi la stand"
              description={`Produsele oferite de ${exhibitor.name} la festival.`}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Related exhibitors */}
      {related.length > 0 && (
        <section className="bg-warm-white py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Descoperă mai mulți"
              title="Alți expozanți"
              description="Producători și meșteșugari cu profil apropiat, pe care merită să-i cunoști."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e, i) => (
                <Reveal key={e.id} delayIndex={i % 3}>
                  <ExhibitorCard exhibitor={e} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
