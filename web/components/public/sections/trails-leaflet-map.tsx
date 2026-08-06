"use client";

/**
 * Client-only interactive trail map. Rendered exclusively via a
 * `dynamic(..., { ssr: false })` import from `TrailsMap`, so leaflet and its
 * `window` access never run on the server.
 *
 * Leaflet is imperative, so the map lives entirely inside a single `useEffect`
 * that performs ONLY side effects — it never calls setState in its body (per
 * the repo's strict hooks lint). A ref guards against double-init under React
 * strict mode, and the effect cleans up the map instance on unmount.
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
}: {
  trails: Trail[];
  mapQuery?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);

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

    // Draw every GPX track, fit bounds to them all; fall back to the mapQuery
    // center (or a default) when no track is available.
    void (async () => {
      const withGpx = trails.filter((t) => t.gpx);
      const bounds = L.latLngBounds([]);

      const drawn = await Promise.all(
        withGpx.map(async (trail) => {
          const points = await fetchGpxTrack(trail.gpx as string);
          if (cancelled || points.length === 0) return false;
          const line = L.polyline(points, {
            color: DIFFICULTY_COLORS[trail.difficulty] ?? "#183C32",
            weight: 4,
            opacity: 0.9,
          }).addTo(map);
          line.bindPopup(trail.name);
          bounds.extend(line.getBounds());
          return true;
        })
      );

      if (cancelled) return;

      if (drawn.some(Boolean) && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28] });
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
    };
  }, [trails, mapQuery]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="application"
      aria-label="Hartă interactivă a traseelor"
    />
  );
}
