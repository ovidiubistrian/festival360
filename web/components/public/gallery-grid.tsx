"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { cn } from "@/lib/utils";
import type { GalleryImage, GalleryCategory } from "@/lib/tenants/types";

export function GalleryGrid({
  images,
  filterable = true,
}: {
  images: GalleryImage[];
  filterable?: boolean;
}) {
  const categories = React.useMemo(
    () => Array.from(new Set(images.map((i) => i.category))),
    [images]
  );
  const [filter, setFilter] = React.useState<GalleryCategory | "all">("all");
  const [active, setActive] = React.useState<number | null>(null);

  const visible = React.useMemo(
    () => images.filter((i) => filter === "all" || i.category === filter),
    [images, filter]
  );

  const close = React.useCallback(() => setActive(null), []);
  const next = React.useCallback(
    () => setActive((a) => (a === null ? a : (a + 1) % visible.length)),
    [visible.length]
  );
  const prev = React.useCallback(
    () =>
      setActive((a) =>
        a === null ? a : (a - 1 + visible.length) % visible.length
      ),
    [visible.length]
  );

  React.useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, next, prev]);

  return (
    <div>
      {filterable && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            Toate
          </FilterButton>
          {categories.map((c) => (
            <FilterButton
              key={c}
              active={filter === c}
              onClick={() => setFilter(c)}
            >
              {c}
            </FilterButton>
          ))}
        </div>
      )}

      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {visible.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={cn(
              "group relative block w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              img.span === "tall" && "aspect-[3/4]",
              img.span === "wide" && "aspect-[4/3]",
              img.span === "normal" && "aspect-square"
            )}
          >
            <ImageWithFallback
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              fallbackLabel={img.category}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-charcoal/0 transition-colors group-hover:bg-charcoal/15" />
          </button>
        ))}
      </div>

      {active !== null && visible[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-warm-white transition-colors hover:bg-white/20"
            onClick={close}
            aria-label="Închide"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 rounded-full bg-white/10 p-2 text-warm-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Imaginea anterioară"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-warm-white transition-colors hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Imaginea următoare"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
          <figure
            className="relative max-h-[85vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/2] w-full">
              <ImageWithFallback
                src={visible[active].src}
                alt={visible[active].alt}
                fill
                sizes="100vw"
                fallbackLabel={visible[active].alt}
                className="rounded-xl object-contain"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-cream/80">
              {visible[active].alt} · {active + 1} / {visible.length}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-charcoal/70 hover:border-primary/30"
      )}
    >
      {children}
    </button>
  );
}
