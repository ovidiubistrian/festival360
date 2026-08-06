"use client";

import * as React from "react";
import {
  Users,
  Eye,
  Globe2,
  Building2,
  FileText,
  Radio,
  MonitorSmartphone,
  BarChart3,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
import { VisitorsChart } from "@/components/admin/visitors-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenant, useSession } from "@/lib/admin/session";
import {
  getAnalytics,
  isAnalyticsEmpty,
  type Analytics,
  type AnalyticsRange,
} from "@/lib/admin/analytics";
import { cn, formatNumber } from "@/lib/utils";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 zile" },
  { value: "30d", label: "30 zile" },
  { value: "90d", label: "90 zile" },
];

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobil",
  tablet: "Tabletă",
};

/** Regional-indicator flag emoji for an ISO-2 country code (e.g. "RO" → 🇷🇴). */
function countryFlag(iso: string): string {
  const code = (iso || "").toUpperCase();
  if (code.length !== 2) return "🏳️";
  const a = code.charCodeAt(0);
  const b = code.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🏳️";
  const BASE = 0x1f1e6; // regional indicator "A"
  return String.fromCodePoint(BASE + (a - 65), BASE + (b - 65));
}

/** Trend descriptor from a current/previous pair (divide-by-zero safe). */
function trendFrom(
  cur: number,
  prev: number
): { value: string; positive: boolean } | undefined {
  if (prev <= 0) {
    if (cur > 0) return { value: "nou vs. perioada precedentă", positive: true };
    return undefined;
  }
  const pct = ((cur - prev) / prev) * 100;
  const rounded = Math.abs(pct).toLocaleString("ro-RO", {
    maximumFractionDigits: 1,
  });
  const sign = pct >= 0 ? "+" : "−";
  return {
    value: `${sign}${rounded}% vs. perioada precedentă`,
    positive: pct >= 0,
  };
}

interface BarRow {
  key: string;
  label: React.ReactNode;
  value: number;
}

/** A compact horizontal bar list (share-of-total). */
function BarList({
  rows,
  accent = "bg-primary/70",
  emptyLabel,
}: {
  rows: BarRow[];
  accent?: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-foreground">
              {r.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
              {formatNumber(r.value)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full", accent)}
              style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PanelCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-4">
            <Icon />
          </span>
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  // Subscribe to the session so tenant switches re-render + reload.
  useSession();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const currentTenant = mounted ? getCurrentTenant() : null;

  const [range, setRange] = React.useState<AnalyticsRange>("7d");
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedSig, setLoadedSig] = React.useState<string | null>(null);

  // Reload whenever the tenant or range changes — from render, behind a guard
  // (never a setState-in-effect, which the repo lints as an error).
  const sig = `${currentTenant ?? ""}|${range}`;
  if (mounted && currentTenant && loadedSig !== sig) {
    setLoadedSig(sig);
    setLoaded(false);
    void (async () => {
      const res = await getAnalytics(range);
      if (`${getCurrentTenant() ?? ""}|${range}` === sig) {
        setAnalytics(res);
        setLoaded(true);
      }
    })();
  }

  const totals = analytics?.totals;
  const empty = loaded && isAnalyticsEmpty(analytics);

  const countryRows: BarRow[] = (analytics?.topCountries ?? []).map((c) => ({
    key: c.country || c.countryName,
    label: (
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none">
          {countryFlag(c.country)}
        </span>
        {c.countryName || c.country || "Necunoscut"}
      </span>
    ),
    value: c.views,
  }));

  const cityRows: BarRow[] = (analytics?.topCities ?? []).map((c) => ({
    key: `${c.city}-${c.country}`,
    label: (
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none">
          {countryFlag(c.country)}
        </span>
        {c.city}
      </span>
    ),
    value: c.views,
  }));

  const pageRows: BarRow[] = (analytics?.topPages ?? []).map((p) => ({
    key: p.path,
    label: <span className="font-mono text-[13px]">{p.path}</span>,
    value: p.views,
  }));

  const referrerRows: BarRow[] = (analytics?.referrers ?? []).map((r) => ({
    key: r.referrer || "direct",
    label: r.referrer || "Direct",
    value: r.views,
  }));

  const deviceRows: BarRow[] = (analytics?.devices ?? []).map((d) => ({
    key: d.device || "other",
    label: DEVICE_LABELS[d.device] ?? d.device ?? "Altul",
    value: d.views,
  }));

  const rangeSwitcher = (
    <div className="inline-flex rounded-xl border border-border bg-card p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => setRange(r.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            range === r.value
              ? "bg-primary text-warm-white"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={range === r.value}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <AdminShell
      title="Analiză trafic"
      description="Trafic real, fără cookie-uri: vizitatori unici, surse, geografie și dispozitive."
      actions={rangeSwitcher}
    >
      {!loaded ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Se încarcă datele de trafic…
        </div>
      ) : empty || !analytics ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
            <BarChart3 className="h-9 w-9 text-muted-foreground" />
            <h2 className="font-serif text-lg font-semibold text-primary">
              Încă nu există date de trafic
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Statisticile apar aici imediat ce site-ul public primește
              vizitatori. Colectăm datele fără cookie-uri și fără să identificăm
              persoane.
            </p>
            <Button asChild variant="outline" size="sm">
              <a
                href={currentTenant ? `/${currentTenant}` : "/"}
                target="_blank"
                rel="noreferrer"
              >
                Vezi site-ul public
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Vizitatori unici"
              value={formatNumber(totals?.uniques ?? 0)}
              icon={<Users />}
              trend={
                totals ? trendFrom(totals.uniques, totals.uniquesPrev) : undefined
              }
            />
            <StatCard
              label="Vizualizări"
              value={formatNumber(totals?.views ?? 0)}
              icon={<Eye />}
              trend={
                totals ? trendFrom(totals.views, totals.viewsPrev) : undefined
              }
            />
          </div>

          {/* Timeseries */}
          <Card>
            <CardHeader>
              <CardTitle>Vizitatori în timp</CardTitle>
              <CardDescription>
                Vizitatori unici și pagini vizualizate pe zi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VisitorsChart data={analytics.timeseries} />
            </CardContent>
          </Card>

          {/* Geography */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PanelCard
              title="Top țări"
              description="Vizualizări după țara vizitatorului"
              icon={Globe2}
            >
              <BarList
                rows={countryRows}
                accent="bg-primary/70"
                emptyLabel="Nicio țară înregistrată încă."
              />
            </PanelCard>
            <PanelCard
              title="Top orașe"
              description="Cele mai active localități"
              icon={Building2}
            >
              <BarList
                rows={cityRows}
                accent="bg-terracotta/70"
                emptyLabel="Niciun oraș înregistrat încă."
              />
            </PanelCard>
          </div>

          {/* Pages + sources + devices */}
          <div className="grid gap-6 lg:grid-cols-3">
            <PanelCard
              title="Top pagini"
              description="Cele mai vizitate adrese"
              icon={FileText}
            >
              <BarList
                rows={pageRows}
                accent="bg-primary/70"
                emptyLabel="Nicio pagină înregistrată încă."
              />
            </PanelCard>
            <PanelCard
              title="Surse"
              description="De unde vin vizitatorii"
              icon={Radio}
            >
              <BarList
                rows={referrerRows}
                accent="bg-gold/70"
                emptyLabel="Nicio sursă înregistrată încă."
              />
            </PanelCard>
            <PanelCard
              title="Dispozitive"
              description="Desktop, mobil, tabletă"
              icon={MonitorSmartphone}
            >
              <BarList
                rows={deviceRows}
                accent="bg-primary/60"
                emptyLabel="Niciun dispozitiv înregistrat încă."
              />
            </PanelCard>
          </div>
        </>
      )}
    </AdminShell>
  );
}
