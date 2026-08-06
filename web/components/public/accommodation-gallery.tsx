"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { cn } from "@/lib/utils";

export interface AccommodationGalleryProps {
  /** Ordered photo URLs — pass `[image, ...gallery]` deduped and non-empty. */
  images: string[];
  /** Used for alt text and the branded fallback. */
  name: string;
}

/**
 * Public photo viewer for an accommodation: a large swipeable main image with
 * prev/next controls and a thumbnail strip that jumps to a photo. A single
 * photo renders as a plain framed image (no carousel chrome).
 *
 * Built on two synced embla instances. All `setState` runs from embla event
 * callbacks (or a deferred microtask), never synchronously in an effect body,
 * to satisfy the repo's strict hooks lint.
 */
export function AccommodationGallery({
  images,
  name,
}: AccommodationGalleryProps) {
  const [mainRef, mainApi] = useEmblaCarousel({
    loop: images.length > 2,
    align: "center",
  });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    align: "start",
  });

  const [selected, setSelected] = React.useState(0);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const onSelect = React.useCallback((api: EmblaCarouselType) => {
    const index = api.selectedScrollSnap();
    setSelected(index);
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
    thumbApi?.scrollTo(index);
  }, [thumbApi]);

  React.useEffect(() => {
    if (!mainApi) return;
    mainApi.on("select", onSelect).on("reInit", onSelect);
    // Deferred initial evaluation — setState comes from a callback, not the
    // effect body, so no cascading synchronous renders.
    queueMicrotask(() => onSelect(mainApi));
    return () => {
      mainApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [mainApi, onSelect]);

  const scrollPrev = React.useCallback(() => mainApi?.scrollPrev(), [mainApi]);
  const scrollNext = React.useCallback(() => mainApi?.scrollNext(), [mainApi]);
  const scrollTo = React.useCallback(
    (index: number) => mainApi?.scrollTo(index),
    [mainApi]
  );

  // Single photo → no carousel chrome.
  if (images.length === 1) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border">
        <ImageWithFallback
          src={images[0]}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          fallbackLabel={name}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Galerie foto — ${name}`}
    >
      <div className="relative">
        <div className="overflow-hidden rounded-2xl border border-border" ref={mainRef}>
          <div className="flex touch-pan-y">
            {images.map((src, i) => (
              <div
                key={`${src}-${i}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} din ${images.length}`}
                className="relative aspect-[16/9] min-w-0 shrink-0 grow-0 basis-full"
              >
                <ImageWithFallback
                  src={src}
                  alt={`${name} — imagine ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  fallbackLabel={name}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <GalleryButton
          direction="prev"
          disabled={!canPrev}
          onClick={scrollPrev}
        />
        <GalleryButton
          direction="next"
          disabled={!canNext}
          onClick={scrollNext}
        />

        <span className="absolute bottom-3 right-3 rounded-full bg-charcoal/60 px-2.5 py-1 text-xs font-medium text-warm-white">
          {selected + 1} / {images.length}
        </span>
      </div>

      {/* Thumbnail strip */}
      <div className="overflow-hidden" ref={thumbRef}>
        <div className="flex gap-3">
          {images.map((src, i) => {
            const active = i === selected;
            return (
              <button
                key={`thumb-${src}-${i}`}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Vezi imaginea ${i + 1}`}
                aria-current={active}
                className={cn(
                  "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-secondary transition-opacity sm:w-28",
                  active
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <ImageWithFallback
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                  fallbackLabel={name}
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GalleryButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "Imaginea anterioară" : "Imaginea următoare"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-charcoal shadow-[0_1px_2px_rgba(32,37,34,0.08)] backdrop-blur transition-all",
        "hover:border-primary/30 hover:text-primary",
        "disabled:cursor-not-allowed disabled:opacity-0",
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
