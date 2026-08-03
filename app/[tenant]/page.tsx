import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTenant } from "@/lib/tenants";
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
import { GalleryGrid } from "@/components/public/gallery-grid";
import { PartnerLogo } from "@/components/shared/partner-logo";
import { Reveal } from "@/components/shared/reveal";
import { formatDateRange } from "@/lib/utils";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = getTenant(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
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

      {visible("hero") && <HomeHero info={config.info} slug={slug} />}

      {visible("about") && (
        <AboutSection
          description={config.info.longDescription}
          stats={config.stats}
        />
      )}

      {visible("experiences") && (
        <ExperiencesSection experiences={config.experiences} />
      )}

      {visible("program") && (
        <section id="program" className="bg-warm-white py-20 sm:py-28">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Program"
                title="Trei zile, zeci de momente"
                description={`${formatDateRange(
                  config.info.startDate,
                  config.info.endDate
                )} · ${config.info.locationName}, ${config.info.city}`}
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
        <section id="expozanti" className="bg-secondary py-20 sm:py-28">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Expozanți și producători"
                title="Oameni cu poveste, produse cu suflet"
                description="Peste 100 de producători și meșteșugari din toată țara, aleși pe sprânceană."
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/expozanti`}>
                  Toți expozanții
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredExhibitors.map((e) => (
                <ExhibitorCard key={e.id} exhibitor={e} slug={slug} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {visible("products") && (
        <section id="produse" className="bg-warm-white py-20 sm:py-28">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Produse locale"
                title="Gusturi cu origine cunoscută"
                description="Fiecare produs are un producător, un loc și o poveste. Descoperă-le."
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/produse`}>
                  Toate produsele
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {visible("destinations") && (
        <DestinationsSection destinations={content.destinations} slug={slug} />
      )}

      {visible("partners") && homePartners.length > 0 && (
        <section id="parteneri" className="bg-secondary py-20 sm:py-24">
          <Container>
            <SectionHeading
              align="center"
              eyebrow="Parteneri și sponsori"
              title="Alături de noi"
              description="Festivalul PRISPA este posibil datorită partenerilor care cred în satul românesc."
            />
            <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-4">
              {homePartners.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4"
                >
                  <PartnerLogo logo={p.logo} name={p.name} className="h-11 w-11 text-base" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-charcoal">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.tier}</p>
                  </div>
                </div>
              ))}
            </div>
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
        <section id="galerie" className="bg-warm-white py-20 sm:py-28">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Galerie"
                title="Festivalul, în imagini"
                description="Momente din edițiile trecute: gastronomie, tradiții, concerte și natură."
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/galerie`}>
                  Toată galeria
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10">
              <GalleryGrid images={galleryPreview} filterable={false} />
            </div>
          </Container>
        </section>
      )}

      {visible("news") && (
        <section id="noutati" className="bg-secondary py-20 sm:py-28">
          <Container>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Noutăți și povești"
                title="De citit înainte de festival"
                description="Poveștile producătorilor, ghiduri și interviuri din lumea PRISPA."
              />
              <Button asChild variant="outline">
                <Link href={`/${slug}/noutati`}>
                  Toate articolele
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((a, i) => (
                <Reveal key={a.id} delayIndex={i % 3} as="article">
                  <ArticleCard article={a} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {visible("newsletter") && <NewsletterSection />}
    </>
  );
}
