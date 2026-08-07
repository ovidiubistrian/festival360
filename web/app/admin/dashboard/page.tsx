"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  Mail,
  Send,
  ExternalLink,
  ArrowRight,
  BarChart3,
  LineChart,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
import {
  contentStats,
  quickShortcuts,
} from "@/components/admin/dashboard-stats";
import { VisitorsChart } from "@/components/admin/visitors-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/lib/admin/store";
import { getCurrentTenant, useSession } from "@/lib/admin/session";
import {
  getAnalytics,
  isAnalyticsEmpty,
  type Analytics,
} from "@/lib/admin/analytics";
import { formatDate, formatNumber } from "@/lib/utils";

/**
 * Build a StatCard trend from a current/previous pair. Returns `undefined` when
 * there's nothing meaningful to show (no data at all), and "nou" when the metric
 * appeared this period against a zero baseline (avoids divide-by-zero).
 */
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

export default function DashboardPage() {
  const data = useAdminData();

  // Subscribe to the session so tenant switches re-render + reload analytics.
  useSession();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const currentTenant = mounted ? getCurrentTenant() : null;

  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [analyticsLoaded, setAnalyticsLoaded] = React.useState(false);
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);

  // Load 7-day analytics for the current tenant — once per tenant, driven from
  // render behind a guard (never a setState-in-effect).
  if (mounted && currentTenant && loadedFor !== currentTenant) {
    setLoadedFor(currentTenant);
    setAnalyticsLoaded(false);
    void (async () => {
      const res = await getAnalytics("7d");
      // Ignore a stale response if the tenant changed mid-flight.
      if (getCurrentTenant() === currentTenant) {
        setAnalytics(res);
        setAnalyticsLoaded(true);
      }
    })();
  }

  // Cardurile de conținut urmează secțiunile active ale site-ului, nu un set
  // fix de festival — vezi `dashboard-stats`.
  const stats = contentStats(data);
  const shortcuts = quickShortcuts(data);

  const recentMessages = data.contactMessages
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      icon: "message" as const,
      title: `Mesaj nou de la ${m.name}`,
      detail: m.subject,
      date: m.date,
    }));

  const recentSubs = data.newsletter
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      icon: "subscriber" as const,
      title: "Înscriere newsletter",
      detail: s.email,
      date: s.date,
    }));

  const activity = [...recentMessages, ...recentSubs]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const totals = analytics?.totals;
  const emptyTraffic = analyticsLoaded && isAnalyticsEmpty(analytics);
  const visitorsValue =
    totals && analyticsLoaded ? formatNumber(totals.uniques) : "—";
  const viewsValue =
    totals && analyticsLoaded ? formatNumber(totals.views) : "—";

  return (
    <AdminShell
      title="Dashboard"
      description="Privire de ansamblu asupra site-ului tău: trafic real din ultimele 7 zile și conținutul publicat."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/analytics">
            <BarChart3 className="h-4 w-4" />
            Analiză trafic
          </Link>
        </Button>
      }
    >
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Vizitatori unici"
          value={visitorsValue}
          icon={<Users />}
          trend={totals ? trendFrom(totals.uniques, totals.uniquesPrev) : undefined}
          hint="ultimele 7 zile"
        />
        <StatCard
          label="Pagini vizualizate"
          value={viewsValue}
          icon={<Eye />}
          trend={totals ? trendFrom(totals.views, totals.viewsPrev) : undefined}
          hint="ultimele 7 zile"
        />
        {stats.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </div>

      {/* Chart + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Vizitatori în timp</CardTitle>
              <CardDescription>
                Vizitatori unici și pagini vizualizate · ultimele 7 zile
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/analytics">
                Detalii
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!analyticsLoaded ? (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Se încarcă datele de trafic…
              </div>
            ) : emptyTraffic || !analytics ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
                <LineChart className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  Încă nu există date de trafic
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Vizitele apar aici imediat ce site-ul public primește vizitatori.
                </p>
              </div>
            ) : (
              <VisitorsChart data={analytics.timeseries} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activitate recentă</CardTitle>
            <CardDescription>Mesaje și înscrieri recente</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nicio activitate recentă.
              </p>
            ) : (
              <ul className="space-y-4">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary [&_svg]:size-4">
                      {a.icon === "message" ? <Mail /> : <Send />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {a.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.detail}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDate(a.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shortcuts + site status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scurtături</CardTitle>
            <CardDescription>
              Adaugă rapid conținut nou pe site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shortcuts.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-4">
                      {s.icon}
                    </span>
                    {s.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stare site</CardTitle>
            <CardDescription>Statusul publicării</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="success">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Site publicat
            </Badge>
            <p className="text-sm text-muted-foreground">
              Site-ul public este activ și reflectă conținutul din acest panou.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a
                href={currentTenant ? `/${currentTenant}` : "/prispa"}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Vezi site-ul
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
