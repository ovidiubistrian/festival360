"use client";

import dynamic from "next/dynamic";
import { Footprints, Mountain, Clock, Ruler, TrendingUp } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Trail, TrailDifficulty, Trails } from "@/lib/tenants/types";
import { cn } from "@/lib/utils";

// The interactive map is client-only (leaflet touches `window`); load it with
// SSR disabled so it never renders on the server.
const TrailsLeafletMap = dynamic(() => import("./trails-leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-secondary text-sm text-muted-foreground">
      Se încarcă harta…
    </div>
  ),
});

const DIFFICULTY_STYLES: Record<TrailDifficulty, string> = {
  "Ușor": "bg-emerald-100 text-emerald-800",
  Mediu: "bg-gold/20 text-[color:var(--gold-600)]",
  Dificil: "bg-terracotta/15 text-[color:var(--terracotta-600)]",
};

/** Frontend fallback defaults — used when the config object is empty. */
const DEFAULTS = {
  eyebrow: "Explorează zona",
  title: "Trasee & hartă",
  description:
    "Descoperă potecile din jurul stațiunii — de la plimbări ușoare pe malul lacului până la ture montane pentru cei experimentați.",
  mapQuery: "Poiana Mărului",
  items: [
    {
      name: "Traseul Lacului Verde",
      difficulty: "Ușor",
      length: "4,2 km",
      elevation: "120 m",
      duration: "1h 30m",
    },
    {
      name: "Poteca Izvoarelor",
      difficulty: "Ușor",
      length: "6 km",
      elevation: "210 m",
      duration: "2h",
    },
    {
      name: "Creasta Muntele Mic",
      difficulty: "Mediu",
      length: "9,5 km",
      elevation: "540 m",
      duration: "3h 30m",
    },
    {
      name: "Vârful Țarcu",
      difficulty: "Dificil",
      length: "16 km",
      elevation: "1.180 m",
      duration: "6h",
    },
  ] as Trail[],
} satisfies Required<Omit<Trails, "items">> & { items: Trail[] };

export function TrailsMap({ trails }: { trails?: Trails }) {
  const eyebrow = trails?.eyebrow?.trim() || DEFAULTS.eyebrow;
  const title = trails?.title?.trim() || DEFAULTS.title;
  const description = trails?.description?.trim() || DEFAULTS.description;
  const mapQuery = trails?.mapQuery?.trim() || DEFAULTS.mapQuery;
  const items =
    trails?.items && trails.items.length > 0 ? trails.items : DEFAULTS.items;

  return (
    <section id="trasee" className="bg-secondary py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border">
            <TrailsLeafletMap trails={items} mapQuery={mapQuery} />
          </div>

          <ul className="space-y-4">
            {items.map((trail, i) => (
              <li
                key={`${trail.name}-${i}`}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-primary">
                    <Footprints className="h-5 w-5 shrink-0 text-terracotta" />
                    {trail.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      DIFFICULTY_STYLES[trail.difficulty]
                    )}
                  >
                    <Mountain className="h-3.5 w-3.5" />
                    {trail.difficulty}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-charcoal/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {trail.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-primary" />
                    {trail.length}
                  </span>
                  {trail.elevation?.trim() ? (
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {trail.elevation}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
