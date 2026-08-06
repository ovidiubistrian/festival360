import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/public/page-hero";
import { ProgramSchedule } from "@/components/public/program-schedule";
import { formatDateRange } from "@/lib/utils";
import type { ProgramCategory } from "@/lib/tenants/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  return tenantMetadata(t, {
    pageTitle: "Program",
    description: `Programul complet al ${info.name}: gastronomie, muzică, ateliere și meșteșuguri.`,
    path: "/program",
  });
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const categories = Array.from(
    new Set(content.program.map((e) => e.category))
  ) as ProgramCategory[];
  const L = (k: string, fb: string) => config.labels?.[k] ?? fb;

  return (
    <>
      <PageHero
        eyebrow="Trei zile de festival"
        title={L("programPageTitle", "Programul festivalului")}
        description={L(
          "programPageDescription",
          `${formatDateRange(
            config.info.startDate,
            config.info.endDate
          )} · ${config.info.locationName}, ${config.info.city}`
        )}
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Program" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Program complet"
              title="Zeci de momente, în trei zile"
              description="Alege ziua și filtrează după categorie pentru a-ți construi propriul traseu prin festival."
            />
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-terracotta" />
                {formatDateRange(config.info.startDate, config.info.endDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-terracotta" />
                {config.info.locationName}, {config.info.city}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categorii:
            </span>
            {categories.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>

          <div className="mt-10">
            <ProgramSchedule events={content.program} />
          </div>
        </Container>
      </section>
    </>
  );
}
