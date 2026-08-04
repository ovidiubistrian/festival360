import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MapPin,
  Compass,
  Sparkles,
  Utensils,
  Check,
  ExternalLink,
} from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { DestinationCard } from "@/components/public/cards/destination-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const destination = t.content.destinations.find((d) => d.slug === slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.shortDescription,
    openGraph: {
      title: `${destination.name} · ${t.config.info.name}`,
      description: destination.shortDescription,
      images: [destination.coverImage],
    },
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: destinationSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { content, slug } = t;
  const destination = content.destinations.find(
    (d) => d.slug === destinationSlug
  );
  if (!destination) notFound();

  const related = content.destinations
    .filter((d) => d.status === "published" && d.id !== destination.id)
    .sort((a, b) => (b.region === destination.region ? 1 : 0) - (a.region === destination.region ? 1 : 0))
    .slice(0, 3);

  const columns = [
    {
      title: "Atracții",
      icon: Compass,
      items: destination.attractions,
    },
    {
      title: "Experiențe",
      icon: Sparkles,
      items: destination.experiences,
    },
    {
      title: "Gastronomie",
      icon: Utensils,
      items: destination.gastronomy,
    },
  ].filter((c) => c.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow={destination.region}
        title={destination.name}
        description={destination.shortDescription}
        image={destination.coverImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Destinații", href: `/${slug}/destinatii` },
          { label: destination.name },
        ]}
      />

      {/* Description */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <MapPin className="h-3.5 w-3.5" />
                {destination.county}
              </Badge>
              <Badge variant="outline">{destination.region}</Badge>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta mt-6">
              Despre destinație
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
              {destination.name}
            </h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-charcoal/75">
              {destination.description}
            </p>

            {destination.externalLink && (
              <div className="mt-8">
                <Button asChild variant="terracotta" size="lg">
                  <a
                    href={destination.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Planifică vizita
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Attractions / Experiences / Gastronomy */}
      {columns.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="Ce te așteaptă"
              title="De văzut, de trăit, de gustat"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {columns.map((col, i) => (
                <Reveal
                  key={col.title}
                  delayIndex={i % 3}
                  className="rounded-2xl border border-border bg-card p-6 sm:p-7"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <col.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-primary">
                      {col.title}
                    </h3>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {col.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                        <span className="text-charcoal/75">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Gallery */}
      {destination.gallery.length > 0 && (
        <section className="bg-warm-white py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Galerie"
              title="Peisaje și momente"
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destination.gallery.map((src, i) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? "relative aspect-[4/3] overflow-hidden rounded-2xl border border-border sm:col-span-2 sm:aspect-[16/9]"
                      : "relative aspect-[4/3] overflow-hidden rounded-2xl border border-border"
                  }
                >
                  <ImageWithFallback
                    src={src}
                    alt={`${destination.name} — imagine ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallbackLabel={destination.name}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Related destinations */}
      {related.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Continuă explorarea"
              title="Alte destinații"
              description="Mai multe locuri de descoperit din regiunile festivalului."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((d, i) => (
                <Reveal key={d.id} delayIndex={i % 3}>
                  <DestinationCard destination={d} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
