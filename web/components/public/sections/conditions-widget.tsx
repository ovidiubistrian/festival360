"use client";

import * as React from "react";
import {
  Snowflake,
  Sun,
  Thermometer,
  Layers,
  Droplets,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

type Season = "winter" | "summer";

interface Metric {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const DATA: Record<
  Season,
  { icon: React.ReactNode; headline: string; metrics: Metric[] }
> = {
  winter: {
    icon: <Snowflake className="h-6 w-6" />,
    headline: "Condiții de iarnă",
    metrics: [
      {
        icon: <Thermometer className="h-5 w-5" />,
        label: "Temperatură",
        value: "-3°C",
      },
      {
        icon: <Layers className="h-5 w-5" />,
        label: "Strat de zăpadă",
        value: "45 cm",
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        label: "Stare pârtii",
        value: "Pârtii deschise",
      },
    ],
  },
  summer: {
    icon: <Sun className="h-6 w-6" />,
    headline: "Condiții de vară",
    metrics: [
      {
        icon: <Thermometer className="h-5 w-5" />,
        label: "Temperatură",
        value: "21°C",
      },
      {
        icon: <Droplets className="h-5 w-5" />,
        label: "Temperatura apei lacului",
        value: "18°C",
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        label: "Stare trasee",
        value: "Trasee deschise",
      },
    ],
  },
};

export function ConditionsWidget() {
  const [season, setSeason] = React.useState<Season>("winter");
  const current = DATA[season];

  return (
    <section id="conditii" className="bg-warm-white py-12 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  {current.icon}
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

              <div
                className="inline-flex rounded-full border border-border bg-warm-white p-1"
                role="group"
                aria-label="Alege sezonul"
              >
                <SeasonToggle
                  active={season === "winter"}
                  onClick={() => setSeason("winter")}
                >
                  <Snowflake className="h-4 w-4" />
                  Iarnă
                </SeasonToggle>
                <SeasonToggle
                  active={season === "summer"}
                  onClick={() => setSeason("summer")}
                >
                  <Sun className="h-4 w-4" />
                  Vară
                </SeasonToggle>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              {current.metrics.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-4 rounded-xl border border-border bg-warm-white p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    {m.icon}
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

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Date orientative, cu titlu demonstrativ.
            </p>
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
