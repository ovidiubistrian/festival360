import Link from "next/link";
import { CalendarDays, Clock, MapPin, Ticket, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Button } from "@/components/ui/button";
import { eventDateLabel } from "@/components/public/cards/event-card";
import type { Event } from "@/lib/tenants/types";

/**
 * Large, single-event feature block used on the homepage when a resort has
 * exactly one published event. A wide two-column layout (image left, details
 * right) that stands in for the small portrait card. Reuses `ImageWithFallback`,
 * `Button` and the shared `eventDateLabel` date helper.
 */
export function EventFeature({ event, slug }: { event: Event; slug: string }) {
  const dateLabel = eventDateLabel(event);
  const href = `/${slug}/evenimente/${event.slug}`;
  const hasTickets = !!event.ticketUrl?.trim();
  const ticketLabel = event.ticketLabel?.trim() || "Cumpără bilete";

  return (
    <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-2">
      <Link
        href={href}
        aria-label={event.title}
        className="group relative block aspect-[16/10] lg:aspect-auto"
      >
        <ImageWithFallback
          src={event.coverImage}
          alt={event.title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          fallbackLabel={event.title}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {event.ticketUrl?.trim() ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-terracotta/90 px-2.5 py-1 text-xs font-semibold text-warm-white">
            <Ticket className="h-3 w-3" />
            Bilete
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-charcoal/70">
          {dateLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              {dateLabel}
            </span>
          ) : null}
          {event.timeLabel?.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {event.timeLabel}
            </span>
          ) : null}
          {event.location?.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {event.location}
            </span>
          ) : null}
        </div>

        <h3 className="font-serif text-3xl font-semibold text-primary sm:text-4xl">
          <Link href={href} className="transition-colors hover:text-primary/80">
            {event.title}
          </Link>
        </h3>

        {event.shortDescription?.trim() ? (
          <p className="max-w-prose text-base leading-relaxed text-charcoal/75">
            {event.shortDescription}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {hasTickets ? (
            <Button asChild variant="terracotta">
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                <Ticket className="h-4 w-4" />
                {ticketLabel}
              </a>
            </Button>
          ) : null}
          <Button asChild variant={hasTickets ? "outline" : "default"}>
            <Link href={href}>
              Vezi detalii
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
