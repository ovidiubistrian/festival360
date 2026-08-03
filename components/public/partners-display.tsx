import { ExternalLink } from "lucide-react";
import { PartnerLogo } from "@/components/shared/partner-logo";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import type { Partner, PartnerTier } from "@/lib/tenants/types";

const TIER_ORDER: PartnerTier[] = [
  "Organizator",
  "Partener instituțional",
  "Partener principal",
  "Sponsor",
  "Partener media",
  "Partener local",
];

export function PartnersDisplay({ partners }: { partners: Partner[] }) {
  const published = partners.filter((p) => p.status === "published");

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: published
      .filter((p) => p.tier === tier)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-14">
      {grouped.map(({ tier, items }) => {
        const isPrincipal =
          tier === "Organizator" || tier === "Partener principal";
        return (
          <div key={tier}>
            <div className="mb-6 flex items-center gap-4">
              <h3 className="font-serif text-xl font-semibold text-primary">
                {tier}
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            {isPrincipal ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p, i) => (
                  <Reveal
                    key={p.id}
                    delayIndex={i}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(32,37,34,0.04)]"
                  >
                    <div className="flex items-center gap-4">
                      <PartnerLogo logo={p.logo} name={p.name} />
                      <div>
                        <p className="font-serif text-lg font-semibold text-charcoal">
                          {p.name}
                        </p>
                        {p.featuredOnHome && (
                          <Badge variant="gold" className="mt-1">
                            Evidențiat
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-charcoal/70">
                      {p.description}
                    </p>
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:underline"
                    >
                      Vizitează site-ul
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => (
                  <a
                    key={p.id}
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/25"
                    title={p.description}
                  >
                    <PartnerLogo logo={p.logo} name={p.name} />
                    <span className="text-sm font-medium text-charcoal/80 group-hover:text-primary">
                      {p.name}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
