import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { ExperienceCard } from "@/components/public/cards/experience-card";
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
            <Reveal key={exp.id} delayIndex={i % 3} className="h-full">
              <ExperienceCard experience={exp} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
