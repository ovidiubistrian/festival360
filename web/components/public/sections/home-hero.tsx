import Link from "next/link";
import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { formatDateRange } from "@/lib/utils";
import type { FestivalInfo, TenantLabels } from "@/lib/tenants/types";

export function HomeHero({
  info,
  slug,
  labels,
  eventType,
}: {
  info: FestivalInfo;
  slug: string;
  labels?: TenantLabels;
  eventType?: string;
}) {
  const L = (k: string, fb: string) => labels?.[k] ?? fb;
  const isResort = eventType === "resort";
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden">
      <ImageWithFallback
        src={info.heroImage}
        alt={`${info.name} — ${info.locationName}`}
        fill
        priority
        sizes="100vw"
        fallbackLabel={info.name}
        className="object-cover"
      />
      {/* Light scrim only where the text sits (left + bottom), so the photo
          stays visible on the right while the white copy stays legible. */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/55 via-charcoal/15 to-transparent" />

      <Container className="relative z-10 pb-16 pt-28">
        <div className="max-w-2xl">
          {!isResort && (
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-warm-white backdrop-blur">
                {info.heroBadge}
              </span>
            </Reveal>
          )}
          <Reveal delayIndex={1}>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] text-warm-white sm:text-6xl lg:text-7xl">
              {info.tagline}
            </h1>
          </Reveal>
          <Reveal delayIndex={2}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/90">
              {info.shortDescription}
            </p>
          </Reveal>
          <Reveal delayIndex={3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" variant="gold">
                <Link href={`/${slug}/despre`}>
                  {L("heroCtaPrimary", "Descoperă festivalul")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-warm-white hover:bg-white/15"
              >
                <Link href={`/${slug}/program`}>
                  <CalendarDays className="h-4 w-4" />
                  {L("heroCtaSecondary", "Vezi programul")}
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delayIndex={4}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-warm-white/90">
              {!isResort && (
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gold" />
                  {formatDateRange(info.startDate, info.endDate)}
                </span>
              )}
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                {info.locationName}, {info.city}
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
