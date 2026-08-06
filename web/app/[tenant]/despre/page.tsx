import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sparkles, Heart, Leaf, ShieldCheck } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Icon } from "@/components/shared/icon";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PageHero } from "@/components/public/page-hero";
import { formatDateRange } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = `Despre ${info.name}`;
  const description = info.shortDescription;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [info.heroImage],
    },
  };
}

const VALUES = [
  {
    icon: Heart,
    title: "Autenticitate",
    description:
      "Rămânem fideli locului și poveștii lui, cu grijă pentru detalii și pentru ceea ce ne face aparte.",
  },
  {
    icon: Leaf,
    title: "Sustenabilitate",
    description:
      "Ne pasă de comunitatea din jur și de mediul în care ne desfășurăm, cu respect pentru resurse.",
  },
  {
    icon: ShieldCheck,
    title: "Încredere",
    description:
      "Ținem la relații corecte și transparente, ca fiecare vizitator să știe la ce să se aștepte.",
  },
  {
    icon: Sparkles,
    title: "Bucurie",
    description:
      "Ne dorim ca fiecare experiență să lase în urmă o amintire bună și dorința de a reveni.",
  },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, slug } = t;
  const { info, stats, experiences } = config;
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  const aboutImage = info.aboutImage?.trim() || info.heroImage;
  const place = [info.locationName?.trim(), info.city?.trim()]
    .filter(Boolean)
    .join(", ");
  const dates =
    info.startDate && info.endDate
      ? formatDateRange(info.startDate, info.endDate)
      : "";
  const locationLine = [place, dates].filter(Boolean).join(" · ");

  return (
    <>
      <PageHero
        eyebrow="Povestea noastră"
        title={`Despre ${info.name}`}
        description={info.tagline}
        image={info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Despre" }]}
      />

      {/* Intro + long description */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                {L("aboutEyebrow", "Despre")}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {L("aboutTitle", info.name)}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/75">
                {info.longDescription}
              </p>
              {locationLine && (
                <p className="mt-4 text-base leading-relaxed text-charcoal/75">
                  {locationLine}
                </p>
              )}
            </Reveal>
            <Reveal delayIndex={1} className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                <ImageWithFallback
                  src={aboutImage}
                  alt={info.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  fallbackLabel={info.name}
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="bg-secondary py-20 sm:py-24">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="În cifre"
              title={`${info.name}, dintr-o privire`}
            />
            <dl className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal
                key={s.label}
                delayIndex={i % 4}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <dd className="font-serif text-3xl font-semibold text-primary">
                  {s.value}
                </dd>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
              </Reveal>
            ))}
            </dl>
          </Container>
        </section>
      )}

      {/* Misiune & valori */}
      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Misiunea noastră
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                Să avem grijă de acest loc și de oamenii lui
              </h2>
              <p className="mt-5 text-base leading-relaxed text-charcoal/75">
                {info.shortDescription}
              </p>
              <p className="mt-4 text-base leading-relaxed text-charcoal/75">
                Ne dorim ca fiecare vizitator să plece cu o amintire bună, o
                poveste nouă și dorința de a reveni.
              </p>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              {VALUES.map((v, i) => (
                <Reveal
                  key={v.title}
                  delayIndex={i % 2}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-serif text-xl font-semibold text-primary">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                    {v.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Experiences grid */}
      {experiences.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              align="center"
              eyebrow={L("experiencesEyebrow", "Experiențe")}
              title={L("experiencesTitle", "Ce te așteaptă")}
              description={L("experiencesDescription", info.shortDescription)}
            />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((exp, i) => (
              <Reveal
                key={exp.id}
                delayIndex={i % 3}
                className="group overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={exp.image}
                    alt={exp.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallbackLabel={exp.title}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-warm-white/95 text-primary backdrop-blur">
                    <Icon name={exp.icon} className="h-5 w-5" />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-primary">
                    {exp.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                    {exp.description}
                  </p>
                </div>
              </Reveal>
            ))}
            </div>
          </Container>
        </section>
      )}

      {/* Termeni și confidențialitate */}
      <section id="termeni" className="bg-warm-white py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="Informații legale"
              title="Termeni și confidențialitate"
              description="Câteva precizări despre modul în care folosim datele și despre natura acestei platforme."
            />
            <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-charcoal/70 sm:p-8">
              <p>
                Această platformă este o prezentare demonstrativă pentru{" "}
                {info.name}. Conținutul (informații, imagini și program) are rol
                ilustrativ și poate fi actualizat pe parcurs.
              </p>
              <p>
                <span className="font-semibold text-primary">
                  Confidențialitate.
                </span>{" "}
                Formularele de contact și de abonare la newsletter funcționează
                în regim demonstrativ — datele introduse nu părăsesc browserul și
                nu sunt stocate pe un server.
              </p>
              <p>
                <span className="font-semibold text-primary">Termeni.</span>{" "}
                Programul și informațiile afișate se pot modifica. Pentru detalii
                oficiale și confirmări, te rugăm să ne contactezi direct.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
