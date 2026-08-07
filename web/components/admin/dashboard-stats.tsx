"use client";

import * as React from "react";
import {
  BedDouble,
  CalendarDays,
  Footprints,
  Handshake,
  Images,
  Mail,
  MapPin,
  Newspaper,
  Send,
  ShoppingBasket,
  Store,
  Tent,
  UtensilsCrossed,
} from "lucide-react";
import type { StatCardProps } from "@/components/admin/stat-card";
import type { AdminData } from "@/lib/admin/store";
import type { CustomSectionSource, SectionConfig } from "@/lib/tenants/types";

/**
 * Cardurile de conținut din dashboard, derivate din „Pagini și secțiuni".
 *
 * Panoul arăta mereu setul de la festival („Expozanți", „Produse",
 * „Destinații"), care pentru o stațiune însemna trei zerouri și niciun număr
 * despre ce are ea de fapt — cazări, campinguri, restaurante, trasee. Aici
 * fiecare card e legat de o secțiune: apare doar dacă secțiunea e vizibilă și
 * în aceeași ordine ca în pagina de secțiuni, inclusiv pentru secțiunile
 * personalizate (ex. „Campinguri", care e o secțiune proprie la Poiana).
 */

/**
 * Publicate; colecțiile fără câmp de status (galeria) se numără integral.
 * `unknown[]` fiindcă apelanții trimit colecții diferite, iar `{status?: …}` e
 * un tip slab: TypeScript refuză să-i atribuie un tip fără câmpul `status`.
 */
function countPublished(items: readonly unknown[] | undefined): number {
  return (items ?? []).filter((item) => {
    const status = (item as { status?: string }).status;
    return status === undefined || status === "published";
  }).length;
}

type Stat = StatCardProps & { key: string };

/** Iconița unei secțiuni personalizate, după colecția pe care o afișează. */
const SOURCE_ICONS: Partial<Record<CustomSectionSource, React.ReactNode>> = {
  accommodations: <Tent />,
  restaurants: <UtensilsCrossed />,
  products: <ShoppingBasket />,
  destinations: <MapPin />,
  exhibitors: <Store />,
  gallery: <Images />,
  news: <Newspaper />,
  program: <CalendarDays />,
  events: <CalendarDays />,
};

/** Colecția din `AdminData` pe care o citește o secțiune personalizată. */
function sourceItems(
  data: AdminData,
  source: CustomSectionSource | undefined
): readonly unknown[] {
  switch (source) {
    case "accommodations":
      return data.accommodations;
    case "restaurants":
      return data.restaurants;
    case "products":
      return data.products;
    case "destinations":
      return data.destinations;
    case "exhibitors":
      return data.exhibitors;
    case "gallery":
      return data.gallery;
    case "news":
      return data.articles;
    case "program":
      return data.program;
    case "events":
      return data.events;
    default:
      return [];
  }
}

/** Câte elemente publicate arată o secțiune personalizată, cu filtrul ei cu tot. */
function customSectionCount(data: AdminData, section: SectionConfig): number {
  const items = sourceItems(data, section.source);
  const field = section.filterField?.trim();
  const value = section.filterValue?.trim();
  const filtered =
    field && value
      ? items.filter(
          (i) => String((i as Record<string, unknown>)[field] ?? "") === value
        )
      : items;
  return countPublished(filtered);
}

export function contentStats(data: AdminData): Stat[] {
  const L = (key: string, fallback: string) => data.labels?.[key] ?? fallback;
  const isResort = data.eventType === "resort";
  const has = (module: string) =>
    !data.modules || data.modules.includes(module);

  const total = (n: number) => `din ${n} total`;

  function forSection(section: SectionConfig): Stat | null {
    if (section.custom) {
      if (!section.source) return null;
      return {
        key: section.id,
        label: section.label,
        value: customSectionCount(data, section),
        icon: SOURCE_ICONS[section.source] ?? <Tent />,
      };
    }

    switch (section.id) {
      // La stațiune zona „expozanți" e chiar lista de cazări (fără campinguri,
      // care au secțiunea lor) — exact ce randează și prima pagină.
      case "exhibitors":
        if (isResort) {
          if (!has("accommodations")) return null;
          const lodging = data.accommodations.filter(
            (a) => a.type !== "camping"
          );
          return {
            key: "accommodations",
            label: L("navAccommodations", "Cazări"),
            value: countPublished(lodging),
            icon: <BedDouble />,
            hint: total(lodging.length),
          };
        }
        if (!has("exhibitors")) return null;
        return {
          key: "exhibitors",
          label: L("navExhibitors", "Expozanți activi"),
          value: countPublished(data.exhibitors),
          icon: <Store />,
          hint: total(data.exhibitors.length),
        };

      case "restaurants":
        if (!has("restaurants")) return null;
        return {
          key: "restaurants",
          label: L("navRestaurants", "Restaurante"),
          value: countPublished(data.restaurants),
          icon: <UtensilsCrossed />,
          hint: total(data.restaurants.length),
        };

      case "products":
        if (!has("products")) return null;
        return {
          key: "products",
          label: L("navProducts", "Produse publicate"),
          value: countPublished(data.products),
          icon: <ShoppingBasket />,
          hint: total(data.products.length),
        };

      case "destinations":
        if (!has("destinations")) return null;
        return {
          key: "destinations",
          label: L("navDestinations", "Destinații promovate"),
          value: countPublished(data.destinations),
          icon: <MapPin />,
          hint: total(data.destinations.length),
        };

      case "events":
        if (!has("events")) return null;
        return {
          key: "events",
          label: L("navEvents", "Evenimente"),
          value: countPublished(data.events),
          icon: <CalendarDays />,
          hint: total(data.events.length),
        };

      case "program":
        if (!has("program")) return null;
        return {
          key: "program",
          label: L("navProgram", "Momente în program"),
          value: data.program.length,
          icon: <CalendarDays />,
        };

      // Traseele nu sunt o colecție, ci configurația widgetului de hartă.
      case "trails": {
        const trails = data.trails?.items ?? [];
        return {
          key: "trails",
          label: "Trasee",
          value: trails.length,
          icon: <Footprints />,
          hint: trails.length === 0 ? "niciunul adăugat" : "pe hartă",
        };
      }

      case "partners":
        if (!has("partners")) return null;
        return {
          key: "partners",
          label: "Parteneri",
          value: data.partners.length,
          icon: <Handshake />,
        };

      case "gallery":
        if (!has("gallery")) return null;
        return {
          key: "gallery",
          label: "Fotografii în galerie",
          value: data.gallery.length,
          icon: <Images />,
        };

      case "news":
        if (!has("news")) return null;
        return {
          key: "news",
          label: "Noutăți publicate",
          value: countPublished(data.articles),
          icon: <Newspaper />,
          hint: total(data.articles.length),
        };

      case "newsletter":
        if (!has("newsletter")) return null;
        return {
          key: "newsletter",
          label: "Înscrieri newsletter",
          value: data.newsletter.length,
          icon: <Send />,
        };

      // hero / about / experiences / conditions n-au ce număra.
      default:
        return null;
    }
  }

  const stats = data.sections
    .filter((s) => s.visible)
    .map(forSection)
    .filter((s): s is Stat => s !== null);

  // Mesajele nu depind de nicio secțiune — formularul de contact e mereu acolo.
  if (has("messages")) {
    stats.push({
      key: "messages",
      label: "Mesaje necitite",
      value: data.contactMessages.filter((m) => !m.read).length,
      icon: <Mail />,
      hint: `din ${data.contactMessages.length} mesaje`,
    });
  }

  return stats;
}

/** Scurtături „adaugă conținut", filtrate după modulele verticalei. */
export function quickShortcuts(
  data: AdminData
): { label: string; href: string; icon: React.ReactNode }[] {
  const all = [
    {
      module: "accommodations",
      label: "Adaugă cazare",
      href: "/admin/accommodations",
      icon: <BedDouble />,
    },
    {
      module: "campinguri",
      label: "Adaugă camping",
      href: "/admin/campinguri",
      icon: <Tent />,
    },
    {
      module: "exhibitors",
      label: "Adaugă expozant",
      href: "/admin/exhibitors",
      icon: <Store />,
    },
    {
      module: "restaurants",
      label: "Adaugă restaurant",
      href: "/admin/restaurants",
      icon: <UtensilsCrossed />,
    },
    {
      module: "events",
      label: "Adaugă eveniment",
      href: "/admin/events",
      icon: <CalendarDays />,
    },
    {
      module: "products",
      label: "Adaugă produs",
      href: "/admin/products",
      icon: <ShoppingBasket />,
    },
    {
      module: "news",
      label: "Publică o noutate",
      href: "/admin/news",
      icon: <Newspaper />,
    },
  ];
  return all
    .filter((s) => !data.modules || data.modules.includes(s.module))
    .slice(0, 4);
}
