"use client";

import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { ProgramEvent, ProgramCategory } from "@/lib/tenants/types";

const categoryVariant: Record<
  ProgramCategory,
  "default" | "gold" | "terracotta" | "secondary" | "muted"
> = {
  Gastronomie: "terracotta",
  Muzică: "default",
  Atelier: "gold",
  Meșteșuguri: "secondary",
  Turism: "default",
  Copii: "gold",
  Conferință: "muted",
};

export function ProgramSchedule({
  events,
  limitPerDay,
}: {
  events: ProgramEvent[];
  limitPerDay?: number;
}) {
  const days = React.useMemo(() => {
    const set = new Map<number, ProgramEvent[]>();
    for (const e of events) {
      if (!set.has(e.day)) set.set(e.day, []);
      set.get(e.day)!.push(e);
    }
    return Array.from(set.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([day, list]) => ({
        day,
        date: list[0].date,
        list: list.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [events]);

  const categories = React.useMemo(
    () => Array.from(new Set(events.map((e) => e.category))),
    [events]
  );
  const [filter, setFilter] = React.useState<ProgramCategory | "all">("all");

  if (days.length === 0) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-charcoal/70 hover:border-primary/30"
          )}
        >
          Toate
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-charcoal/70 hover:border-primary/30"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <Tabs defaultValue={String(days[0].day)}>
        <TabsList className="flex-wrap">
          {days.map((d) => (
            <TabsTrigger key={d.day} value={String(d.day)}>
              Ziua {d.day}
              <span className="ml-1.5 hidden text-xs opacity-70 sm:inline">
                {formatDate(d.date).replace(/ \d{4}$/, "")}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((d) => {
          const visible = d.list.filter(
            (e) => filter === "all" || e.category === filter
          );
          const shown = limitPerDay ? visible.slice(0, limitPerDay) : visible;
          return (
            <TabsContent key={d.day} value={String(d.day)}>
              {shown.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  Nu există evenimente în această categorie pentru ziua selectată.
                </p>
              ) : (
                <ol className="space-y-3">
                  {shown.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/25 sm:flex-row sm:items-center sm:gap-6 sm:p-5"
                    >
                      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary sm:w-32 sm:flex-col sm:items-start sm:gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-terracotta" />
                          {e.startTime} – {e.endTime}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-lg font-semibold text-charcoal">
                            {e.title}
                          </h3>
                          <Badge variant={categoryVariant[e.category]}>
                            {e.category}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-charcoal/70">
                          {e.description}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {e.stage}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
