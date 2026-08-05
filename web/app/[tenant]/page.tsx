import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/public/sections/home-hero";
import { AboutSection } from "@/components/public/sections/about-section";
import { ExperiencesSection } from "@/components/public/sections/experiences-section";
import { DestinationsSection } from "@/components/public/sections/destinations-section";
import { NewsletterSection } from "@/components/public/sections/newsletter-section";
import { ProgramSchedule } from "@/components/public/program-schedule";
import { ExhibitorCard } from "@/components/public/cards/exhibitor-card";
import { ProductCard } from "@/components/public/cards/product-card";
import { ArticleCard } from "@/components/public/cards/article-card";
import { Carousel } from "@/components/public/carousel";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PartnerLogo } from "@/components/shared/partner-logo";
import { Reveal } from "@/components/shared/reveal";
import { formatDateRange } from "@/lib/utils";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;
  const visible = (id: string) =>
    config.sections.find((s) => s.id === id)?.visible ?? true;

  const featuredExhibitors = content.exhibitors
    .filter((e) => e.featured && e.status === "published")
    .slice(0, 6);
  const featuredProducts = content.products
    .filter((p) => p.featured && p.status === "published")
    .slice(0, 4);
  const homePartners = content.partners
    .filter((p) => p.featuredOnHome && p.status === "published")
    .sort((a, b) => a.order - b.order);
  const latestArticles = content.articles
    .filter((a) => a.status === "published")
    .slice(0, 3);
  const galleryPreview = content.gallery.slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Festival",
    name: config.info.name,
    description: config.info.shortDescription,
    startDate: config.info.startDate,
    endDate: config.info.endDate,
    image: config.info.heroImage,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: config.info.locationName,
      address: {
        "@type": "PostalAddress",
        addressLocality: config.info.city,
        addressRegion: config.info.county,
        addressCountry: "RO",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Asociația PRISPA",
      url: config.social.website,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {visible("hero") && (
        <HomeHero
          info={config.info}
          slug={slug}
          labels={config.labels}
          eventType={config.eventType}
        />
      )}

      {visible("about") && (
        <AboutSection
          description={config.info.longDescription}
          stats={config.stats}
          labels={config.labels}
        />
      )}

      {visible("experiences") && (
        <ExperiencesSection
          experiences={config.experiences}
          labels={config.labels}
        />
      )}

      {visible("program") && (
        <section id="program" className="bg-warm-white py-16 sm:py-24">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={L("programEyebrow", "Program")}
                title={L("programTitle", "Trei zile, zeci de momente")}
                description={L(
                  "programDescription",
                  `${formatDateRange(
                    config.info.startDate,
                    config.info.endDate
                  )} · ${config.info.locationName}, ${config.info.city}`
                )}
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/program`}>
                  Programul complet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10">
              <ProgramSchedule events={content.program} limitPerDay={4} />
            </div>
          </Container>
        </section>
      )}

      {visible("exhibitors") && (
        <section id="expozanti" className="bg-secondary py-16 sm:py-24">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={L("exhibitorsEyebrow", "Expozanți și producători")}
                title={L(
                  "exhibitorsTitle",
                  "Oameni cu poveste, produse cu suflet"
                )}
                description={L(
                  "exhibitorsDescription",
                  "Peste 100 de producători și meșteșugari din toată țara, aleși pe sprânceană."
                )}
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/expozanti`}>
                  Toți expozanții
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Reveal className="mt-10">
              <Carousel
                ariaLabel="Expozanți evidențiați"
                slideClassName="basis-[80%] sm:basis-[47%] lg:basis-1/3"
              >
                {featuredExhibitors.map((e) => (
                  <ExhibitorCard key={e.id} exhibitor={e} slug={slug} />
                ))}
              </Carousel>
            </Reveal>
          </Container>
        </section>
      )}

      {visible("products") && (
        <section id="produse" className="bg-warm-white py-16 sm:py-24">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={L("productsEyebrow", "Produse locale")}
                title={L("productsTitle", "Gusturi cu origine cunoscută")}
                description={L(
                  "productsDescription",
                  "Fiecare produs are un producător, un loc și o poveste. Descoperă-le."
                )}
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/produse`}>
                  Toate produsele
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Reveal className="mt-10">
              <Carousel
                ariaLabel="Produse evidențiate"
                slideClassName="basis-[68%] sm:basis-[42%] lg:basis-1/4"
              >
                {featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} slug={slug} />
                ))}
              </Carousel>
            </Reveal>
          </Container>
        </section>
      )}

      {visible("destinations") && (
        <DestinationsSection
          destinations={content.destinations}
          slug={slug}
          labels={config.labels}
        />
      )}

      {visible("partners") && homePartners.length > 0 && (
        <section id="parteneri" className="bg-secondary py-20 sm:py-24">
          <Container>
            <SectionHeading
              align="center"
              eyebrow={L("partnersEyebrow", "Parteneri și sponsori")}
              title={L("partnersTitle", "Alături de noi")}
              description={L(
                "partnersDescription",
                "Festivalul PRISPA este posibil datorită partenerilor care cred în satul românesc."
              )}
            />
            <Carousel
              ariaLabel="Parteneri și sponsori"
              className="mx-auto mt-12 max-w-5xl"
              slideClassName="basis-[78%] sm:basis-[45%] lg:basis-1/3"
            >
              {homePartners.map((p) => (
                <div
                  key={p.id}
                  className="flex h-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4"
                >
                  <PartnerLogo logo={p.logo} name={p.name} className="h-11 w-11 text-base" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-charcoal">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.tier}</p>
                  </div>
                </div>
              ))}
            </Carousel>
            <div className="mt-10 text-center">
              <Button asChild variant="ghost">
                <Link href={`/${slug}/parteneri`}>
                  Vezi toți partenerii
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}

      {visible("gallery") && (
        <section id="galerie" className="bg-warm-white py-16 sm:py-24">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={L("galleryEyebrow", "Galerie")}
                title={L("galleryTitle", "Festivalul, în imagini")}
                description={L(
                  "galleryDescription",
                  "Momente din edițiile trecute: gastronomie, tradiții, concerte și natură."
                )}
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/galerie`}>
                  Toată galeria
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Carousel
              ariaLabel="Galerie foto"
              className="mt-10"
              slideClassName="basis-[62%] sm:basis-[38%] lg:basis-1/4"
            >
              {galleryPreview.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                >
                  <ImageWithFallback
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 25vw"
                    fallbackLabel={img.category}
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
                </div>
              ))}
            </Carousel>
          </Container>
        </section>
      )}

      {visible("news") && (
        <section id="noutati" className="bg-secondary py-16 sm:py-24">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={L("newsEyebrow", "Noutăți și povești")}
                title={L("newsTitle", "De citit înainte de festival")}
                description={L(
                  "newsDescription",
                  "Poveștile producătorilor, ghiduri și interviuri din lumea PRISPA."
                )}
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/noutati`}>
                  Toate articolele
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Reveal className="mt-10">
              <Carousel
                ariaLabel="Noutăți și povești"
                slideClassName="basis-[84%] sm:basis-[47%] lg:basis-1/3"
              >
                {latestArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} slug={slug} />
                ))}
              </Carousel>
            </Reveal>
          </Container>
        </section>
      )}

      {visible("newsletter") && <NewsletterSection />}
    </>
  );
}
