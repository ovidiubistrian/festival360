import Link from "next/link";
import { MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import type { Exhibitor } from "@/lib/tenants/types";

export function ExhibitorCard({
  exhibitor,
  slug,
}: {
  exhibitor: Exhibitor;
  slug: string;
}) {
  return (
    <Link
      href={`/${slug}/expozanti/${exhibitor.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(32,37,34,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(32,37,34,0.10)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <ImageWithFallback
          src={exhibitor.image}
          alt={exhibitor.name}
          fill
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 33vw"
          fallbackLabel={exhibitor.name}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary" className="backdrop-blur">
            {exhibitor.category}
          </Badge>
        </div>
        {exhibitor.certified && (
          <div className="absolute right-3 top-3">
            <Badge variant="gold" className="bg-warm-white/90 backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5" />
              Certificat
            </Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-semibold text-primary">
          {exhibitor.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {exhibitor.town}, {exhibitor.county}
        </p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-charcoal/70">
          {exhibitor.shortDescription}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
          Vezi expozantul
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
