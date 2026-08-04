import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Container } from "@/components/shared/container";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHero({
  title,
  description,
  image,
  crumbs,
  eyebrow,
}: {
  title: string;
  description?: string;
  image: string;
  crumbs: Crumb[];
  eyebrow?: string;
}) {
  return (
    <section className="relative flex min-h-[46vh] items-end overflow-hidden pt-20">
      <ImageWithFallback
        src={image}
        alt={title}
        fill
        priority
        sizes="100vw"
        fallbackLabel={title}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-charcoal/30" />
      <Container className="relative z-10 pb-12 pt-10">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-cream/80">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {c.href ? (
                  <Link href={c.href} className="hover:text-warm-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-warm-white">{c.label}</span>
                )}
                {i < crumbs.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                )}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl font-serif text-4xl font-semibold text-warm-white sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/85 sm:text-lg">
            {description}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
