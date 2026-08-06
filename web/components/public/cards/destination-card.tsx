import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Destination } from "@/lib/tenants/types";

export function DestinationCard({
  destination,
  slug,
  large = false,
}: {
  destination: Destination;
  slug: string;
  large?: boolean;
}) {
  const detailHref = `/${slug}/destinatii/${destination.slug}`;
  const external = destination.externalLink?.trim();
  const ctaHref = external || detailHref;
  const ctaLabel =
    destination.ctaLabel?.trim() ||
    (external ? "Află mai multe" : "Descoperă destinația");

  return (
    <div
      className={cn(
        "group relative flex overflow-hidden rounded-3xl",
        large ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <ImageWithFallback
        src={destination.coverImage}
        alt={destination.name}
        fill
        sizes={
          large
            ? "(max-width: 1024px) 100vw, 66vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        fallbackLabel={destination.name}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />

      {/* Whole-card link to the detail page (stretched under the overlay). */}
      <Link
        href={detailHref}
        className="absolute inset-0 z-10"
        aria-label={destination.name}
      >
        <span className="sr-only">{destination.name}</span>
      </Link>

      {/* Text overlay lets clicks fall through to the card link; only the CTA
          button captures its own clicks. */}
      <div className="pointer-events-none relative z-20 mt-auto p-6 text-warm-white">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gold">
          <MapPin className="h-3.5 w-3.5" />
          {destination.county}
        </p>
        <h3
          className={cn(
            "mt-2 font-serif font-semibold",
            large ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {destination.name}
        </h3>
        <p
          className={cn(
            "mt-2 max-w-lg text-sm leading-relaxed text-cream/85",
            large ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {destination.shortDescription}
        </p>
        <Button
          asChild
          size="sm"
          variant="gold"
          className="pointer-events-auto relative z-30 mt-4"
        >
          <a
            href={ctaHref}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {ctaLabel}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
