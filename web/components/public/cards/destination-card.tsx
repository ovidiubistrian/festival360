import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
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
  return (
    <Link
      href={`/${slug}/destinatii/${destination.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl",
        large ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <ImageWithFallback
        src={destination.coverImage}
        alt={destination.name}
        fill
        sizes={large ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
        fallbackLabel={destination.name}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
      <div className="relative z-10 mt-auto p-6 text-warm-white">
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
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-warm-white">
          Descoperă destinația
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
