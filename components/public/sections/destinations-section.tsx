import Link from "next/link";
import { ArrowRight, MapPin, Compass, Utensils, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { DestinationCard } from "@/components/public/cards/destination-card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import type { Destination } from "@/lib/tenants/types";

export function DestinationsSection({
  destinations,
  slug,
}: {
  destinations: Destination[];
  slug: string;
}) {
  const editorial = destinations.find((d) => d.editorial);
  const others = destinations
    .filter((d) => d.featured && !d.editorial)
    .slice(0, 4);

  return (
    <section id="destinatii" className="bg-warm-white py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Destinații turistice"
            title="România care merită descoperită"
            description="Festivalul este și o poartă către unele dintre cele mai frumoase locuri ale țării."
          />
          <Button asChild variant="outline">
            <Link href={`/${slug}/destinatii`}>
              Toate destinațiile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Editorial feature: Banatul Montan */}
        {editorial && (
          <Reveal className="mt-12">
            <Link
              href={`/${slug}/destinatii/${editorial.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-border bg-primary text-cream lg:grid-cols-2"
            >
              <div className="relative min-h-[320px] overflow-hidden">
                <ImageWithFallback
                  src={editorial.coverImage}
                  alt={editorial.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  fallbackLabel={editorial.name}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent lg:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Destinația ediției
                </span>
                <h3 className="mt-5 font-serif text-4xl font-semibold text-warm-white">
                  {editorial.name}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-gold">
                  <MapPin className="h-4 w-4" />
                  {editorial.county}
                </p>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-cream/85">
                  {editorial.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-cream/80">
                  <span className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-gold" />
                    {editorial.attractions.length} atracții
                  </span>
                  <span className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-gold" />
                    Gastronomie locală
                  </span>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 font-medium text-warm-white">
                  Citește povestea completă
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((d) => (
            <DestinationCard key={d.id} destination={d} slug={slug} />
          ))}
        </div>
      </Container>
    </section>
  );
}
