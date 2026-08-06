import Link from "next/link";
import { Utensils, ArrowUpRight, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/lib/tenants/types";

export function RestaurantCard({
  restaurant,
  slug,
  large = false,
}: {
  restaurant: Restaurant;
  slug: string;
  large?: boolean;
}) {
  return (
    <Link
      href={`/${slug}/restaurante/${restaurant.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl",
        large ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <ImageWithFallback
        src={restaurant.image}
        alt={restaurant.name}
        fill
        sizes={
          large
            ? "(max-width: 1024px) 100vw, 66vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        fallbackLabel={restaurant.name}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />

      {restaurant.featured ? (
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
          <Star className="h-3 w-3 fill-charcoal" />
          Recomandat
        </span>
      ) : null}

      <div className="relative z-10 mt-auto p-6 text-warm-white">
        <div className="flex flex-wrap items-center gap-2">
          {restaurant.cuisine ? (
            <Badge variant="gold">
              <Utensils className="h-3.5 w-3.5" />
              {restaurant.cuisine}
            </Badge>
          ) : null}
        </div>
        <h3
          className={cn(
            "mt-2 font-serif font-semibold",
            large ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {restaurant.name}
        </h3>
        <p
          className={cn(
            "mt-2 max-w-lg text-sm leading-relaxed text-cream/85",
            large ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {restaurant.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {restaurant.priceRange ? (
            <span className="text-sm font-semibold text-gold">
              {restaurant.priceRange}
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
