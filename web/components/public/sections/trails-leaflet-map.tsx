"use client";

/**
 * Client-only interactive trail map. Rendered exclusively via a
 * `dynamic(..., { ssr: false })` import from `TrailsMap`, so leaflet and its
 * `window` access never run on the server.
 *
 * Leaflet is imperative, so the map lives entirely inside effects that perform
 * ONLY side effects — they never call setState in their bodies (per the repo's
 * strict hooks lint). A ref guards against double-init under React strict mode,
 * and the init effect cleans up the map instance on unmount.
 *
 * Selection highlighting is handled by a second effect keyed on `selectedIndex`
 * that mutates the stored polyline layers only (restyle, bring-to-front,
 * fitBounds) — again, no setState.
 */

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchGpxTrack } from "@/lib/gpx";
import type { Trail, TrailDifficulty } from "@/lib/tenants/types";

/** Track colors by difficulty, aligned with the trail-list badge palette. */
const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
  "Ușor": "#059669",
  Mediu: "#C99A45",
  Dificil: "#B85C3B",
};

/** Sensible default view (Carpații Meridionali) when nothing else is known. */
const DEFAULT_CENTER: [number, number] = [45.45, 22.55];
const DEFAULT_ZOOM = 9;

/** A drawn track together with the index of its trail in the source list. */
interface TrailLayer {
  index: number;
  line: L.Polyline;
  trail: Trail;
}

/** Geocode a free-text place via OSM Nominatim (no API key). Never throws. */
async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = data?.[0];
    if (!hit?.lat || !hit?.lon) return null;
    const lat = parseFloat(hit.lat);
    const lon = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  } catch {
    return null;
  }
}

export default function TrailsLeafletMap({
  trails,
  mapQuery,
  selectedIndex = null,
  onSelect,
}: {
  trails: Trail[];
  mapQuery?: string;
  /** Index (in `trails`) of the emphasized track, or null for "show all". */
  selectedIndex?: number | null;
  /** Called when a track is clicked on the map. */
  onSelect?: (index: number) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const layersRef = React.useRef<TrailLayer[]>([]);
  const allBoundsRef = React.useRef<L.LatLngBounds | null>(null);

  // Mirror the latest props into refs so the async init effect (which runs once)
  // always reads current values without being torn down and rebuilt. The refs
  // are synced in an effect (never during render, per the repo's hooks lint).
  const selectedIndexRef = React.useRef<number | null>(selectedIndex);
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    onSelectRef.current = onSelect;
  });

  // Restyle the drawn tracks for the given selection and refit the view.
  // Pure leaflet mutation — safe to call from effect bodies (no setState).
  const applySelection = React.useCallback((sel: number | null) => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || layers.length === 0) return;

    const target =
      sel != null ? layers.find((l) => l.index === sel) : undefined;

    for (const { index, line, trail } of layers) {
      const color = DIFFICULTY_COLORS[trail.difficulty] ?? "#183C32";
      if (target) {
        const active = index === sel;
        line.setStyle({
          color,
          weight: active ? 6 : 3,
          opacity: active ? 1 : 0.35,
        });
      } else {
        line.setStyle({ color, weight: 4, opacity: 0.9 });
      }
    }

    if (target) {
      target.line.bringToFront();
      map.fitBounds(target.line.getBounds(), { padding: [40, 40] });
    } else if (allBoundsRef.current?.isValid()) {
      map.fitBounds(allBoundsRef.current, { padding: [28, 28] });
    }
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    // Guard against double-init (strict mode remounts the effect).
    if (!el || mapRef.current) return;

    const map = L.map(el, { scrollWheelZoom: false }).setView(
      DEFAULT_CENTER,
      DEFAULT_ZOOM
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    let cancelled = false;

    // Draw every GPX track (keeping its source index), fit bounds to them all;
    // fall back to the mapQuery center (or a default) when nothing is drawable.
    void (async () => {
      const bounds = L.latLngBounds([]);

      await Promise.all(
        trails.map(async (trail, index) => {
          if (!trail.gpx) return;
          const points = await fetchGpxTrack(trail.gpx);
          if (cancelled || points.length === 0) return;
          const line = L.polyline(points, {
            color: DIFFICULTY_COLORS[trail.difficulty] ?? "#183C32",
            weight: 4,
            opacity: 0.9,
          }).addTo(map);
          line.bindPopup(trail.name);
          line.on("click", () => onSelectRef.current?.(index));
          bounds.extend(line.getBounds());
          layersRef.current.push({ index, line, trail });
        })
      );

      if (cancelled) return;

      if (layersRef.current.length > 0 && bounds.isValid()) {
        allBoundsRef.current = bounds;
        // Apply the current selection (if any) once tracks are on the map.
        applySelection(selectedIndexRef.current);
        return;
      }

      // No usable tracks — try to center on the configured place, else default.
      if (mapQuery) {
        const center = await geocode(mapQuery);
        if (cancelled || !center) return;
        map.setView(center, 12);
        L.circleMarker(center, {
          color: "#183C32",
          fillColor: "#183C32",
          fillOpacity: 0.85,
          radius: 8,
        })
          .addTo(map)
          .bindPopup(mapQuery);
      }
    })();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
      allBoundsRef.current = null;
    };
  }, [trails, mapQuery, applySelection]);

  // Re-emphasize whenever the selection changes. Side-effect only: it mutates
  // leaflet layers and refits the map, never calling setState.
  React.useEffect(() => {
    applySelection(selectedIndex);
  }, [selectedIndex, applySelection]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="application"
      aria-label="Hartă interactivă a traseelor"
    />
  );
}
