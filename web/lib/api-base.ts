/**
 * Resolve the API base URL for a fetch, correctly for every context:
 *
 * - **Server (SSR / middleware):** the internal service URL (fast, no public
 *   hop) or a configured public URL.
 * - **Browser, production:** SAME-ORIGIN (empty base → `/api/...`). Caddy
 *   proxies `/api` and `/media` to the API on every host, so this works on the
 *   platform domain AND on any tenant custom domain, with no CORS and without
 *   needing an `api.` subdomain.
 * - **Browser, local dev:** talks directly to the configured localhost API
 *   (there is no proxy in front of `next dev`).
 */
export function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL?.replace(/\/$/, "") ||
      configured ||
      "http://localhost:8000"
    );
  }
  // Escape hatch doar pentru dev: un API pe localhost e fără sens în browserul
  // din producție (ar lovi calculatorul vizitatorului). Un build care a uitat
  // NEXT_PUBLIC_API_BASE_URL nu trebuie să spargă tăcut toate cererile —
  // în producție cădem întotdeauna pe same-origin, proxiat de Caddy.
  if (
    process.env.NODE_ENV !== "production" &&
    configured &&
    /localhost|127\.0\.0\.1/.test(configured)
  ) {
    return configured;
  }
  return ""; // relative → same-origin (proxied by Caddy)
}
