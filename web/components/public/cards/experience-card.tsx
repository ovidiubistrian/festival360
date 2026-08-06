"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import type { Experience } from "@/lib/tenants/types";

/** Descriptions longer than this get a „Vezi mai mult” toggle. */
const CLAMP_THRESHOLD = 140;

/**
 * One "Experiență" card: a portrait photo carousel over `[image, ...gallery]`
 * (deduped, empties filtered), the icon badge + gradient overlay, the title and
 * a description that clamps to three lines with an inline expand toggle.
 *
 * All embla `setState` runs from event callbacks (or a deferred microtask),
 * never synchronously in an effect body, to satisfy the strict hooks lint.
 */
export function ExperienceCard({ experience }: { experience: Experience }) {
  const photos = React.useMemo(() => {
    const all = [experience.image, ...(experience.gallery ?? [])]
      .map((p) => p?.trim())
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set(all));
  }, [experience.image, experience.gallery]);

  const [expanded, setExpanded] = React.useState(false);
  const showToggle = experience.description.length > CLAMP_THRESHOLD;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <CardCarousel photos={photos} experience={experience} />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-xl font-semibold text-primary">
          {experience.title}
        </h3>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed text-charcoal/70",
            !expanded && showToggle && "line-clamp-3"
          )}
        >
          {experience.description}
        </p>
        {showToggle ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 self-start text-sm font-medium text-terracotta transition-colors hover:text-primary"
          >
            {expanded ? "Vezi mai puțin" : "Vezi mai mult"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CardCarousel({
  photos,
  experience,
}: {
  photos: string[];
  experience: Experience;
}) {
  // No photo at all → keep the framed area so the icon badge still shows.
  if (photos.length <= 1) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden">
        <ImageWithFallback
          src={photos[0] ?? ""}
          alt={experience.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          fallbackLabel={experience.title}
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <ImageOverlays icon={experience.icon} />
      </div>
    );
  }

  return <EmblaCardCarousel photos={photos} experience={experience} />;
}

function EmblaCardCarousel({
  photos,
  experience,
}: {
  photos: string[];
  experience: Experience;
}) {
  const [viewportRef, embla] = useEmblaCarousel({
    loop: photos.length > 2,
    align: "center",
  });
  const [selected, setSelected] = React.useState(0);

  const onSelect = React.useCallback((api: EmblaCarouselType) => {
    setSelected(api.selectedScrollSnap());
  }, []);

  React.useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect).on("reInit", onSelect);
    // Deferred initial read — setState comes from a callback, not the effect
    // body, so no cascading synchronous renders.
    queueMicrotask(() => onSelect(embla));
    return () => {
      embla.off("select", onSelect).off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  const scrollPrev = React.useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = React.useCallback(() => embla?.scrollNext(), [embla]);
  const scrollTo = React.useCallback(
    (index: number) => embla?.scrollTo(index),
    [embla]
  );

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Galerie foto — ${experience.title}`}
    >
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex touch-pan-y">
          {photos.map((src, i) => (
            <div
              key={`${src}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} din ${photos.length}`}
              className="relative aspect-[3/4] min-w-0 shrink-0 grow-0 basis-full overflow-hidden"
            >
              <ImageWithFallback
                src={src}
                alt={`${experience.title} — imagine ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                fallbackLabel={experience.title}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <ImageOverlays icon={experience.icon} />

      <CarouselButton direction="prev" onClick={scrollPrev} />
      <CarouselButton direction="next" onClick={scrollNext} />

      <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
        {photos.map((src, i) => (
          <button
            key={`dot-${src}-${i}`}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Vezi imaginea ${i + 1}`}
            aria-current={i === selected}
            className={cn(
              "h-2 rounded-full bg-warm-white/70 transition-all",
              i === selected ? "w-5 bg-warm-white" : "w-2 hover:bg-warm-white"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** The icon badge (top-left) and the bottom gradient, shared by both modes. */
function ImageOverlays({ icon }: { icon: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
      <span className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-warm-white/95 text-primary backdrop-blur">
        <Icon name={icon} className="h-5 w-5" />
      </span>
    </>
  );
}

function CarouselButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Imaginea anterioară" : "Imaginea următoare"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-charcoal opacity-0 shadow-[0_1px_2px_rgba(32,37,34,0.08)] backdrop-blur transition-all",
        "hover:border-primary/30 hover:text-primary",
        "focus-visible:opacity-100 group-hover:opacity-100",
        isPrev ? "left-3" : "right-3"
      )}
    >
      {isPrev ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  );
}
