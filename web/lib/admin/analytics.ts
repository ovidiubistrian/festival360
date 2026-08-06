"use client";

/**
 * Real, cookieless traffic analytics for the admin.
 *
 * Reads aggregated stats for the currently-selected tenant from the FastAPI
 * backend (`GET /tenants/{slug}/admin/analytics?range=`) using the same
 * Bearer-token pattern as the rest of the admin API. Never throws — returns
 * `null` on any failure so callers can render a friendly empty state.
 */

import { getToken } from "@/lib/admin/api";
import { getCurrentTenant } from "@/lib/admin/session";
import { apiBaseUrl } from "@/lib/api-base";

const API = `${apiBaseUrl()}/api/v1`;

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface AnalyticsTotals {
  views: number;
  uniques: number;
  viewsPrev: number;
  uniquesPrev: number;
}

export interface TimeseriesPoint {
  /** ISO day, "YYYY-MM-DD". */
  date: string;
  views: number;
  uniques: number;
}

export interface TopPage {
  path: string;
  views: number;
}

export interface TopCountry {
  /** ISO-2 country code, e.g. "RO". */
  country: string;
  countryName: string;
  views: number;
}

export interface TopCity {
  city: string;
  country: string;
  views: number;
}

export interface ReferrerRow {
  referrer: string;
  views: number;
}

export interface DeviceRow {
  device: string;
  views: number;
}

export interface Analytics {
  range: AnalyticsRange;
  totals: AnalyticsTotals;
  timeseries: TimeseriesPoint[];
  topPages: TopPage[];
  topCountries: TopCountry[];
  topCities: TopCity[];
  referrers: ReferrerRow[];
  devices: DeviceRow[];
}

/**
 * Fetch aggregated analytics for the current tenant and range. Returns `null`
 * when no tenant is selected, on a non-OK response, or on any network error.
 */
export async function getAnalytics(
  range: AnalyticsRange
): Promise<Analytics | null> {
  const slug = getCurrentTenant();
  if (!slug) return null;
  try {
    const res = await fetch(
      `${API}/tenants/${slug}/admin/analytics?range=${range}`,
      {
        headers: {
          Authorization: `Bearer ${getToken() ?? ""}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as Analytics;
  } catch (err) {
    console.error("getAnalytics failed", err);
    return null;
  }
}

/** True when an analytics payload carries no recorded traffic at all. */
export function isAnalyticsEmpty(a: Analytics | null): boolean {
  if (!a) return true;
  return (a.totals?.views ?? 0) === 0 && (a.totals?.uniques ?? 0) === 0;
}
