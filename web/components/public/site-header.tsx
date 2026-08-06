"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { NavItem } from "@/lib/tenants/types";

export function SiteHeader({
  slug,
  logoText,
  navigation,
  ctaLabel = "Vezi programul",
}: {
  slug: string;
  logoText: string;
  navigation: NavItem[];
  /** Header CTA label — vertical-aware (e.g. "Vezi evenimentele" for resorts). */
  ctaLabel?: string;
}) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const base = `/${slug}`;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === `${base}${href}`;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-warm-white/90 shadow-[0_1px_0_rgba(32,37,34,0.06)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link
            href={base}
            className={cn(
              "font-serif text-2xl font-semibold tracking-tight transition-colors",
              scrolled ? "text-primary" : "text-warm-white"
            )}
          >
            {logoText}
            <span
              className={cn(
                "ml-1 align-super text-[10px] font-sans font-medium tracking-widest",
                scrolled ? "text-terracotta" : "text-gold"
              )}
            >
              FEST
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-charcoal/80 hover:bg-primary/5 hover:text-primary"
                    : "text-warm-white/90 hover:bg-white/10 hover:text-warm-white",
                  isActive(item.href) &&
                    (scrolled ? "text-primary" : "text-warm-white")
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant={scrolled ? "default" : "gold"}
              className="hidden sm:inline-flex"
            >
              <Link href={`${base}/program`}>
                <CalendarDays className="h-4 w-4" />
                {ctaLabel}
              </Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "lg:hidden",
                    scrolled ? "text-primary" : "text-warm-white hover:bg-white/10"
                  )}
                  aria-label="Deschide meniul"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b border-border p-6">
                    <SheetTitle className="font-serif text-2xl text-primary">
                      {logoText}
                    </SheetTitle>
                  </div>
                  <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                    <SheetClose asChild>
                      <Link
                        href={base}
                        className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary"
                      >
                        Acasă
                      </Link>
                    </SheetClose>
                    {navigation.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={`${base}${item.href}`}
                          className={cn(
                            "rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary",
                            isActive(item.href) && "bg-secondary text-primary"
                          )}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="border-t border-border p-4">
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href={`${base}/program`}>
                          <CalendarDays className="h-4 w-4" />
                          {ctaLabel}
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  );
}
