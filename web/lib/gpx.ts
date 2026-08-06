/**
 * Minimal, client-side GPX parser. Extracts ordered `[lat, lng]` coordinate
 * pairs from a GPX document — track points (`<trkpt>`) first, falling back to
 * route points (`<rtept>`) when a file has no tracks. DOMParser-based, so it
 * must run in the browser (never on the server).
 */

export type LatLng = [number, number];

/**
 * Parse a GPX XML string into an array of `[lat, lng]` pairs. Returns an empty
 * array on malformed input or when no usable points are found.
 */
export function parseGpx(xml: string): LatLng[] {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [];
  }
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    // A parse error yields a <parsererror> node in the document.
    if (doc.getElementsByTagName("parsererror").length > 0) return [];

    const collect = (tag: string): LatLng[] => {
      const nodes = Array.from(doc.getElementsByTagName(tag));
      const points: LatLng[] = [];
      for (const node of nodes) {
        const lat = parseFloat(node.getAttribute("lat") ?? "");
        const lng = parseFloat(node.getAttribute("lon") ?? "");
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          points.push([lat, lng]);
        }
      }
      return points;
    };

    const trackPoints = collect("trkpt");
    if (trackPoints.length > 0) return trackPoints;
    return collect("rtept");
  } catch {
    return [];
  }
}

/**
 * Fetch a GPX file and parse it into `[lat, lng]` pairs. Resolves to an empty
 * array on any network/parse failure — never throws.
 */
export async function fetchGpxTrack(url: string): Promise<LatLng[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseGpx(xml);
  } catch (err) {
    console.error("fetchGpxTrack failed", err);
    return [];
  }
}
