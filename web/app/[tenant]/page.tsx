import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { HomeHero } from "@/components/public/sections/home-hero";
import { AboutSection } from "@/components/public/sections/about-section";
import { ConditionsWidget } from "@/components/public/sections/conditions-widget";
import { TrailsMap } from "@/components/public/sections/trails-map";
import { ExperiencesSection } from "@/components/public/sections/experiences-section";
import { DestinationsSection } from "@/components/public/sections/destinations-section";
import { NewsletterSection } from "@/components/public/sections/newsletter-section";
import { CustomSection } from "@/components/public/sections/custom-section";
import { EventFeature } from "@/components/public/sections/event-feature";
import { ProgramSchedule } from "@/components/public/program-schedule";
import { ExhibitorCard } from "@/components/public/cards/exhibitor-card";
import { AccommodationCard } from "@/components/public/cards/accommodation-card";
import { RestaurantCard } from "@/components/public/cards/restaurant-card";
import { EventCard } from "@/components/public/cards/event-card";
import { ProductCard } from "@/components/public/cards/product-card";
import { ArticleCard } from "@/components/public/cards/article-card";
import { Carousel } from "@/components/public/carousel";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { PartnerLogo } from "@/components/shared/partner-logo";
import { Reveal } from "@/components/shared/reveal";
import { formatDateRange } from "@/lib/utils";
import { tenantPublicUrl } from "@/lib/seo";
import { JsonLd, siteJsonLd } from "@/lib/jsonld";

export default async function TenantHome({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const isResort = config.eventType === "resort";
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  const featuredExhibitors = content.exhibitors
    .filter((e) => e.featured && e.status === "published")
    .slice(0, 6);
  const featuredProducts = content.products
    .filter((p) => p.featured && p.status === "published")
    .slice(0, 4);
  // Resort "Cazare & gazde" zone shows real accommodations (featured first).
  // Camping is split into its own "Campinguri" section, so exclude it here to
  // avoid duplication.
  const featuredAccommodations = content.accommodations
    .filter((a) => a.status === "published" && a.type !== "camping")
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);
  // Resort "Restaurante" zone shows featured/published restaurants.
  const featuredRestaurants = (content.restaurants ?? [])
    .filter((r) => r.status === "published")
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);
  // Resort "Evenimente" zone shows featured/published events.
  const featuredEvents = (content.events ?? [])
    .filter((e) => e.status === "published")
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);
  const homePartners = content.partners
    .filter((p) => p.featuredOnHome && p.status === "published")
    .sort((a, b) => a.order - b.order);
  const latestArticles = content.articles
    .filter((a) => a.status === "published")
    .slice(0, 3);
  const galleryPreview = content.gallery.slice(0, 8);

  // Vertical-aware primary schema (Festival / Resort / Museum / LocalBusiness…).
  const homeUrl = await tenantPublicUrl(t, "/");
  const jsonLd = siteJsonLd(t, homeUrl);

  // Render one built-in homepage section by id. Returns null when the section
  // has no content to show, so ordering + visibility can be data-driven.
  const renderSection = (id: string): ReactNode => {
    switch (id) {
      case "hero":
        return (
          <HomeHero
            info={config.info}
            slug={slug}
            labels={config.labels}
            eventType={config.eventType}
          />
        );

      case "about":
        return (
          <AboutSection
            description={config.info.longDescription}
            stats={config.stats}
            labels={config.labels}
            image={config.info.aboutImage}
            image2={config.info.aboutImage2}
          />
        );

      case "experiences":
        return config.experiences.length > 0 ? (
          <ExperiencesSection
            experiences={config.experiences}
            labels={config.labels}
          />
        ) : null;

      // Resort-only widgets, ordered + toggled like every other section.
      case "conditions":
        return isResort ? (
          <ConditionsWidget conditions={config.conditions} />
        ) : null;

      case "trails":
        return isResort ? <TrailsMap trails={config.trails} /> : null;

      case "program":
        return content.program.length > 0 ? (
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
        ) : null;

      // Resorts render their real accommodations in this slot; other verticals
      // show exhibitors/producers.
      case "exhibitors":
        if (isResort) {
          return featuredAccommodations.length > 0 ? (
            <section id="cazare" className="bg-secondary py-16 sm:py-24">
              <Container>
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                  <SectionHeading
                    eyebrow={L("exhibitorsEyebrow", "Cazare & gazde")}
                    title={L("exhibitorsTitle", "Unde stai")}
                    description={L(
                      "exhibitorsDescription",
                      "Cabane, pensiuni și case de oaspeți, alese pentru tine."
                    )}
                  />
                  <Button asChild variant="outline">
                    <Link href={`/${slug}/cazari`}>
                      Toate cazările
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {/* Pe telefon rămâne caruselul (se trage cu degetul). Pe
                    desktop devine grilă pe două rânduri: caruselul arăta trei
                    cazări o dată, deși secțiunea are șase. Se randează ambele
                    și se comută din CSS — cardurile ascunse au imagini lazy,
                    deci varianta nefolosită nu descarcă nimic. */}
                <Reveal className="mt-10">
                  <div className="lg:hidden">
                    <Carousel
                      ariaLabel="Cazări evidențiate"
                      slideClassName="basis-[80%] sm:basis-[47%]"
                    >
                      {featuredAccommodations.map((a) => (
                        <AccommodationCard
                          key={a.id}
                          accommodation={a}
                          slug={slug}
                        />
                      ))}
                    </Carousel>
                  </div>
                  <div className="hidden gap-6 lg:grid lg:grid-cols-3">
                    {featuredAccommodations.map((a) => (
                      <AccommodationCard
                        key={a.id}
                        accommodation={a}
                        slug={slug}
                      />
                    ))}
                  </div>
                </Reveal>
              </Container>
            </section>
          ) : null;
        }
        return featuredExhibitors.length > 0 ? (
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
        ) : null;

      // Resort-only gastronomy zone.
      case "restaurants":
        if (!isResort) return null;
        return featuredRestaurants.length > 0 ? (
          <section id="restaurante" className="bg-warm-white py-16 sm:py-24">
            <Container>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow={L("restaurantsEyebrow", "Gastronomie")}
                  title={L("restaurantsTitle", "Unde mănânci")}
                  description={L(
                    "restaurantsDescription",
                    "Restaurante și localuri din zonă."
                  )}
                />
                <Button asChild variant="outline">
                  <Link href={`/${slug}/restaurante`}>
                    Vezi toate
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Reveal className="mt-10">
                <Carousel
                  ariaLabel="Restaurante evidențiate"
                  slideClassName="basis-[80%] sm:basis-[47%] lg:basis-1/3"
                >
                  {featuredRestaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} slug={slug} />
                  ))}
                </Carousel>
              </Reveal>
            </Container>
          </section>
        ) : null;

      // Resort-only events zone.
      case "events":
        if (!isResort) return null;
        return featuredEvents.length > 0 ? (
          <section id="evenimente" className="bg-secondary py-16 sm:py-24">
            <Container>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow={L("eventsEyebrow", "Ce se întâmplă")}
                  title={L("eventsTitle", "Evenimente")}
                  description={L(
                    "eventsDescription",
                    "Evenimentele din stațiune."
                  )}
                />
                <Button asChild variant="outline">
                  <Link href={`/${slug}/evenimente`}>
                    Vezi toate
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <Reveal className="mt-10">
                {featuredEvents.length === 1 ? (
                  <EventFeature event={featuredEvents[0]} slug={slug} />
                ) : (
                  <Carousel
                    ariaLabel="Evenimente evidențiate"
                    slideClassName="basis-[80%] sm:basis-[47%] lg:basis-1/3"
                  >
                    {featuredEvents.map((e) => (
                      <EventCard key={e.id} event={e} slug={slug} />
                    ))}
                  </Carousel>
                )}
              </Reveal>
            </Container>
          </section>
        ) : null;

      case "products":
        return featuredProducts.length > 0 ? (
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
        ) : null;

      case "destinations":
        return content.destinations.length > 0 ? (
          <DestinationsSection
            destinations={content.destinations}
            slug={slug}
            labels={config.labels}
          />
        ) : null;

      case "partners":
        return homePartners.length > 0 ? (
          <section id="parteneri" className="bg-secondary py-20 sm:py-24">
            <Container>
              <SectionHeading
                align="center"
                eyebrow={L("partnersEyebrow", "Parteneri și sponsori")}
                title={L("partnersTitle", "Alături de noi")}
                description={L(
                  "partnersDescription",
                  "Susținut de partenerii care cred în acest loc."
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
                    <PartnerLogo
                      logo={p.logo}
                      name={p.name}
                      className="h-11 w-11 text-base"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-charcoal">
                        {p.name}
                      </p>
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
        ) : null;

      case "gallery":
        return galleryPreview.length > 0 ? (
          <section id="galerie" className="bg-warm-white py-16 sm:py-24">
            <Container>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow={L("galleryEyebrow", "Galerie")}
                  title={L("galleryTitle", "În imagini")}
                  description={L(
                    "galleryDescription",
                    "Momente din edițiile trecute."
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
        ) : null;

      case "news":
        return latestArticles.length > 0 ? (
          <section id="noutati" className="bg-secondary py-16 sm:py-24">
            <Container>
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <SectionHeading
                  eyebrow={L("newsEyebrow", "Noutăți și povești")}
                  title={L("newsTitle", "De citit înainte de vizită")}
                  description={L(
                    "newsDescription",
                    "Ghiduri, interviuri și noutăți."
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
        ) : null;

      case "newsletter":
        return <NewsletterSection slug={slug} labels={config.labels} />;

      default:
        return null;
    }
  };

  // Sections render in the admin-defined order (config.sections), honoring both
  // visibility and reordering. Custom sections use the generic renderer.
  const orderedSections = config.sections.filter((s) => s.visible ?? true);

  return (
    <>
      <JsonLd data={jsonLd} />

      {orderedSections.map((s) => {
        if (s.custom) {
          return (
            <CustomSection
              key={s.id}
              section={s}
              content={content}
              slug={slug}
            />
          );
        }
        const node = renderSection(s.id);
        if (!node) return null;
        return <Fragment key={s.id}>{node}</Fragment>;
      })}
    </>
  );
}
