import Link from "next/link";
import { BedDouble, Users, ArrowUpRight, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Accommodation } from "@/lib/tenants/types";

const TYPE_LABELS: Record<string, string> = {
  hotel: "Hotel",
  pensiune: "Pensiune",
  cabana: "Cabană",
  apartament: "Apartament",
  camping: "Camping",
  vila: "Vilă",
  other: "Cazare",
};

export function accommodationTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "Cazare";
}

export function AccommodationCard({
  accommodation,
  slug,
  large = false,
}: {
  accommodation: Accommodation;
  slug: string;
  large?: boolean;
}) {
  return (
    <Link
      href={`/${slug}/cazari/${accommodation.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl",
        large ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <ImageWithFallback
        src={accommodation.image}
        alt={accommodation.name}
        fill
        sizes={
          large
            ? "(max-width: 1024px) 100vw, 66vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        fallbackLabel={accommodation.name}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />

      {accommodation.featured ? (
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
          <Star className="h-3 w-3 fill-charcoal" />
          Recomandat
        </span>
      ) : null}

      <div className="relative z-10 mt-auto p-6 text-warm-white">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">
            <BedDouble className="h-3.5 w-3.5" />
            {accommodationTypeLabel(accommodation.type)}
          </Badge>
          {accommodation.capacity > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-cream/90">
              <Users className="h-3.5 w-3.5" />
              {accommodation.capacity} pers.
            </span>
          ) : null}
        </div>
        <h3
          className={cn(
            "mt-2 font-serif font-semibold",
            large ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {accommodation.name}
        </h3>
        <p
          className={cn(
            "mt-2 max-w-lg text-sm leading-relaxed text-cream/85",
            large ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {accommodation.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {accommodation.priceFrom ? (
            <span className="text-sm font-semibold text-gold">
              {accommodation.priceFrom}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-warm-white">
            Vezi detalii
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
