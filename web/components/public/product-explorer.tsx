"use client";

import * as React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/public/cards/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/tenants/types";

export function ProductExplorer({
  products,
  slug,
}: {
  products: Product[];
  slug: string;
}) {
  const published = React.useMemo(
    () => products.filter((p) => p.status === "published"),
    [products]
  );
  const categories = React.useMemo(
    () => Array.from(new Set(published.map((p) => p.category))),
    [published]
  );
  const regions = React.useMemo(
    () => Array.from(new Set(published.map((p) => p.region))),
    [published]
  );

  const hasSeasons = React.useMemo(
    () => published.some((p) => p.season && p.season !== "all"),
    [published]
  );

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [region, setRegion] = React.useState("all");
  const [season, setSeason] = React.useState("all");

  const results = published.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.producer.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q);
    const matchesCat = category === "all" || p.category === category;
    const matchesReg = region === "all" || p.region === region;
    const productSeason = p.season ?? "all";
    const matchesSeason =
      season === "all" || productSeason === "all" || productSeason === season;
    return matchesQuery && matchesCat && matchesReg && matchesSeason;
  });

  return (
    <div>
      <div className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută produs, producător…"
            className="pl-10"
            aria-label="Caută produse"
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
        {hasSeasons && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sezon
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip active={season === "all"} onClick={() => setSeason("all")}>
                Toate
              </Chip>
              <Chip
                active={season === "winter"}
                onClick={() => setSeason("winter")}
              >
                Iarnă
              </Chip>
              <Chip
                active={season === "summer"}
                onClick={() => setSeason("summer")}
              >
                Vară
              </Chip>
            </div>
          </div>
        )}
      </div>

      <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        {results.length} produse găsite
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-serif text-lg text-primary">Niciun rezultat</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Încearcă alți termeni de căutare sau resetează filtrele.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} slug={slug} />
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
