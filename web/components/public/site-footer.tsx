import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { Container } from "@/components/shared/container";
import { formatDateRange, isExternalHref } from "@/lib/utils";
import type { TenantConfig } from "@/lib/tenants/types";

export function SiteFooter({
  slug,
  config,
}: {
  slug: string;
  config: TenantConfig;
}) {
  const base = `/${slug}`;
  const { info, contact, social, navigation } = config;

  return (
    <footer className="mt-auto bg-primary text-cream">
      <Container className="py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-serif text-3xl font-semibold text-warm-white">
              {info.logoText}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
              {info.shortDescription}
            </p>
            <div className="mt-6 flex gap-3">
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <FacebookIcon />
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <InstagramIcon />
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <YoutubeIcon />
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-warm-white">
              Navigare
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {navigation.map((item) => {
                const cls =
                  "text-cream/70 transition-colors hover:text-warm-white";
                return (
                  <li key={item.href}>
                    {/* Linkurile personalizate pot ieși în afara site-ului. */}
                    {isExternalHref(item.href) ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cls}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={`${base}${item.href}`} className={cls}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-warm-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-cream/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  {info.locationName}, {info.city}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${contact.email}`} className="hover:text-warm-white">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <a href={`tel:${contact.phone}`} className="hover:text-warm-white">
                  {contact.phone}
                </a>
              </li>
            </ul>
            {info.startDate && info.endDate && (
              <p className="mt-5 text-sm font-medium text-warm-white">
                {formatDateRange(info.startDate, info.endDate)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-cream/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {info.name}. Toate drepturile rezervate.
          </p>
          <div className="flex gap-6">
            <Link href={`${base}/despre`} className="hover:text-warm-white">
              Termeni
            </Link>
            <Link href={`${base}/despre`} className="hover:text-warm-white">
              Confidențialitate
            </Link>
            <Link href="/" className="hover:text-warm-white">
              Siteora
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
