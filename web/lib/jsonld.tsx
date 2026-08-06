import type {
  Accommodation,
  Article,
  Destination,
  Event,
  Restaurant,
  Tenant,
} from "@/lib/tenants/types";

/**
 * Structured-data (schema.org JSON-LD) builders + a render helper.
 *
 * Every builder returns a plain object; `<JsonLd>` serializes it safely into a
 * `<script type="application/ld+json">`. `<` is escaped so string content can
 * never break out of the script element.
 */

export type JsonLdObject = Record<string, unknown>;

/** Serialize + escape a JSON-LD payload for inline embedding. */
function serialize(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Renders one or more JSON-LD blobs. Safe against `</script>` injection. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

/** Join a tenant base URL with a tenant-relative path. */
function abs(base: string, path: string): string {
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function nonEmpty(...values: (string | undefined)[]): string[] {
  return values.filter((v): v is string => Boolean(v && v.trim()));
}

/** Vertical-aware primary schema for the homepage. */
export function siteJsonLd(t: Tenant, url: string): JsonLdObject {
  const { info, social } = t.config;
  const et = (t.config.eventType || "").toLowerCase();

  const sameAs = nonEmpty(
    social.facebook,
    social.instagram,
    social.youtube,
    social.tiktok,
    social.website
  );

  const address: JsonLdObject = {
    "@type": "PostalAddress",
    ...(info.city ? { addressLocality: info.city } : {}),
    ...(info.county ? { addressRegion: info.county } : {}),
    addressCountry: "RO",
  };

  const base: JsonLdObject = {
    "@context": "https://schema.org",
    name: info.name,
    description: info.shortDescription,
    url,
    ...(info.heroImage ? { image: info.heroImage } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  if (et === "festival") {
    return {
      ...base,
      "@type": "Festival",
      ...(info.startDate ? { startDate: info.startDate } : {}),
      ...(info.endDate ? { endDate: info.endDate } : {}),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: info.locationName || info.name,
        address,
      },
      organizer: {
        "@type": "Organization",
        name: info.name,
        ...(social.website ? { url: social.website } : {}),
      },
    };
  }

  if (et === "resort") {
    return { ...base, "@type": "Resort", address };
  }
  if (et === "museum") {
    return { ...base, "@type": "Museum", address };
  }

  return { ...base, "@type": "LocalBusiness", address };
}

/** BreadcrumbList for a detail page. Item paths are tenant-relative. */
export function breadcrumbJsonLd(
  base: string,
  items: { name: string; path: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(base, it.path),
    })),
  };
}

export function accommodationJsonLd(
  a: Accommodation,
  url: string
): JsonLdObject {
  const images = nonEmpty(a.image, ...(a.gallery ?? []));
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: a.name,
    ...(a.shortDescription ? { description: a.shortDescription } : {}),
    ...(images.length ? { image: images } : {}),
    url,
    ...(a.priceFrom ? { priceRange: a.priceFrom } : {}),
    ...(a.address ? { address: { "@type": "PostalAddress", streetAddress: a.address } } : {}),
    ...(a.contactPhone ? { telephone: a.contactPhone } : {}),
    ...(a.amenities && a.amenities.length
      ? {
          amenityFeature: a.amenities.map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
        }
      : {}),
  };
}

export function restaurantJsonLd(r: Restaurant, url: string): JsonLdObject {
  const images = nonEmpty(r.image, ...(r.gallery ?? []));
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    ...(r.shortDescription ? { description: r.shortDescription } : {}),
    ...(images.length ? { image: images } : {}),
    url,
    ...(r.cuisine ? { servesCuisine: r.cuisine } : {}),
    ...(r.priceRange ? { priceRange: r.priceRange } : {}),
    ...(r.hours ? { openingHours: r.hours } : {}),
    ...(r.address ? { address: { "@type": "PostalAddress", streetAddress: r.address } } : {}),
    ...(r.contactPhone ? { telephone: r.contactPhone } : {}),
    ...(r.menuUrl ? { menu: r.menuUrl } : {}),
  };
}

export function eventJsonLd(e: Event, url: string): JsonLdObject {
  const images = nonEmpty(e.coverImage, ...(e.gallery ?? []));
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    ...(e.shortDescription ? { description: e.shortDescription } : {}),
    ...(images.length ? { image: images } : {}),
    url,
    ...(e.startDate ? { startDate: e.startDate } : {}),
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(e.location
      ? { location: { "@type": "Place", name: e.location } }
      : {}),
    ...(e.ticketUrl
      ? {
          offers: {
            "@type": "Offer",
            url: e.ticketUrl,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function destinationJsonLd(
  d: Destination,
  url: string
): JsonLdObject {
  const images = nonEmpty(d.coverImage, ...(d.gallery ?? []));
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: d.name,
    ...(d.shortDescription ? { description: d.shortDescription } : {}),
    ...(images.length ? { image: images } : {}),
    url,
    ...(d.county || d.region
      ? {
          address: {
            "@type": "PostalAddress",
            ...(d.county ? { addressRegion: d.county } : {}),
            addressCountry: "RO",
          },
        }
      : {}),
  };
}

export function articleJsonLd(
  a: Article,
  url: string,
  publisherName: string
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.coverImage ? { image: [a.coverImage] } : {}),
    ...(a.date ? { datePublished: a.date, dateModified: a.date } : {}),
    ...(a.author
      ? { author: { "@type": "Person", name: a.author } }
      : {}),
    publisher: { "@type": "Organization", name: publisherName },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
