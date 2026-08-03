import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Icon } from "@/components/shared/icon";
import { IMG } from "@/lib/tenants/prispa/images";
import type { Stat } from "@/lib/tenants/types";

export function AboutSection({
  description,
  stats,
}: {
  description: string;
  stats: Stat[];
}) {
  return (
    <section id="despre" className="bg-warm-white py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
              Despre festival
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">
              Un sat întreg, adus în inima Brașovului
            </h2>
            <p className="mt-5 text-base leading-relaxed text-charcoal/75">
              {description}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <dd className="font-serif text-2xl font-semibold text-primary">
                      {s.value}
                    </dd>
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delayIndex={1} className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <ImageWithFallback
                src={IMG.aboutCollage}
                alt="Atmosferă de festival în Piața Sfatului"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                fallbackLabel="PRISPA"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden w-48 overflow-hidden rounded-2xl border-4 border-warm-white shadow-lg sm:block">
              <div className="relative aspect-square">
                <ImageWithFallback
                  src={IMG.cheese}
                  alt="Produse tradiționale"
                  fill
                  sizes="200px"
                  fallbackLabel="Produse"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
