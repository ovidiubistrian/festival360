import { Mail } from "lucide-react";
import { Container } from "@/components/shared/container";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { Reveal } from "@/components/shared/reveal";
import type { TenantLabels } from "@/lib/tenants/types";

export function NewsletterSection({
  slug,
  labels,
}: {
  slug: string;
  labels?: TenantLabels;
}) {
  const L = (k: string, fb: string) => labels?.[k] ?? fb;
  return (
    <section className="bg-secondary py-20 sm:py-24">
      <Container>
        <Reveal className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-[0_1px_2px_rgba(32,37,34,0.04)] sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Mail className="h-6 w-6" />
          </span>
          <h2 className="mt-6 font-serif text-3xl font-semibold text-primary">
            {L("newsletterTitle", "Rămâi aproape de noi")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            {L(
              "newsletterDescription",
              "Abonează-te și primești noutățile direct pe email. Fără spam, doar lucruri bune."
            )}
          </p>
          <div className="mx-auto mt-7 max-w-md">
            <NewsletterForm slug={slug} />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
