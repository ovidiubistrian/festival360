import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Mail, Phone, MapPin, CalendarDays } from "lucide-react";
import { getTenantBundle } from "@/lib/api";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { PageHero } from "@/components/public/page-hero";
import { ContactForm } from "@/components/public/contact-form";
import { formatDateRange } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) return {};
  const { info } = t.config;
  const title = "Contact";
  const description = `Ia legătura cu echipa festivalului ${info.name}: email, telefon, adresă și formular de contact.`;
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const t = await getTenantBundle(tenant);
  if (!t) notFound();

  const { config, slug } = t;
  const { contact, social, info } = config;

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    contact.mapEmbedQuery
  )}&output=embed`;

  const socials = [
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.youtube, label: "YouTube", Icon: YoutubeIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof FacebookIcon } =>
    Boolean(s.href)
  );

  return (
    <>
      <PageHero
        eyebrow="Suntem aici pentru tine"
        title="Contact"
        description="Ai o întrebare despre festival, expozanți sau parteneriate? Scrie-ne — îți răspundem cu drag."
        image={info.heroImage}
        crumbs={[{ label: "Acasă", href: `/${slug}` }, { label: "Contact" }]}
      />

      <section className="bg-warm-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* Contact info */}
            <div>
              <SectionHeading
                eyebrow="Detalii de contact"
                title="Cum ne găsești"
              />
              <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
                <ContactRow icon={<Mail className="h-5 w-5" />} label="Email">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-charcoal/80 hover:text-terracotta"
                  >
                    {contact.email}
                  </a>
                </ContactRow>
                <ContactRow icon={<Phone className="h-5 w-5" />} label="Telefon">
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="text-charcoal/80 hover:text-terracotta"
                  >
                    {contact.phone}
                  </a>
                </ContactRow>
                <ContactRow icon={<MapPin className="h-5 w-5" />} label="Adresă">
                  <span className="text-charcoal/80">
                    {contact.address}, {contact.city}, {contact.county}
                  </span>
                </ContactRow>
                <ContactRow
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Datele festivalului"
                >
                  <span className="text-charcoal/80">
                    {formatDateRange(info.startDate, info.endDate)}
                  </span>
                </ContactRow>

                {socials.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Urmărește-ne
                    </p>
                    <div className="flex gap-3">
                      {socials.map(({ href, label, Icon }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-warm-white text-primary transition-colors hover:border-primary/30 hover:text-terracotta"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-border">
                <iframe
                  src={mapSrc}
                  title={`Harta locației ${info.locationName}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </div>

            {/* Contact form */}
            <div>
              <SectionHeading
                eyebrow="Scrie-ne"
                title="Trimite-ne un mesaj"
                description="Completează formularul și revenim către tine cât mai curând posibil."
              />
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}
