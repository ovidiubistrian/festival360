import Link from "next/link";
import { CalendarDays, Clock, MapPin, Ticket, ArrowUpRight, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { cn, formatDate, formatDateRange } from "@/lib/utils";
import type { Event } from "@/lib/tenants/types";

/** Human date for an event: range when both dates set, else the single date. */
export function eventDateLabel(event: Event): string {
  const start = event.startDate?.trim();
  const end = event.endDate?.trim();
  if (start && end && start !== end) return formatDateRange(start, end);
  if (start) return formatDate(start);
  if (end) return formatDate(end);
  return "";
}

export function EventCard({
  event,
  slug,
  large = false,
}: {
  event: Event;
  slug: string;
  large?: boolean;
}) {
  const dateLabel = eventDateLabel(event);
  return (
    <Link
      href={`/${slug}/evenimente/${event.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl",
        large ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <ImageWithFallback
        src={event.coverImage}
        alt={event.title}
        fill
        sizes={
          large
            ? "(max-width: 1024px) 100vw, 66vw"
            : "(max-width: 768px) 100vw, 33vw"
        }
        fallbackLabel={event.title}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />

      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        {event.featured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
            <Star className="h-3 w-3 fill-charcoal" />
            Recomandat
          </span>
        ) : null}
        {event.ticketUrl?.trim() ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/90 px-2.5 py-1 text-xs font-semibold text-warm-white">
            <Ticket className="h-3 w-3" />
            Bilete
          </span>
        ) : null}
      </div>

      <div className="relative z-10 mt-auto p-6 text-warm-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-cream/90">
          {dateLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
          ) : null}
          {event.timeLabel?.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {event.timeLabel}
            </span>
          ) : null}
        </div>
        <h3
          className={cn(
            "mt-2 font-serif font-semibold",
            large ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {event.title}
        </h3>
        {event.location?.trim() ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-cream/85">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-2 max-w-lg text-sm leading-relaxed text-cream/85",
            large ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {event.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-warm-white">
            Vezi detalii
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
