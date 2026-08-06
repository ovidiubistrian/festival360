import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { PartnersDisplay } from "@/components/public/partners-display";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Parteneri și sponsori";
  const description = `Organizatorii, partenerii și sponsorii care fac posibil festivalul ${info.name}.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${info.name}`,
      description,
      images: [info.heroImage],
    },
  };
}

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;

  return (
    <>
      <PageHero
        eyebrow="Alături de noi"
        title="Parteneri și sponsori"
        description="Festivalul VATRA este posibil datorită celor care cred în satul românesc și în producătorii lui."
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Parteneri" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Comunitatea VATRA"
            title="Împreună pentru tradiție"
            description="De la organizatori și parteneri instituționali, la sponsori și parteneri media — fiecare are un rol în festival."
          />
          <div className="mt-12">
            <PartnersDisplay partners={content.partners} />
          </div>

          <div className="mt-16 overflow-hidden rounded-3xl border border-border bg-secondary">
            <div className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="max-w-2xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-warm-white text-primary">
                  <Handshake className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-primary sm:text-3xl">
                  Vrei să devii partener?
                </h3>
                <p className="mt-3 text-base leading-relaxed text-charcoal/70">
                  Ne bucurăm să construim alături de organizații care susțin
                  producătorii locali și turismul autentic. Scrie-ne și îți
                  prezentăm oportunitățile de colaborare.
                </p>
              </div>
              <Button asChild variant="terracotta" size="lg">
                <Link href={`/${slug}/contact`}>
                  Contactează-ne
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
