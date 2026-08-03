import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/tenants/types";

export function ProductCard({
  product,
  slug,
}: {
  product: Product;
  slug: string;
}) {
  return (
    <Link
      href={`/${slug}/produse/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(32,37,34,0.10)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          fallbackLabel={product.name}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/60 to-transparent" />
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 backdrop-blur"
        >
          {product.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-primary">
          {product.name}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {product.producer} · {product.region}
        </p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-charcoal/70">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between">
          {product.price ? (
            <span className="text-sm font-semibold text-terracotta">
              {product.price}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Descoperă povestea
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
