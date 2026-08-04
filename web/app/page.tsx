import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  Store,
  CalendarDays,
  MapPin,
  Image as ImageIcon,
  Newspaper,
  Handshake,
  Palette,
  Globe,
  BarChart3,
  Check,
  Sparkles,
  UtensilsCrossed,
  Mountain,
  Music,
  Tent,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Reveal } from "@/components/shared/reveal";
import { prispaTenant } from "@/lib/tenants/prispa";
import { formatDateRange } from "@/lib/utils";
import { IMG } from "@/lib/tenants/prispa/images";

export const metadata: Metadata = {
  title: "Festival Hub — Festivalul tău, o experiență digitală completă",
  description:
    "Platforma multi-tenant care transformă festivalurile, târgurile și evenimentele culturale, gastronomice și turistice într-un site modern și un panou de administrare complet.",
};

const modules = [
  { icon: LayoutDashboard, title: "Pagini și secțiuni", desc: "Editează conținutul site-ului, activează sau reordonează secțiunile." },
  { icon: CalendarDays, title: "Program", desc: "Construiește programul pe zile, scene și categorii." },
  { icon: Store, title: "Expozanți", desc: "Gestionează producători și meșteșugari, cu pagini dedicate." },
  { icon: UtensilsCrossed, title: "Produse", desc: "Prezintă produsele locale cu poveste și fotografii." },
  { icon: MapPin, title: "Destinații turistice", desc: "Pune în valoare regiunile și experiențele turistice." },
  { icon: Handshake, title: "Parteneri și sponsori", desc: "Organizează partenerii pe niveluri și categorii." },
  { icon: ImageIcon, title: "Galerie", desc: "Grid editorial cu filtre și lightbox." },
  { icon: Newspaper, title: "Noutăți", desc: "Publică articole, povești și interviuri." },
  { icon: Palette, title: "Identitate vizuală", desc: "Culori, logo și imagini, adaptate fiecărui festival." },
];

const eventTypes = [
  { icon: UtensilsCrossed, label: "Festivaluri gastronomice" },
  { icon: Tent, label: "Târguri și piețe" },
  { icon: Mountain, label: "Turism și tradiții" },
  { icon: Music, label: "Evenimente culturale" },
];

const advantages = [
  "Un site public modern, rapid și responsive",
  "Panou de administrare complet, fără cod",
  "Arhitectură multi-tenant — mai multe festivaluri, o platformă",
  "Identitate vizuală proprie pentru fiecare eveniment",
  "Optimizat pentru SEO și partajare pe social media",
  "Pregătit pentru integrare cu Supabase sau PostgreSQL",
];

export default function FestivalHubLanding() {
  const info = prispaTenant.config.info;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-warm-white/85 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              Festival Hub
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/prispa">Festival demo</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/demo-admin">
                  <LayoutDashboard className="h-4 w-4" />
                  Panou admin
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-cream">
        <div className="absolute inset-0 opacity-25">
          <ImageWithFallback
            src={IMG.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary" />
        <Container className="relative z-10 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Badge variant="gold" className="bg-gold/20 text-gold">
                Platformă SaaS multi-tenant
              </Badge>
            </Reveal>
            <Reveal delayIndex={1}>
              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-warm-white sm:text-6xl">
                Festivalul tău. O experiență digitală completă.
              </h1>
            </Reveal>
            <Reveal delayIndex={2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/85">
                Festival Hub le oferă organizatorilor un site public spectaculos
                și un panou de administrare complet — pentru festivaluri,
                târguri și evenimente gastronomice, culturale și turistice.
              </p>
            </Reveal>
            <Reveal delayIndex={3}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="gold">
                  <Link href="/prispa">
                    Vezi festivalul demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-warm-white hover:bg-white/15"
                >
                  <Link href="/demo-admin">
                    <LayoutDashboard className="h-4 w-4" />
                    Deschide panoul de administrare
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Advantages */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Pentru organizatori
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                Tot ce îți trebuie pentru a-ți duce festivalul online
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/75">
                O singură platformă gestionează prezența digitală a evenimentului
                tău: de la pagina de prezentare, la program, expozanți, produse,
                destinații și parteneri. Fără dezvoltatori, fără bătăi de cap.
              </p>
              <ul className="mt-8 space-y-3">
                {advantages.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-charcoal/80">{a}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delayIndex={1} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Globe className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-serif text-lg font-semibold text-primary">Site public</p>
                  <p className="text-sm text-muted-foreground">Modern, rapid, responsive</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                <BarChart3 className="h-6 w-6 text-terracotta" />
                <p className="font-serif text-lg font-semibold text-primary">Dashboard</p>
                <p className="text-sm text-muted-foreground">Statistici și conținut într-un loc</p>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                <Palette className="h-6 w-6 text-gold" />
                <p className="font-serif text-lg font-semibold text-primary">Brand propriu</p>
                <p className="text-sm text-muted-foreground">Culori și identitate per festival</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Modules */}
      <section className="bg-secondary py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
              Module disponibile
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
              Un modul pentru fiecare parte a festivalului
            </h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <Reveal
                key={m.title}
                delayIndex={i % 3}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <m.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-primary">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/70">
                  {m.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Active festival preview: PRISPA */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <Reveal className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
            <div className="relative min-h-[300px]">
              <ImageWithFallback
                src={info.heroImage}
                alt={info.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                fallbackLabel={info.name}
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <Badge variant="success" className="w-fit">
                <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
                Festival activ
              </Badge>
              <h2 className="mt-5 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {info.name}
              </h2>
              <p className="mt-2 text-sm font-medium text-terracotta">
                {formatDateRange(info.startDate, info.endDate)} · {info.locationName}, {info.city}
              </p>
              <p className="mt-4 text-base leading-relaxed text-charcoal/75">
                {info.shortDescription}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/prispa">
                    Vezi festivalul demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/demo-admin">Deschide panoul admin</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Event types */}
      <section className="bg-secondary py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold text-primary sm:text-4xl">
              Pentru orice tip de eveniment
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Festival Hub se adaptează oricărui eveniment care aduce oameni,
              produse și locuri împreună.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
            {eventTypes.map((e) => (
              <div
                key={e.label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <e.icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium text-charcoal">{e.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-cream sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold text-warm-white sm:text-4xl">
              Gata să-ți duci festivalul online?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-cream/85">
              Explorează demo-ul PRISPA și panoul de administrare. Totul este
              funcțional, cu date demonstrative.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/prispa">Vezi festivalul demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-warm-white hover:bg-white/15"
              >
                <Link href="/demo-admin">Deschide panoul admin</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-border bg-warm-white py-10">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p className="flex items-center gap-2 font-serif text-lg font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Festival Hub
            </p>
            <p>© {new Date().getFullYear()} Festival Hub. Demo pentru prezentare.</p>
            <div className="flex gap-6">
              <Link href="/prispa" className="hover:text-primary">Festival demo</Link>
              <Link href="/demo-admin" className="hover:text-primary">Panou admin</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
