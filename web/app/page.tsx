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
  Landmark,
  Building2,
  Compass,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Reveal } from "@/components/shared/reveal";
import { SignupForm } from "@/components/public/signup-form";
import { getPackages, formatBani } from "@/lib/api";
import { cn } from "@/lib/utils";
import { IMG } from "@/lib/tenants/prispa/images";

export const metadata: Metadata = {
  title: "Siteora — Construiește digital orice destinație, eveniment sau instituție",
  description:
    "Un singur loc pentru site, conținut, program, parteneri, produse, bilete și promovare. Alegi o verticală — Events, Destinations, Culture, Institutions sau Experiences — și totul se adaptează automat.",
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
  { icon: Palette, title: "Identitate vizuală", desc: "Culori, logo și imagini, adaptate fiecărui eveniment." },
];

const verticals = [
  {
    icon: CalendarDays,
    name: "Siteora Events",
    desc: "festivaluri, competiții și evenimente",
  },
  {
    icon: Mountain,
    name: "Siteora Destinations",
    desc: "stațiuni și destinații turistice",
  },
  {
    icon: Landmark,
    name: "Siteora Culture",
    desc: "muzee, obiective și centre culturale",
  },
  {
    icon: Building2,
    name: "Siteora Institutions",
    desc: "instituții și administrații",
  },
  {
    icon: Compass,
    name: "Siteora Experiences",
    desc: "parcuri, trasee și atracții",
  },
];

const demos = [
  {
    slug: "prispa",
    name: "PRISPA",
    type: "Festival",
    tagline: "Festival de tradiții și gastronomie · Brașov",
    color: "#183C32",
    image: IMG.hero,
  },
  {
    slug: "poiana-marului",
    name: "Poiana Mărului",
    type: "Stațiune",
    tagline: "Zonă turistică de munte · Caraș-Severin",
    color: "#17414B",
    image: IMG.mountainLake,
  },
  {
    slug: "muzeul-satului-banatean",
    name: "Muzeul Satului Bănățean",
    type: "Muzeu",
    tagline: "Muzeu în aer liber · Timișoara",
    color: "#3A2E2A",
    image: IMG.village,
  },
];

const advantages = [
  "Un site public modern, rapid și responsive",
  "Panou de administrare complet, fără cod",
  "Arhitectură multi-tenant — mai multe evenimente, o platformă",
  "Terminologie și temă potrivite fiecărui tip (festival, stațiune, muzeu…)",
  "Optimizat pentru SEO și partajare pe social media",
  "Pregătit pentru integrare cu Supabase sau PostgreSQL",
];

export default async function FestivalHubLanding() {
  const packages = (await getPackages()) ?? [];

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
              Siteora
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/prispa">Festival demo</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin">
                  <LayoutDashboard className="h-4 w-4" />
                  Autentificare
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
                Construiește digital orice destinație, eveniment sau
                instituție.
              </h1>
            </Reveal>
            <Reveal delayIndex={2}>
              <p className="mt-4 text-sm italic text-cream/70">
                Build your destination, event or institution digitally.
              </p>
            </Reveal>
            <Reveal delayIndex={2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/85">
                Un singur loc pentru site, conținut, program, parteneri,
                produse, bilete și promovare. Alegi o verticală, iar
                terminologia, tema și structura se adaptează automat.
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
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                    Autentificare
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
                Tot ce îți trebuie pentru a-ți duce proiectul online
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/75">
                O singură platformă gestionează prezența digitală a
                evenimentului, destinației sau instituției tale: de la pagina de
                prezentare, la program, expozanți, produse, destinații și
                parteneri. Fără dezvoltatori, fără bătăi de cap.
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
                <p className="text-sm text-muted-foreground">Culori și identitate per proiect</p>
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
              Un modul pentru fiecare parte a evenimentului tău
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

      {/* Live demos — one engine, many verticals */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="success" className="mx-auto w-fit">
              <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
              3 site-uri demo live
            </Badge>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-primary sm:text-4xl">
              Un motor, mai multe tipuri de evenimente
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Aceleași unelte, adaptate fiecărui domeniu — de la festival la
              stațiune sau muzeu. Explorează-le pe toate trei.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {demos.map((d, i) => (
              <Reveal key={d.slug} delayIndex={i}>
                <Link
                  href={`/${d.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(32,37,34,0.10)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={d.image}
                      alt={d.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackLabel={d.name}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-warm-white"
                      style={{ backgroundColor: d.color }}
                    >
                      {d.type}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-xl font-semibold text-primary">
                      {d.name}
                    </h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {d.tagline}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
                      Vezi site-ul demo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline">
              <Link href="/admin/sites">
                Creează un site nou din panou
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Verticals */}
      <section className="bg-secondary py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
              Verticale Siteora
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
              O platformă, cinci verticale
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Alegi verticala potrivită, iar Siteora se adaptează automat
              proiectului tău — de la terminologie la structură și temă.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verticals.map((v) => (
              <Reveal
                key={v.name}
                className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="font-serif text-lg font-semibold text-primary">
                  {v.name}
                </h3>
                <p className="text-sm leading-relaxed text-charcoal/70">
                  {v.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing / packages */}
      {packages.length > 0 ? (
        <section id="pachete" className="bg-warm-white py-20 sm:py-28">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Pachete / Prețuri
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                Un plan pentru fiecare tip de eveniment
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Alege pachetul potrivit acum — poți trece oricând la un plan
                superior pe măsură ce evenimentul tău crește.
              </p>
            </div>

            <div className="mt-14 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, i) => {
                const onRequest = pkg.priceMonthlyBani === 0;
                return (
                  <Reveal
                    key={pkg.id}
                    delayIndex={i % 4}
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border bg-card p-6",
                      pkg.isFeatured
                        ? "border-terracotta ring-2 ring-terracotta/25 shadow-[0_12px_28px_rgba(32,37,34,0.10)]"
                        : "border-border"
                    )}
                  >
                    {pkg.isFeatured ? (
                      <Badge
                        variant="terracotta"
                        className="absolute -top-3 left-6"
                      >
                        Recomandat
                      </Badge>
                    ) : null}

                    <h3 className="font-serif text-xl font-semibold text-primary">
                      {pkg.label}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {pkg.tagline}
                    </p>

                    <div className="mt-5">
                      {onRequest ? (
                        <p className="font-serif text-3xl font-semibold text-primary">
                          La cerere
                        </p>
                      ) : (
                        <>
                          <p className="font-serif text-3xl font-semibold text-primary">
                            {formatBani(pkg.priceMonthlyBani, pkg.currency)}
                            <span className="text-base font-normal text-muted-foreground">
                              {" "}
                              /lună
                            </span>
                          </p>
                          {pkg.priceAnnualBani ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              sau {formatBani(pkg.priceAnnualBani, pkg.currency)}
                              /an
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {pkg.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                          <span className="text-sm text-charcoal/80">{b}</span>
                        </li>
                      ))}
                    </ul>

                    {pkg.seats ? (
                      <p className="mt-5 text-xs text-muted-foreground">
                        Include {pkg.seats}{" "}
                        {pkg.seats === 1 ? "utilizator" : "utilizatori"}
                      </p>
                    ) : null}

                    <Button
                      asChild
                      variant={pkg.isFeatured ? "gold" : "outline"}
                      className="mt-5 w-full"
                    >
                      <a href="#inscriere">Alege {pkg.label}</a>
                    </Button>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Signup / lead */}
      <section id="inscriere" className="bg-secondary py-20 sm:py-28">
        <Container>
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Înscriere
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                Începe cu Siteora
              </h2>
              <p className="mt-4 text-base leading-relaxed text-charcoal/75">
                Spune-ne despre evenimentul tău și te contactăm în cel mai scurt
                timp cu o propunere personalizată. Fără obligații.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Răspuns rapid din partea echipei",
                  "Configurare adaptată tipului tău de eveniment",
                  "Demo live și consultanță gratuită",
                ].map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-charcoal/80">{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <SignupForm />
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-cream sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold text-warm-white sm:text-4xl">
              Gata să-ți construiești site-ul?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-cream/85">
              Explorează cele trei demo-uri live și panoul de administrare.
              Totul este funcțional, cu date demonstrative.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link href="/prispa">Vezi un demo</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-warm-white hover:bg-white/15"
              >
                <Link href="/admin">Autentificare</Link>
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
              Siteora
            </p>
            <p>© {new Date().getFullYear()} Siteora. Demo pentru prezentare.</p>
            <div className="flex gap-6">
              <Link href="/prispa" className="hover:text-primary">Festival demo</Link>
              <Link href="/admin" className="hover:text-primary">Autentificare</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
