"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { apiBaseUrl } from "@/lib/api-base";

export interface AnalyticsBeaconProps {
  /** Tenant slug this page belongs to. */
  slug: string;
}

/**
 * Cookieless page-view beacon. Fires once on mount and again whenever the
 * pathname changes, POSTing `{ path, referrer }` to the tenant's public
 * `/track` endpoint. It:
 *
 *   - respects Do Not Track (`navigator.doNotTrack === "1"`) and never fires;
 *   - prefers `navigator.sendBeacon` (fire-and-forget, survives navigation),
 *     falling back to `fetch(..., { keepalive: true })`;
 *   - sets no cookies, keeps no state, and never throws.
 *
 * Rendered once in the tenant layout. The tracking side effect is exactly the
 * kind of DOM/analytics work `useEffect` is for (no React state is set), so it
 * does not run afoul of the repo's set-state-in-effect rule.
 */
export function AnalyticsBeacon({ slug }: AnalyticsBeaconProps) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    // Respect Do Not Track.
    const dnt =
      window.navigator.doNotTrack ??
      (window as unknown as { doNotTrack?: string }).doNotTrack;
    if (dnt === "1" || dnt === "yes") return;

    const url = `${apiBaseUrl()}/api/v1/tenants/${slug}/track`;
    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || "",
    });

    try {
      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon(url, blob);
        if (ok) return;
      }
      // Fallback: keepalive fetch (survives the page unloading).
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
        // Beacon is anonymous — no credentials, no cookies.
        credentials: "omit",
      }).catch(() => {
        /* analytics must never surface an error to the page */
      });
    } catch {
      /* never throw from the beacon */
    }
  }, [slug, pathname]);

  return null;
}
