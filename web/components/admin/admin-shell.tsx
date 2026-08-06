"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Home,
  LayoutTemplate,
  CalendarDays,
  Store,
  ShoppingBasket,
  BedDouble,
  Tent,
  Utensils,
  MapPin,
  Handshake,
  Image as ImageIcon,
  Images,
  Newspaper,
  Mail,
  Send,
  BarChart3,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
  RotateCcw,
  CreditCard,
  Wallet,
  Inbox,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  isLoggedIn,
  logout,
  refresh,
  resetDemoData,
  useAdminData,
} from "@/lib/admin/store";
import {
  getCurrentTenant,
  isSuperadmin,
  setCurrentTenant,
  useSession,
} from "@/lib/admin/session";
import { listTenants, type TenantSummary } from "@/lib/admin/platform";
import { toast } from "sonner";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** A content module: its vertical key, default label, route and icon. */
interface ContentModuleDef {
  /** Module key matching the tenant `config.modules` vocabulary. */
  key: string;
  /** Tenant-label override key (terminology system). */
  labelKey: string;
  /** Default (festival) label. */
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Platform tools — super-admin only. */
const PLATFORM_NAV: NavLink[] = [
  { label: "Site-uri", href: "/admin/sites", icon: Building2 },
  { label: "Pagina principală", href: "/admin/landing", icon: Home },
  { label: "Abonamente", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Plăți", href: "/admin/billing", icon: Wallet },
  { label: "Solicitări", href: "/admin/leads", icon: Inbox },
];

/**
 * All content modules, keyed by the vertical `modules` vocabulary. The active
 * set + ordering is chosen per-tenant from `config.modules`; labels can be
 * overridden per-tenant via `config.labels[labelKey]`.
 */
const CONTENT_MODULE_DEFS: ContentModuleDef[] = [
  {
    key: "dashboard",
    labelKey: "navDashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "pages",
    labelKey: "navPages",
    label: "Pagini și secțiuni",
    href: "/admin/pages",
    icon: LayoutTemplate,
  },
  {
    key: "accommodations",
    labelKey: "navAccommodations",
    label: "Cazări",
    href: "/admin/accommodations",
    icon: BedDouble,
  },
  {
    key: "campinguri",
    labelKey: "navCampinguri",
    label: "Campinguri",
    href: "/admin/campinguri",
    icon: Tent,
  },
  {
    key: "restaurants",
    labelKey: "navRestaurants",
    label: "Restaurante",
    href: "/admin/restaurants",
    icon: Utensils,
  },
  {
    key: "program",
    labelKey: "navProgram",
    label: "Program",
    href: "/admin/program",
    icon: CalendarDays,
  },
  {
    key: "exhibitors",
    labelKey: "navExhibitors",
    label: "Expozanți",
    href: "/admin/exhibitors",
    icon: Store,
  },
  {
    key: "products",
    labelKey: "navProducts",
    label: "Produse",
    href: "/admin/products",
    icon: ShoppingBasket,
  },
  {
    key: "destinations",
    labelKey: "navDestinations",
    label: "Destinații",
    href: "/admin/destinations",
    icon: MapPin,
  },
  {
    key: "partners",
    labelKey: "navPartners",
    label: "Parteneri",
    href: "/admin/partners",
    icon: Handshake,
  },
  {
    key: "gallery",
    labelKey: "navGallery",
    label: "Galerie",
    href: "/admin/gallery",
    icon: ImageIcon,
  },
  {
    key: "media",
    labelKey: "navMedia",
    label: "Bibliotecă media",
    href: "/admin/media",
    icon: Images,
  },
  {
    key: "news",
    labelKey: "navNews",
    label: "Noutăți",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    key: "messages",
    labelKey: "navMessages",
    label: "Mesaje",
    href: "/admin/messages",
    icon: Mail,
  },
  {
    key: "newsletter",
    labelKey: "navNewsletter",
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: Send,
  },
  {
    key: "analytics",
    labelKey: "navAnalytics",
    label: "Analiză trafic",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    key: "settings",
    labelKey: "navSettings",
    label: "Setări",
    href: "/admin/settings",
    icon: Settings,
  },
];

/** Full default nav (festival vertical) — the fallback before modules load. */
const DEFAULT_CONTENT_NAV: NavLink[] = CONTENT_MODULE_DEFS.filter(
  (d) =>
    d.key !== "accommodations" &&
    d.key !== "campinguri" &&
    d.key !== "restaurants"
).map((d) => ({ label: d.label, href: d.href, icon: d.icon }));

/**
 * Build the content nav for the current tenant: filter + order by the tenant's
 * `modules` list and relabel via `labels`. Falls back to the full default list
 * when modules aren't loaded yet (never crashes).
 */
function buildContentNav(
  modules: string[] | undefined,
  labels: Record<string, string> | undefined
): NavLink[] {
  if (!modules || modules.length === 0) return DEFAULT_CONTENT_NAV;
  const byKey = new Map(CONTENT_MODULE_DEFS.map((d) => [d.key, d]));
  const nav: NavLink[] = [];
  for (const key of modules) {
    const def = byKey.get(key);
    if (!def) continue;
    nav.push({
      label: labels?.[def.labelKey] ?? def.label,
      href: def.href,
      icon: def.icon,
    });
  }
  // Safety: if the module list matched nothing known, show the default nav.
  return nav.length > 0 ? nav : DEFAULT_CONTENT_NAV;
}

/** Route prefixes that require super-admin (platform endpoints). */
const PLATFORM_PREFIXES = PLATFORM_NAV.map((n) => n.href);

function isPlatformRoute(pathname: string): boolean {
  return PLATFORM_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

interface SidebarProps {
  superadmin: boolean;
  currentTenant: string | null;
  tenants: TenantSummary[];
  onTenantChange: (slug: string) => void;
  onNavigate?: () => void;
}

function NavItem({
  item,
  onNavigate,
}: {
  item: NavLink;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const ItemIcon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-white/10 text-warm-white"
          : "text-cream/80 hover:bg-white/5 hover:text-warm-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <ItemIcon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  superadmin,
  currentTenant,
  tenants,
  onTenantChange,
  onNavigate,
}: SidebarProps) {
  const router = useRouter();
  const data = useAdminData();
  const contentNav = buildContentNav(data.modules, data.labels);

  function handleReset() {
    resetDemoData();
    toast.success("Datele au fost resetate.");
    onNavigate?.();
  }

  function handleLogout() {
    logout();
    onNavigate?.();
    router.push("/admin");
  }

  return (
    <div className="flex h-full flex-col bg-primary text-cream">
      {/* Brand */}
      <div className="px-5 py-6">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2"
        >
          <span className="font-serif text-lg font-semibold text-warm-white">
            Siteora
          </span>
          {superadmin ? (
            <Badge variant="gold">Platformă</Badge>
          ) : currentTenant ? (
            <Badge variant="gold">{currentTenant.toUpperCase()}</Badge>
          ) : null}
        </Link>
        <p className="mt-3 text-[11px] leading-snug text-cream/70">
          {superadmin
            ? "Administrare platformă — gestionezi toate site-urile."
            : "Panou de administrare — gestionezi conținutul site-ului tău."}
        </p>
      </div>

      {/* Super-admin tenant switcher */}
      {superadmin ? (
        <div className="px-3 pb-3">
          <label className="mb-1.5 block px-1 text-[11px] font-medium uppercase tracking-wide text-cream/60">
            Site activ
          </label>
          <Select
            value={currentTenant ?? ""}
            onValueChange={onTenantChange}
          >
            <SelectTrigger className="border-white/15 bg-white/10 text-warm-white">
              <SelectValue placeholder="Alege un site…" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.slug} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {superadmin ? (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-cream/50">
              Platformă
            </p>
            {PLATFORM_NAV.map((item) => (
              <NavItem key={item.href} item={item} onNavigate={onNavigate} />
            ))}
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-cream/50">
              Conținut site
            </p>
          </>
        ) : null}
        {contentNav.map((item) => (
          <NavItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Footer actions */}
      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <ConfirmDelete
          itemLabel="datele site-ului activ (revenire la conținutul inițial)"
          onConfirm={handleReset}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/80 transition-colors hover:bg-white/5 hover:text-warm-white"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              Resetează datele
            </button>
          }
        />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/80 transition-colors hover:bg-white/5 hover:text-warm-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Deconectare
        </button>
      </div>
    </div>
  );
}

function AuthPrompt() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Autentificare necesară
          </h1>
          <p className="text-sm text-muted-foreground">
            Nu ești conectat. Autentifică-te pentru a accesa panoul de
            administrare.
          </p>
          <Button asChild variant="gold" className="w-full">
            <Link href="/admin">Mergi la autentificare</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RestrictedNotice() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <h2 className="font-serif text-lg font-semibold text-primary">
          Acces restricționat
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Această secțiune este disponibilă doar administratorilor de
          platformă.
        </p>
        <Button asChild variant="gold" size="sm">
          <Link href="/admin/dashboard">Mergi la dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export interface AdminShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantSummary[]>([]);
  const [tenantsStarted, setTenantsStarted] = React.useState(false);
  const pathname = usePathname();

  // Subscribe so tenant-switcher / role changes re-render the shell.
  const session = useSession();

  // Client-mount flag without a mount effect (avoids hydration mismatch and the
  // set-state-in-effect anti-pattern). Server snapshot is false, client is true.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const authed = mounted && isLoggedIn();
  const superadmin = mounted && isSuperadmin();
  const currentTenant = mounted ? getCurrentTenant() : null;
  const userEmail = session.user?.email ?? "";

  // Load the tenant list once, for super-admins, on first client render —
  // without a mount effect that sets state (repo enforces
  // react-hooks/set-state-in-effect). On first load with no tenant selected,
  // default to the first tenant so the content modules have something to show.
  if (mounted && authed && superadmin && !tenantsStarted) {
    setTenantsStarted(true);
    void (async () => {
      const items = await listTenants();
      setTenants(items);
      if (!getCurrentTenant() && items.length > 0) {
        setCurrentTenant(items[0].slug);
        await refresh();
      }
    })();
  }

  function handleTenantChange(slug: string) {
    if (slug === getCurrentTenant()) return;
    setCurrentTenant(slug);
    void refresh();
  }

  if (!mounted) {
    // Avoid hydration mismatch: render nothing meaningful until client mount.
    return (
      <div className="min-h-screen bg-secondary">
        <Toaster />
      </div>
    );
  }

  if (!authed) {
    return (
      <>
        <AuthPrompt />
        <Toaster />
      </>
    );
  }

  const restricted = isPlatformRoute(pathname) && !superadmin;
  const avatarInitials = (userEmail.slice(0, 2) || "SO").toUpperCase();
  const sidebar = (
    <SidebarContent
      superadmin={superadmin}
      currentTenant={currentTenant}
      tenants={tenants}
      onTenantChange={handleTenantChange}
    />
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Deschide meniul"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Meniu administrare</SheetTitle>
                <SidebarContent
                  superadmin={superadmin}
                  currentTenant={currentTenant}
                  tenants={tenants}
                  onTenantChange={handleTenantChange}
                  onNavigate={() => setSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-serif text-lg font-semibold text-primary">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {currentTenant ? (
                <>
                  <Badge variant="success" className="hidden sm:inline-flex">
                    <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Site publicat
                  </Badge>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    <a
                      href={`/${currentTenant}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Vezi site-ul
                    </a>
                  </Button>
                </>
              ) : null}
              {restricted ? null : actions}
              {userEmail ? (
                <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground md:inline">
                  {userEmail}
                </span>
              ) : null}
              <Avatar>
                <AvatarFallback>{avatarInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            {restricted ? <RestrictedNotice /> : children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
