import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/public/page-hero";
import { ArticleCard } from "@/components/public/cards/article-card";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Noutăți și povești";
  const description = `Poveștile producătorilor, ghiduri, interviuri și noutăți din lumea festivalului ${info.name}.`;
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

export default async function NewsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, content, slug } = t;
  const published = content.articles.filter((a) => a.status === "published");
  const featured = published.find((a) => a.featured) ?? published[0];
  const rest = published.filter((a) => a.id !== featured?.id);

  return (
    <>
      <PageHero
        eyebrow="Noutăți și povești"
        title="De citit înainte de festival"
        description="Poveștile producătorilor, ghiduri de călătorie, interviuri și noutăți din lumea PRISPA."
        image={config.info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Noutăți" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          {featured && (
            <Reveal>
              <Link
                href={`/${slug}/noutati/${featured.slug}`}
                className="group grid overflow-hidden rounded-3xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_rgba(32,37,34,0.12)] lg:grid-cols-2"
              >
                <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
                  <ImageWithFallback
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    fallbackLabel={featured.title}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge
                    variant="gold"
                    className="absolute left-4 top-4 backdrop-blur"
                  >
                    Recomandat
                  </Badge>
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-10">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary">{featured.category}</Badge>
                    <span>{formatDate(featured.date)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {featured.readingMinutes} min
                    </span>
                  </div>
                  <h2 className="mt-4 font-serif text-2xl font-semibold leading-snug text-primary transition-colors group-hover:text-terracotta sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-base leading-relaxed text-charcoal/70">
                    {featured.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-terracotta">
                    Citește articolul
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )}

          {rest.length > 0 && (
            <>
              <div className="mt-16">
                <SectionHeading
                  eyebrow="Toate articolele"
                  title="Mai multe povești"
                />
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a, i) => (
                  <Reveal key={a.id} delayIndex={i % 3} as="article">
                    <ArticleCard article={a} slug={slug} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
