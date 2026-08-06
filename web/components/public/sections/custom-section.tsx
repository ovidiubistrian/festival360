import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Carousel } from "@/components/public/carousel";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { AccommodationCard } from "@/components/public/cards/accommodation-card";
import { RestaurantCard } from "@/components/public/cards/restaurant-card";
import { ProductCard } from "@/components/public/cards/product-card";
import { ExhibitorCard } from "@/components/public/cards/exhibitor-card";
import { ArticleCard } from "@/components/public/cards/article-card";
import { DestinationCard } from "@/components/public/cards/destination-card";
import type {
  Accommodation,
  Article,
  CustomSectionSource,
  Destination,
  Exhibitor,
  GalleryImage,
  Product,
  ProgramEvent,
  Restaurant,
  SectionConfig,
  TenantContent,
} from "@/lib/tenants/types";

/**
 * Generic renderer for admin-created homepage sections. A custom section is a
 * titled block that renders a filtered slice of an existing content collection
 * (e.g. a "Campinguri" block showing only `camping` accommodations).
 *
 * It never crashes on an unknown/empty source: it simply returns null when
 * there are no matching items.
 */

/** Custom section source → the `content` collection key it draws from. */
const SOURCE_TO_KEY: Record<CustomSectionSource, keyof TenantContent> = {
  accommodations: "accommodations",
  restaurants: "restaurants",
  products: "products",
  destinations: "destinations",
  exhibitors: "exhibitors",
  gallery: "gallery",
  news: "articles",
  program: "program",
};

/** Per-source slide widths, mirroring the built-in homepage carousels. */
const SLIDE_CLASS: Record<CustomSectionSource, string> = {
  accommodations: "basis-[80%] sm:basis-[47%] lg:basis-1/3",
  restaurants: "basis-[80%] sm:basis-[47%] lg:basis-1/3",
  exhibitors: "basis-[80%] sm:basis-[47%] lg:basis-1/3",
  destinations: "basis-[80%] sm:basis-[47%] lg:basis-1/3",
  products: "basis-[68%] sm:basis-[42%] lg:basis-1/4",
  news: "basis-[84%] sm:basis-[47%] lg:basis-1/3",
  gallery: "basis-[62%] sm:basis-[38%] lg:basis-1/4",
  program: "basis-[80%] sm:basis-[47%] lg:basis-1/3",
};

type Loose = {
  id: string;
  status?: string;
  featured?: boolean;
  [key: string]: unknown;
};

/** Filter to published, apply the optional field filter, sort featured-first, slice. */
function selectItems<T extends Loose>(items: T[], section: SectionConfig): T[] {
  const { filterField, filterValue, limit } = section;
  let list = items.filter((it) =>
    "status" in it && it.status !== undefined ? it.status === "published" : true
  );
  if (filterField && filterValue) {
    list = list.filter((it) => it[filterField] === filterValue);
  }
  list = [...list].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  );
  return list.slice(0, limit && limit > 0 ? limit : 6);
}

export function CustomSection({
  section,
  content,
  slug,
}: {
  section: SectionConfig;
  content: TenantContent;
  slug: string;
}) {
  const source = section.source;
  if (!source) return null;

  const key = SOURCE_TO_KEY[source];
  const raw = (content[key] ?? []) as unknown as Loose[];
  const items = selectItems(raw, section);
  if (items.length === 0) return null;

  const title = (section.title ?? section.label ?? "").trim();
  if (!title) return null;

  let cards: React.ReactNode = null;
  switch (source) {
    case "accommodations":
      cards = (items as unknown as Accommodation[]).map((a) => (
        <AccommodationCard key={a.id} accommodation={a} slug={slug} />
      ));
      break;
    case "restaurants":
      cards = (items as unknown as Restaurant[]).map((r) => (
        <RestaurantCard key={r.id} restaurant={r} slug={slug} />
      ));
      break;
    case "products":
      cards = (items as unknown as Product[]).map((p) => (
        <ProductCard key={p.id} product={p} slug={slug} />
      ));
      break;
    case "exhibitors":
      cards = (items as unknown as Exhibitor[]).map((e) => (
        <ExhibitorCard key={e.id} exhibitor={e} slug={slug} />
      ));
      break;
    case "destinations":
      cards = (items as unknown as Destination[]).map((d) => (
        <DestinationCard key={d.id} destination={d} slug={slug} />
      ));
      break;
    case "news":
      cards = (items as unknown as Article[]).map((a) => (
        <ArticleCard key={a.id} article={a} slug={slug} />
      ));
      break;
    case "gallery":
      cards = (items as unknown as GalleryImage[]).map((img) => (
        <div
          key={img.id}
          className="relative aspect-[3/4] overflow-hidden rounded-2xl"
        >
          <ImageWithFallback
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 25vw"
            fallbackLabel={img.category}
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
        </div>
      ));
      break;
    case "program":
      cards = (items as unknown as ProgramEvent[]).map((ev) => (
        <div
          key={ev.id}
          className="flex h-full flex-col rounded-2xl border border-border bg-card p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--terracotta)]">
            {ev.category}
          </p>
          <h3 className="mt-2 font-serif text-lg font-semibold text-primary">
            {ev.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
        </div>
      ));
      break;
    default:
      return null;
  }

  const ctaHref = section.ctaHref?.trim();

  return (
    <section className="bg-warm-white py-16 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow={section.eyebrow?.trim() || undefined}
            title={title}
            description={section.description?.trim() || undefined}
          />
          {ctaHref ? (
            <Button asChild variant="outline">
              <Link href={`/${slug}/${ctaHref.replace(/^\/+/, "")}`}>
                {section.ctaLabel?.trim() || "Vezi tot"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        <Reveal className="mt-10">
          <Carousel ariaLabel={title} slideClassName={SLIDE_CLASS[source]}>
            {cards}
          </Carousel>
        </Reveal>
      </Container>
    </section>
  );
}
