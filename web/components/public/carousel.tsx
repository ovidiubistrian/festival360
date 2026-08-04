"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_OPTIONS: EmblaOptionsType = {
  align: "start",
  dragFree: false,
  loop: false,
  containScroll: "trimSnaps",
};

/**
 * Horizontal snap carousel built on embla-carousel.
 *
 * Each child is wrapped in an embla slide — control the per-slide width with
 * `slideClassName` (e.g. responsive `basis-*` classes for a mobile peek). On
 * touch devices the rail is drag-scrollable; on larger screens the prev/next
 * buttons appear and disable at the ends.
 */
export function Carousel({
  children,
  className,
  slideClassName,
  ariaLabel,
  options,
  hideButtonsOnMobile = true,
}: {
  children: React.ReactNode;
  className?: string;
  slideClassName?: string;
  ariaLabel?: string;
  options?: EmblaOptionsType;
  /** Hide the prev/next buttons on very small screens (rely on touch-drag). */
  hideButtonsOnMobile?: boolean;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    ...DEFAULT_OPTIONS,
    ...options,
  });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  // Update button state from embla events — never a synchronous setState in
  // the effect body (the callback is registered via `emblaApi.on`).
  const onSelect = React.useCallback((api: EmblaCarouselType) => {
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    // Initial evaluation is deferred so the setState runs from a callback
    // rather than synchronously in the effect body (no cascading renders).
    queueMicrotask(() => onSelect(emblaApi));
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = React.useCallback(
    () => emblaApi?.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = React.useCallback(
    () => emblaApi?.scrollNext(),
    [emblaApi]
  );

  const slides = React.Children.toArray(children);
  const showButtons = canPrev || canNext;

  return (
    <div
      className={cn("relative", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex touch-pan-y">
          {slides.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              className={cn(
                "min-w-0 shrink-0 grow-0 pl-4",
                slideClassName ?? "basis-[82%] sm:basis-[46%] lg:basis-1/3"
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showButtons && (
        <div
          className={cn(
            "mt-6 flex items-center justify-end gap-2",
            hideButtonsOnMobile && "hidden sm:flex"
          )}
        >
          <CarouselButton
            direction="prev"
            disabled={!canPrev}
            onClick={scrollPrev}
          />
          <CarouselButton
            direction="next"
            disabled={!canNext}
            onClick={scrollNext}
          />
        </div>
      )}
    </div>
  );
}

function CarouselButton({
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
      aria-label={isPrev ? "Slide-ul anterior" : "Slide-ul următor"}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-charcoal shadow-[0_1px_2px_rgba(32,37,34,0.04)] transition-all",
        "hover:border-primary/30 hover:text-primary",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:text-charcoal"
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
