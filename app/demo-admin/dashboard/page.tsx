"use client";

import Link from "next/link";
import {
  Users,
  Eye,
  Store,
  ShoppingBasket,
  MapPin,
  Handshake,
  Mail,
  Send,
  Newspaper,
  ExternalLink,
  ArrowRight,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/lib/admin/store";
import { mockTraffic } from "@/lib/admin/analytics";
import { formatDate, formatNumber } from "@/lib/utils";

const SHORTCUTS = [
  { label: "Adaugă expozant", href: "/demo-admin/exhibitors", icon: Store },
  { label: "Adaugă produs", href: "/demo-admin/products", icon: ShoppingBasket },
  { label: "Publică o noutate", href: "/demo-admin/news", icon: Newspaper },
  { label: "Editează programul", href: "/demo-admin/program", icon: MapPin },
];

export default function DashboardPage() {
  const data = useAdminData();

  const publishedExhibitors = data.exhibitors.filter(
    (e) => e.status === "published"
  ).length;
  const publishedProducts = data.products.filter(
    (p) => p.status === "published"
  ).length;
  const publishedDestinations = data.destinations.filter(
    (d) => d.status === "published"
  ).length;

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

  return (
    <AdminShell
      title="Dashboard"
      description="Privire de ansamblu asupra festivalului. Cifrele de trafic sunt exemplificative (demo); numărul de conținuturi este real, din datele tale."
    >
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Vizitatori"
          value={formatNumber(mockTraffic.visitorsTotal)}
          icon={<Users />}
          trend={{ value: "+12,4% vs. săpt. trecută", positive: true }}
        />
        <StatCard
          label="Pagini vizualizate"
          value={formatNumber(mockTraffic.pageViewsTotal)}
          icon={<Eye />}
          trend={{ value: "+9,1% vs. săpt. trecută", positive: true }}
        />
        <StatCard
          label="Expozanți activi"
          value={publishedExhibitors}
          icon={<Store />}
          hint={`din ${data.exhibitors.length} total`}
        />
        <StatCard
          label="Produse publicate"
          value={publishedProducts}
          icon={<ShoppingBasket />}
          hint={`din ${data.products.length} total`}
        />
        <StatCard
          label="Destinații promovate"
          value={publishedDestinations}
          icon={<MapPin />}
          hint={`din ${data.destinations.length} total`}
        />
        <StatCard
          label="Parteneri"
          value={data.partners.length}
          icon={<Handshake />}
        />
        <StatCard
          label="Înscrieri newsletter"
          value={data.newsletter.length}
          icon={<Send />}
        />
        <StatCard
          label="Mesaje necitite"
          value={data.contactMessages.filter((m) => !m.read).length}
          icon={<Mail />}
          hint={`din ${data.contactMessages.length} mesaje`}
        />
      </div>

      {/* Chart + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vizitatori în timp</CardTitle>
            <CardDescription>
              Ultimele 14 zile · date exemplificative pentru demonstrație
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitorsChart />
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
              {SHORTCUTS.map((s) => {
                const ShortcutIcon = s.icon;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary [&_svg]:size-4">
                        <ShortcutIcon />
                      </span>
                      {s.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
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
              <a href="/prispa" target="_blank" rel="noreferrer">
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
