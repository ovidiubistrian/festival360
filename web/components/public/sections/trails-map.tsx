"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Footprints,
  Mountain,
  Clock,
  Ruler,
  TrendingUp,
  Images,
  MapPin,
  Download,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AccommodationGallery } from "@/components/public/accommodation-gallery";
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

/**
 * Descărcarea urmei GPX, pentru încărcat în ceas sau aplicația de navigație.
 * Fișierul e servit same-origin (Caddy proxiază /media), deci atributul
 * `download` chiar forțează descărcarea și îi dă un nume citibil.
 */
function TrailGpxButton({ trail }: { trail: Trail }) {
  const fileName = `${
    trail.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "traseu"
  }.gpx`;
  return (
    <Button asChild variant="ghost" size="sm">
      <a href={trail.gpx} download={fileName}>
        <Download className="h-4 w-4" />
        Descarcă GPX
      </a>
    </Button>
  );
}

/** One metric line inside a trail card / the details dialog. */
function TrailMeta({ trail }: { trail: Trail }) {
  return (
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
  );
}

export function TrailsMap({ trails }: { trails?: Trails }) {
  const eyebrow = trails?.eyebrow?.trim() || DEFAULTS.eyebrow;
  const title = trails?.title?.trim() || DEFAULTS.title;
  const description = trails?.description?.trim() || DEFAULTS.description;
  const mapQuery = trails?.mapQuery?.trim() || DEFAULTS.mapQuery;
  const items =
    trails?.items && trails.items.length > 0 ? trails.items : DEFAULTS.items;

  // Which card is emphasized on the map (toggle), and which one has its
  // details dialog open.
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [detailIndex, setDetailIndex] = React.useState<number | null>(null);

  const handleSelect = React.useCallback((i: number) => {
    setSelectedIndex((prev) => (prev === i ? null : i));
  }, []);

  const detailTrail = detailIndex != null ? items[detailIndex] : null;
  const detailPhotos = (detailTrail?.gallery ?? []).filter(Boolean);

  return (
    <section id="trasee" className="bg-secondary py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        {/* Pe desktop harta rămâne lipită în timp ce derulezi lista: cu multe
            trasee, altfel ajungeai să citești o coloană lungă de carduri lângă
            un dreptunghi gol. `lg:items-start` e obligatoriu — altfel coloana
            hărții s-ar întinde pe toată înălțimea rândului și `sticky` n-ar
            mai avea pe ce aluneca. Pe telefon rămâne stivuit, ca până acum. */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)] lg:items-start lg:gap-10">
          {/* `isolate` ține z-index-urile interne ale Leaflet (panouri 400,
              controale 1000) într-un context de stivuire propriu. Fără el,
              harta se desena PESTE dialogul de detalii, care e pe z-50. */}
          <div className="relative isolate aspect-video overflow-hidden rounded-2xl border border-border lg:sticky lg:top-24 lg:aspect-auto lg:h-[calc(100vh_-_8rem)] lg:max-h-[44rem] lg:min-h-[30rem]">
            <TrailsLeafletMap
              trails={items}
              mapQuery={mapQuery}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          </div>

          <ul className="space-y-4">
            {items.map((trail, i) => {
              const selected = selectedIndex === i;
              const photos = (trail.gallery ?? []).filter(Boolean);
              const hasDetails = !!trail.description?.trim() || photos.length > 0;
              return (
                <li
                  key={`${trail.name}-${i}`}
                  className={cn(
                    "rounded-2xl border bg-card p-5 transition-colors",
                    selected
                      ? "border-primary ring-2 ring-primary/60"
                      : "border-border"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(i)}
                    aria-pressed={selected}
                    className="w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <TrailMeta trail={trail} />
                  </button>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={selected ? "gold" : "outline"}
                      size="sm"
                      onClick={() => handleSelect(i)}
                    >
                      <MapPin className="h-4 w-4" />
                      {selected ? "Ascunsă pe hartă" : "Vezi pe hartă"}
                    </Button>
                    {hasDetails ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailIndex(i)}
                      >
                        {photos.length > 0 ? (
                          <Images className="h-4 w-4" />
                        ) : null}
                        Detalii
                      </Button>
                    ) : null}
                    {trail.gpx?.trim() ? <TrailGpxButton trail={trail} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>

      <Dialog
        open={detailIndex != null}
        onOpenChange={(open) => {
          if (!open) setDetailIndex(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {detailTrail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 shrink-0 text-terracotta" />
                  {detailTrail.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalii despre traseul {detailTrail.name}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    DIFFICULTY_STYLES[detailTrail.difficulty]
                  )}
                >
                  <Mountain className="h-3.5 w-3.5" />
                  {detailTrail.difficulty}
                </span>
                <TrailMeta trail={detailTrail} />

                {detailTrail.gpx?.trim() ? (
                  <TrailGpxButton trail={detailTrail} />
                ) : null}

                {detailPhotos.length > 0 ? (
                  <AccommodationGallery
                    images={detailPhotos}
                    name={detailTrail.name}
                  />
                ) : null}

                {detailTrail.description?.trim() ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal/80">
                    {detailTrail.description}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
