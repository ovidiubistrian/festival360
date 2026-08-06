import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Reveal } from "@/components/shared/reveal";
import { Icon } from "@/components/shared/icon";
import type { Experience, TenantLabels } from "@/lib/tenants/types";

export function ExperiencesSection({
  experiences,
  labels,
}: {
  experiences: Experience[];
  labels?: TenantLabels;
}) {
  const L = (k: string, fb: string) => labels?.[k] ?? fb;
  return (
    <section id="experiente" className="bg-secondary py-20 sm:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow={L("experiencesEyebrow", "Zone și experiențe")}
          title={L("experiencesTitle", "Șase lumi, într-un singur festival")}
          description={L(
            "experiencesDescription",
            "De la gustul preparatelor gătite pe loc, la gesturile meșterilor și liniștea muntelui — VATRA este o experiență completă."
          )}
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
  );
}
