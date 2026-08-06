"use client";

import * as React from "react";
import {
  Snowflake,
  Sun,
  Thermometer,
  Layers,
  Droplets,
  Wind,
  Mountain,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import type {
  ConditionMetric,
  ConditionSeason,
  Conditions,
} from "@/lib/tenants/types";
import { cn } from "@/lib/utils";

type Season = "winter" | "summer";

/** Frontend fallback defaults — used when the config object is empty. */
const DEFAULTS: Record<Season, Required<ConditionSeason>> = {
  winter: {
    headline: "Condiții de iarnă",
    metrics: [
      { label: "Temperatură", value: "-3°C" },
      { label: "Strat de zăpadă", value: "45 cm" },
      { label: "Stare pârtii", value: "Pârtii deschise" },
    ],
  },
  summer: {
    headline: "Condiții de vară",
    metrics: [
      { label: "Temperatură", value: "21°C" },
      { label: "Temperatura apei lacului", value: "18°C" },
      { label: "Stare trasee", value: "Trasee deschise" },
    ],
  },
};

const DEFAULT_NOTE = "Date orientative, cu titlu demonstrativ.";

const SEASON_ICON: Record<Season, React.ReactNode> = {
  winter: <Snowflake className="h-6 w-6" />,
  summer: <Sun className="h-6 w-6" />,
};

/** Pick a sensible card icon for a metric based on its label (diacritics-aware). */
function metricIcon(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes("temperatur")) return <Thermometer className="h-5 w-5" />;
  if (l.includes("zăpad") || l.includes("zapad") || l.includes("strat"))
    return <Layers className="h-5 w-5" />;
  if (l.includes("apă") || l.includes("apa") || l.includes("lac") || l.includes("umid"))
    return <Droplets className="h-5 w-5" />;
  if (l.includes("vânt") || l.includes("vant"))
    return <Wind className="h-5 w-5" />;
  if (l.includes("altitud") || l.includes("nivel") || l.includes("vârf"))
    return <Mountain className="h-5 w-5" />;
  return <CheckCircle2 className="h-5 w-5" />;
}

/** Resolve a season's content, falling back to defaults when unconfigured. */
function resolveSeason(
  season: Season,
  config?: ConditionSeason
): { headline: string; metrics: ConditionMetric[] } {
  return {
    headline: config?.headline?.trim() || DEFAULTS[season].headline,
    metrics: config?.metrics ?? DEFAULTS[season].metrics,
  };
}

export function ConditionsWidget({ conditions }: { conditions?: Conditions }) {
  const seasons: Season[] =
    conditions?.seasons && conditions.seasons.length > 0
      ? conditions.seasons
      : ["winter", "summer"];
  const note = conditions?.note?.trim() || DEFAULT_NOTE;

  const [season, setSeason] = React.useState<Season>(seasons[0]);
  // Keep the active tab valid if the configured season list changes.
  const active = seasons.includes(season) ? season : seasons[0];
  const current = resolveSeason(
    active,
    active === "winter" ? conditions?.winter : conditions?.summer
  );

  return (
    <section id="conditii" className="bg-warm-white py-12 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  {SEASON_ICON[active]}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                    Condiții în stațiune
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold text-primary sm:text-3xl">
                    {current.headline}
                  </h2>
                </div>
              </div>

              {seasons.length > 1 ? (
                <div
                  className="inline-flex rounded-full border border-border bg-warm-white p-1"
                  role="group"
                  aria-label="Alege sezonul"
                >
                  {seasons.includes("winter") ? (
                    <SeasonToggle
                      active={active === "winter"}
                      onClick={() => setSeason("winter")}
                    >
                      <Snowflake className="h-4 w-4" />
                      Iarnă
                    </SeasonToggle>
                  ) : null}
                  {seasons.includes("summer") ? (
                    <SeasonToggle
                      active={active === "summer"}
                      onClick={() => setSeason("summer")}
                    >
                      <Sun className="h-4 w-4" />
                      Vară
                    </SeasonToggle>
                  ) : null}
                </div>
              ) : null}
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              {current.metrics.map((m, i) => (
                <div
                  key={`${m.label}-${i}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-warm-white p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    {metricIcon(m.label)}
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">{m.label}</dt>
                    <dd className="font-serif text-xl font-semibold text-primary">
                      {m.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            {note ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {note}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SeasonToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-charcoal/70 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}
