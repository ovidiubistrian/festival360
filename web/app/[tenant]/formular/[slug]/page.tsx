import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getForm, getTenantBundle } from "@/lib/api";
import { tenantMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/container";
import { PageHero } from "@/components/public/page-hero";
import { DynamicForm } from "@/components/public/dynamic-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}): Promise<Metadata> {
  const { tenant, slug } = await params;
  const [t, form] = await Promise.all([
    getTenantBundle(tenant),
    getForm(tenant, slug),
  ]);
  if (!t || !form) return {};
  return tenantMetadata(t, {
    pageTitle: form.title,
    description: form.description || `${form.title} — ${t.config.info.name}.`,
    path: `/formular/${slug}`,
  });
}

/**
 * Pagina publică a unui formular construit din admin. Trimisă ca link, deci nu
 * apare în meniu: se ajunge la ea doar cu adresa.
 */
export default async function FormPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug } = await params;
  const [t, form] = await Promise.all([
    getTenantBundle(tenant),
    getForm(tenant, slug),
  ]);
  // Formular inexistent sau încă în ciornă — 404, ca orice pagină nepublicată.
  if (!t || !form) notFound();

  const { config } = t;

  return (
    <>
      <PageHero
        eyebrow={config.info.name}
        title={form.title}
        description={form.description}
        image={config.info.heroImage}
        crumbs={[
          { label: "Acasă", href: `/${t.slug}` },
          { label: form.title },
        ]}
      />

      <section className="bg-warm-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <DynamicForm
              slug={t.slug}
              form={form}
              organization={config.organization ?? {}}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
