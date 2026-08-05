"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  LayoutTemplate,
  CalendarDays,
  Store,
  ShoppingBasket,
  MapPin,
  Handshake,
  Image as ImageIcon,
  Images,
  Newspaper,
  Mail,
  Send,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
  RotateCcw,
  CreditCard,
  Inbox,
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
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { isLoggedIn, logoutDemo, resetDemoData } from "@/lib/admin/store";
import { toast } from "sonner";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV: NavLink[] = [
  { label: "Dashboard", href: "/demo-admin/dashboard", icon: LayoutDashboard },
  { label: "Site-uri", href: "/demo-admin/sites", icon: Building2 },
  { label: "Abonamente", href: "/demo-admin/subscriptions", icon: CreditCard },
  { label: "Solicitări", href: "/demo-admin/leads", icon: Inbox },
  { label: "Pagini și secțiuni", href: "/demo-admin/pages", icon: LayoutTemplate },
  { label: "Program", href: "/demo-admin/program", icon: CalendarDays },
  { label: "Expozanți", href: "/demo-admin/exhibitors", icon: Store },
  { label: "Produse", href: "/demo-admin/products", icon: ShoppingBasket },
  { label: "Destinații", href: "/demo-admin/destinations", icon: MapPin },
  { label: "Parteneri", href: "/demo-admin/partners", icon: Handshake },
  { label: "Galerie", href: "/demo-admin/gallery", icon: ImageIcon },
  { label: "Bibliotecă media", href: "/demo-admin/media", icon: Images },
  { label: "Noutăți", href: "/demo-admin/news", icon: Newspaper },
  { label: "Mesaje", href: "/demo-admin/messages", icon: Mail },
  { label: "Newsletter", href: "/demo-admin/newsletter", icon: Send },
  { label: "Setări", href: "/demo-admin/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleReset() {
    resetDemoData();
    toast.success("Datele demo au fost resetate.");
    onNavigate?.();
  }

  function handleLogout() {
    logoutDemo();
    onNavigate?.();
    router.push("/demo-admin");
  }

  return (
    <div className="flex h-full flex-col bg-primary text-cream">
      {/* Brand */}
      <div className="px-5 py-6">
        <Link
          href="/demo-admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2"
        >
          <span className="font-serif text-lg font-semibold text-warm-white">
            Siteora
          </span>
          <Badge variant="gold">PRISPA</Badge>
        </Link>
        <p className="mt-3 text-[11px] leading-snug text-cream/70">
          Mediu demonstrativ — datele sunt salvate doar în browser
          (localStorage).
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
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
        })}
      </nav>

      {/* Footer actions */}
      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <ConfirmDelete
          itemLabel="toate datele demo (revenire la conținutul inițial)"
          onConfirm={handleReset}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/80 transition-colors hover:bg-white/5 hover:text-warm-white"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              Resetează datele demo
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
            Nu ești conectat la panoul demonstrativ. Aceasta este o
            demonstrație — nu există autentificare reală sau securitate.
          </p>
          <Button asChild variant="gold" className="w-full">
            <Link href="/demo-admin">Mergi la autentificare</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
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
  // Client-mount flag without a mount effect (avoids hydration mismatch and the
  // set-state-in-effect anti-pattern). Server snapshot is false, client is true.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const authed = mounted && isLoggedIn();

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

  return (
    <div className="min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
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
                <SidebarContent onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-serif text-lg font-semibold text-primary">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
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
                <a href="/prispa" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Vezi site-ul
                </a>
              </Button>
              {actions}
              <Avatar>
                <AvatarFallback>AP</AvatarFallback>
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
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
