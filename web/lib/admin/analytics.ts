/**
 * Deterministic mock analytics for the DEMO dashboard.
 *
 * There is NO real analytics backend. These values are hardcoded so the charts
 * render identically on server and client (no hydration mismatch) and never use
 * Math.random / Date.now at module scope.
 */

export interface VisitorsPoint {
  /** Short Romanian day label. */
  day: string;
  vizitatori: number;
  pagini: number;
}

/** ~14 days of mock traffic. */
export const visitorsSeries: VisitorsPoint[] = [
  { day: "21 iul", vizitatori: 1840, pagini: 4210 },
  { day: "22 iul", vizitatori: 2120, pagini: 4980 },
  { day: "23 iul", vizitatori: 1990, pagini: 4610 },
  { day: "24 iul", vizitatori: 2460, pagini: 5720 },
  { day: "25 iul", vizitatori: 3180, pagini: 7340 },
  { day: "26 iul", vizitatori: 3820, pagini: 8910 },
  { day: "27 iul", vizitatori: 3510, pagini: 8120 },
  { day: "28 iul", vizitatori: 2980, pagini: 6980 },
  { day: "29 iul", vizitatori: 3240, pagini: 7510 },
  { day: "30 iul", vizitatori: 3960, pagini: 9240 },
  { day: "31 iul", vizitatori: 4520, pagini: 10680 },
  { day: "1 aug", vizitatori: 5210, pagini: 12440 },
  { day: "2 aug", vizitatori: 4870, pagini: 11520 },
  { day: "3 aug", vizitatori: 4310, pagini: 10190 },
];

/** Mock KPI totals for the demo dashboard. */
export const mockTraffic = {
  visitorsTotal: 32480,
  pageViewsTotal: 118560,
  avgSessionMinutes: 3.4,
  bounceRate: 38,
};
