import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, User } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal } from "@/components/shared/reveal";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/public/page-hero";
import { ArticleCard } from "@/components/public/cards/article-card";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const article = t.content.articles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} · ${t.config.info.name}`,
      description: article.excerpt,
      images: [article.coverImage],
      type: "article",
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: articleSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { content, slug } = t;
  const article = content.articles.find((a) => a.slug === articleSlug);
  if (!article) notFound();

  const recommended = content.articles
    .filter((a) => a.status === "published" && a.id !== article.id)
    .sort((a, b) => (b.category === article.category ? 1 : 0) - (a.category === article.category ? 1 : 0))
    .slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={article.category}
        title={article.title}
        description={article.excerpt}
        image={article.coverImage}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Noutăți", href: `/${slug}/noutati` },
          { label: article.title },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">{article.category}</Badge>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {article.author}
              </span>
              <span>{formatDate(article.date)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {article.readingMinutes} min de citit
              </span>
            </div>

            <div
              className="prose-editorial mt-8"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </div>
        </Container>
      </section>

      {recommended.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Continuă lectura"
              title="Articole recomandate"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((a, i) => (
                <Reveal key={a.id} delayIndex={i % 3} as="article">
                  <ArticleCard article={a} slug={slug} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
