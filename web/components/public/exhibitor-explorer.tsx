"use client";

import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExhibitorCard } from "@/components/public/cards/exhibitor-card";
import { cn } from "@/lib/utils";
import type { Exhibitor } from "@/lib/tenants/types";

export function ExhibitorExplorer({
  exhibitors,
  slug,
}: {
  exhibitors: Exhibitor[];
  slug: string;
}) {
  const published = React.useMemo(
    () => exhibitors.filter((e) => e.status === "published"),
    [exhibitors]
  );
  const categories = React.useMemo(
    () => Array.from(new Set(published.map((e) => e.category))),
    [published]
  );
  const regions = React.useMemo(
    () => Array.from(new Set(published.map((e) => e.region))),
    [published]
  );

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [region, setRegion] = React.useState<string>("all");

  const results = published.filter((e) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.town.toLowerCase().includes(q) ||
      e.shortDescription.toLowerCase().includes(q);
    const matchesCat = category === "all" || e.category === category;
    const matchesReg = region === "all" || e.region === region;
    return matchesQuery && matchesCat && matchesReg;
  });

  return (
    <div>
      <div className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută expozant, localitate…"
            className="pl-10"
            aria-label="Caută expozanți"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipRow
            label="Categorie"
            value={category}
            onChange={setCategory}
            options={categories}
          />
          <ChipRow
            label="Regiune"
            value={region}
            onChange={setRegion}
            options={regions}
          />
        </div>
      </div>

      <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        {results.length} expozanți găsiți
      </p>

      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((e) => (
            <ExhibitorCard key={e.id} exhibitor={e} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChipRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <Chip active={value === "all"} onClick={() => onChange("all")}>
          Toate
        </Chip>
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
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
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-warm-white text-charcoal/70 hover:border-primary/30"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <p className="font-serif text-lg text-primary">Niciun rezultat</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Încearcă alți termeni de căutare sau resetează filtrele.
      </p>
    </div>
  );
}
