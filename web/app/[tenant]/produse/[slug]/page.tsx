import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Store, ArrowUpRight } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { tenantMetadata, tenantPublicUrl } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/public/page-hero";
import { ProductCard } from "@/components/public/cards/product-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const product = t.content.products.find((p) => p.slug === slug);
  if (!product) return {};
  return tenantMetadata(t, {
    pageTitle: product.name,
    description: product.shortDescription,
    path: `/produse/${product.slug}`,
    image: product.image,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug: productSlug } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { content, slug } = t;
  const product = content.products.find((p) => p.slug === productSlug);
  if (!product) notFound();

  const exhibitor = content.exhibitors.find((e) => e.id === product.exhibitorId);

  const similar = content.products
    .filter(
      (p) =>
        p.status === "published" &&
        p.id !== product.id &&
        p.category === product.category
    )
    .slice(0, 4);

  const base = await tenantPublicUrl(t, "/");
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.shortDescription
      ? { description: product.shortDescription }
      : {}),
    ...(product.image ? { image: [product.image] } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.producer
      ? { brand: { "@type": "Brand", name: product.producer } }
      : {}),
  };
  const jsonLd = [
    productJsonLd,
    breadcrumbJsonLd(base, [
      { name: "Acasă", path: "/" },
      { name: "Produse", path: "/produse" },
      { name: product.name, path: `/produse/${product.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        eyebrow={product.category}
        title={product.name}
        description={product.shortDescription}
        image={product.image}
        crumbs={[
          { label: "Acasă", href: `/${slug}` },
          { label: "Produse", href: `/${slug}/produse` },
          { label: product.name },
        ]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Large image */}
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border lg:sticky lg:top-28 lg:self-start">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                fallbackLabel={product.name}
                className="object-cover"
              />
            </div>

            {/* Story + meta */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">
                  <MapPin className="h-3.5 w-3.5" />
                  {product.region}
                </Badge>
                {product.price && (
                  <Badge variant="terracotta">{product.price}</Badge>
                )}
              </div>

              <h2 className="mt-4 font-serif text-3xl font-semibold text-primary sm:text-4xl">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Producător: {product.producer}
              </p>

              <div className="prose-editorial mt-6">
                {product.story
                  .split(/\n{2,}/)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>

              {/* Producer card */}
              {exhibitor && (
                <Link
                  href={`/${slug}/expozanti/${exhibitor.slug}`}
                  className="group mt-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/25"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <ImageWithFallback
                      src={exhibitor.image}
                      alt={exhibitor.name}
                      fill
                      sizes="64px"
                      fallbackLabel={exhibitor.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Store className="h-3.5 w-3.5" />
                      Producător
                    </p>
                    <p className="mt-0.5 font-serif text-lg font-semibold text-primary">
                      {exhibitor.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {exhibitor.town}, {exhibitor.county}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-terracotta transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Product gallery */}
          {product.gallery.length > 0 && (
            <div className="mt-16">
              <SectionHeading eyebrow="Galerie" title="Mai multe imagini" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {product.gallery.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border"
                  >
                    <ImageWithFallback
                      src={src}
                      alt={`${product.name} — imagine ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      fallbackLabel={product.name}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Similar products */}
      {similar.length > 0 && (
        <section className="bg-secondary py-20 sm:py-28">
          <Container>
            <SectionHeading
              eyebrow="Îți mai recomandăm"
              title="Produse similare"
              description={`Alte produse din categoria ${product.category}.`}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} slug={slug} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
